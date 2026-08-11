// Shared session-token key + fetch patch. The token is issued by /api/auth/login
// (see signToken in server.js) and needs to accompany every /api/db request so the
// server can tell a real logged-in admin/vendor apart from an unauthenticated caller
// (see getAuth/isAdmin in server.js). This patches window.fetch once, at app startup,
// instead of touching every individual fetch('/api/db', ...) call site across the app
// — including the ones made indirectly through the supabase.from(...) shim.
export const SESSION_TOKEN_KEY = 'session_token';

export function installSessionAuthFetch() {
  const originalFetch = window.fetch.bind(window);
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
    if (url && url.startsWith('/api/db')) {
      const token = localStorage.getItem(SESSION_TOKEN_KEY);
      if (token) {
        init = { ...(init || {}), headers: { ...(init?.headers || {}), Authorization: `Bearer ${token}` } };
      }
    }
    return originalFetch(input as any, init);
  }) as typeof window.fetch;
}
