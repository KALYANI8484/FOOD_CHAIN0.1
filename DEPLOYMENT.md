# CI/CD & Deployment

How this app gets from a merged PR to running containers on your EC2 box
(`vikramads.in`, `3.109.80.7`), and what each file does.

## Architecture

This matches your existing production setup — host nginx (TLS via Certbot, the
`vikramads.in` domain, the 3-way load balancer) stays exactly as it is; only what's
*behind* it becomes Docker images built and pushed by CI instead of hand-run processes
and an on-disk `dist/` folder.

```
Internet ──▶ host nginx :443 (Certbot TLS, unchanged)
                 │
                 ├─ /            → frontend container  (127.0.0.1:8080)
                 └─ /api,
                    /socket.io,
                    /uploads,
                    /health       → backend_servers upstream
                                     ├─ backend1  127.0.0.1:5000
                                     ├─ backend2  127.0.0.1:5001
                                     └─ backend3  127.0.0.1:5002   ──▶ MongoDB Atlas
```

- **`food-chain-backend`** image — `server.js` only (Express/Socket.IO/Mongo), no
  frontend code or build step. Run as **3 replica containers**, one per port your
  `upstream backend_servers` block already load-balances across — nothing in that block
  needs to change.
- **`food-chain-frontend`** image — the built React/Vite app served by a minimal nginx
  inside the container, reachable only on `127.0.0.1:8080` (not exposed publicly). Your
  host nginx now proxies `location /` to it instead of reading `dist/` off disk.

`server.js` is unchanged in how it runs locally (`npm run dev` still works as before). A
`GET /health` endpoint was added for the health checks below.

## Files in this setup

| File | Purpose |
|---|---|
| `Dockerfile.backend` | Multi-stage: `npm ci --omit=dev`, copies `server.js`, runs it. |
| `Dockerfile.frontend` | Multi-stage: full `npm ci` + `vite build`, ships only `dist/` inside `nginx:alpine`. |
| `nginx.conf` | The frontend **container's** own nginx — just static file serving + SPA fallback. Routing/TLS/proxying is your host nginx's job, not this one's. |
| `deploy/host-nginx.conf.example` | The small diff to apply to your real `/etc/nginx/sites-available/default` — see below. |
| `docker-compose.prod.yml` | Defines `backend1`/`backend2`/`backend3`/`frontend` for the EC2 host. Only ever **pulls** pre-built images — never builds on the server. |
| `.env.example` | Template for the real `.env` each backend container reads. Copy to `.env` on the server; never commit the real file. |
| `.dockerignore` | Keeps `node_modules`, `.git`, `.env`, docs out of the Docker build context. |
| `.github/workflows/cd.yml` | The pipeline — see below. |

## The pipeline (`.github/workflows/cd.yml`)

**Trigger:** `push` to `main`. A merged PR *is* a push to `main`, so this single trigger
covers both "push to main" and "PR merged into main" — no separate `pull_request`
trigger (which would wrongly deploy on every open PR).

**Jobs:**

1. **`changes`** — [`dorny/paths-filter`](https://github.com/dorny/paths-filter) diffs
   the push and decides whether backend files, frontend files, or both changed.
   `package.json`/`package-lock.json` count as both (one shared manifest for both sides).
2. **`build-backend`** / **`build-frontend`** — run only if their filter matched. Log
   into Docker Hub with `secrets.DOCKERHUB_TOKEN`, build, push tagged both
   `:<commit-sha>` (used for the actual deploy/rollback) and `:latest`.
3. **`deploy`** — SSHes in via `appleboy/ssh-action` and does a **rolling** update:
   - Backend: updates `backend1`, health-checks it directly on port 5000, only then
     moves to `backend2` (5001), then `backend3` (5002). nginx's upstream always has ≥2
     healthy instances during the rollout, so there's no downtime window — not by luck,
     by construction. Any instance that fails its own health check gets rolled back to
     the previous tag immediately and the job fails, leaving the rest of the fleet
     untouched and still serving traffic on the old version.
   - Frontend: single container, pulled/restarted/health-checked the same way.
   - On full success, the deployed tag is recorded in `.last_good_tag` (used as the
     rollback target next time) and old dangling images are pruned.

## Required GitHub Secrets

Settings → Secrets and variables → Actions → New repository secret:

| Secret | Value |
|---|---|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | A Docker Hub **access token** (Account Settings → Security → New Access Token), not your password |
| `EC2_HOST` | `3.109.80.7` |
| `EC2_SSH_USER` | `ubuntu` |
| `EC2_SSH_KEY` | Private key (full PEM) matching a public key in the server's `~/.ssh/authorized_keys` — use a dedicated deploy key, not your personal one (see below) |
| `EC2_SSH_PORT` | Optional, defaults to `22` |

Nothing else is hardcoded anywhere — image names are `food-chain-backend`/
`food-chain-frontend` under whatever `DOCKERHUB_USERNAME` resolves to.

```bash
# Dedicated deploy key -- don't reuse your personal one
ssh-keygen -t ed25519 -C "github-actions-deploy" -f deploy_key -N ""
# Append deploy_key.pub to ~/.ssh/authorized_keys on the EC2 host
# Paste deploy_key's contents (private half) into the EC2_SSH_KEY secret
```

## First-time EC2 setup

You already have Docker, nginx, and Certbot running — this is just adding the compose
setup alongside your existing checkout:

```bash
# If Docker Compose plugin isn't already present:
sudo apt install -y docker-compose-plugin

mkdir -p /home/ubuntu/sid/FOOD_CHAIN0.1/deploy-app
cd /home/ubuntu/sid/FOOD_CHAIN0.1/deploy-app
```

Copy `docker-compose.prod.yml` and `.env.example` from the repo into that directory
(`scp` or paste), then:

```bash
cp .env.example .env
nano .env   # fill in MONGODB_URI, and whatever optional values you use
```

**Update host nginx** — apply the diff in `deploy/host-nginx.conf.example` to
`/etc/nginx/sites-available/default` (don't overwrite wholesale, your Certbot cert paths
are already correct in the real file):
```bash
sudo nano /etc/nginx/sites-available/default
sudo nginx -t && sudo systemctl reload nginx
```

**First deploy** (images need to exist in Docker Hub first — merge any PR to `main`, or
push once manually):
```bash
export DOCKERHUB_USERNAME=<your dockerhub username>
export IMAGE_TAG=latest
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
curl http://127.0.0.1:5000/health   # backend1 directly
curl http://127.0.0.1:8080/         # frontend directly
curl https://vikramads.in/health    # through host nginx, end to end
```

**Clean up the old ad-hoc containers** once the compose-managed ones are up (the old
ones were started with plain `docker run`, not `docker compose`, so they won't collide
by name, but they're now redundant):
```bash
docker ps   # note which container IDs are the OLD (non-compose) ones
docker stop <old-id-1> <old-id-2> <old-id-3>
docker rm <old-id-1> <old-id-2> <old-id-3>
```

## Rollback

Deploys already auto-rollback per-instance on a failed health check. To roll back
everything manually to a specific past commit:
```bash
cd /home/ubuntu/sid/FOOD_CHAIN0.1/deploy-app
export DOCKERHUB_USERNAME=<your dockerhub username>
export IMAGE_TAG=<git sha of the last good commit>
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## Notes / things to revisit later

- Containers currently run as root (the base images' default). Locking the backend down
  to a non-root user is a reasonable follow-up, but the `uploads` volume's ownership
  needs handling first (the backend writes fallback file uploads to local disk when
  S3 isn't configured) — left as-is rather than risk breaking uploads untested.
- `.last_good_tag` tracks one tag for the whole fleet. Since backend and frontend are
  normally released together this is the right behavior; if they ever diverge and you
  want independent rollback points per image, split it into
  `.last_good_backend_tag` / `.last_good_frontend_tag` in the `deploy` job.
- The `location /socket.io/`, `/uploads/`, and `/health` blocks in
  `deploy/host-nginx.conf.example` are **new** — your pasted config was missing them,
  which most likely meant real-time features (Socket.IO) weren't working over HTTPS
  before this. Worth confirming once the new config is live.
