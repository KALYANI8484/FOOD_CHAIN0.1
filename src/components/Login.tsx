import { useEffect, useState } from 'react';
import {
  UtensilsCrossed, Shield, Users, Store, ShoppingBag,
  Eye, EyeOff, ArrowRight, Lock, Mail, MapPin, ChevronLeft,
} from 'lucide-react';
import { Button, Spinner } from './ui';

type Role = 'super_admin' | 'sub_admin' | 'vendor' | 'client';

interface LoginProps {
  onLogin: (role: Role, cred?: string) => void;
  onBack?: () => void;
  initialRole?: Role;
}

const SUPER_ADMIN_EMAIL = '2711vikram@gmail.com';
const SUPER_ADMIN_PASSWORD = 'Tatwavivek@271';

const SUB_ADMIN_EMAIL = 'kalyani@123';
const SUB_ADMIN_PASSWORD = '123456';

const VENDOR_EMAIL = 'vendor@123';
const VENDOR_PASSWORD = '1234567';

const roles: { id: Role; label: string; desc: string; icon: typeof Shield; color: string; gradient: string }[] = [
  { id: 'super_admin', label: 'Super Admin', desc: 'Full platform control', icon: Shield, color: 'text-orange-400', gradient: 'from-orange-500/20 to-red-500/10 border-orange-500/20' },
  { id: 'sub_admin', label: 'Sub-Admin', desc: 'Vendor management', icon: Users, color: 'text-blue-400', gradient: 'from-blue-500/20 to-cyan-500/10 border-blue-500/20' },
  { id: 'vendor', label: 'Vendor', desc: 'Order radar & inventory', icon: Store, color: 'text-green-400', gradient: 'from-green-500/20 to-emerald-500/10 border-green-500/20' },
  { id: 'client', label: 'Client', desc: 'Order your favourite food', icon: ShoppingBag, color: 'text-purple-400', gradient: 'from-purple-500/20 to-pink-500/10 border-purple-500/20' },
];

export function Login({ onLogin, onBack, initialRole }: LoginProps) {
  const [selected, setSelected] = useState<Role | null>(initialRole ?? null);

  useEffect(() => {
    if (initialRole) {
      setSelected(initialRole);
    }
  }, [initialRole]);

  return (
    <div className="min-h-screen bg-bg noise relative overflow-hidden flex items-center justify-center p-6">
      {/* Back to home */}
      {onBack && (
        <button onClick={onBack} className="absolute top-6 left-6 text-muted hover:text-text transition-colors text-sm flex items-center gap-1.5 group z-10">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Home
        </button>
      )}
      {/* BG orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] top-[-80px] left-[-80px]"
          style={{ background: 'radial-gradient(circle, #A0A0D0, transparent 70%)' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full opacity-10 blur-[100px] bottom-0 right-0"
          style={{ background: 'radial-gradient(circle, #8888BB, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-4xl">
        {/* Logo */}
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center">
              <UtensilsCrossed size={22} className="text-white" />
            </div>
            <span className="text-3xl font-bold tracking-tight">VIKRAM ADVERTISING</span>
          </div>
          <p className="text-muted">Sign in to your workspace</p>
        </div>

        {!selected ? (
          <RoleSelector onSelect={setSelected} />
        ) : (
          <CredentialForm role={selected} onLogin={onLogin} onBack={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}

function RoleSelector({ onSelect }: { onSelect: (r: Role) => void }) {
  return (
    <div className="animate-scale-in">
      <p className="text-center text-sm text-muted mb-6 uppercase tracking-wider font-semibold">Choose your role to continue</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {roles.map((r, i) => (
          <button
            key={r.id}
            onClick={() => onSelect(r.id)}
            className={`group relative card p-6 text-left bg-gradient-to-br ${r.gradient} border hover-lift transition-all duration-300 animate-fade-in-up`}
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center ${r.color} group-hover:scale-110 transition-transform duration-300`}>
                <r.icon size={26} />
              </div>
              <div className="flex-1">
                <p className="text-xl font-bold">{r.label}</p>
                <p className="text-sm text-muted mt-0.5">{r.desc}</p>
              </div>
              <ArrowRight size={18} className={`${r.color} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300`} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CredentialForm({ role, onLogin, onBack }: { role: Role; onLogin: (r: Role, cred?: string) => void; onBack: () => void }) {
  const meta = roles.find((r) => r.id === role)!;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [zip, setZip] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      if (role === 'super_admin') {
        if (email.trim().toLowerCase() !== SUPER_ADMIN_EMAIL) {
          setError('Invalid email or password');
          return;
        }
        if (password !== SUPER_ADMIN_PASSWORD) {
          setError('Invalid email or password');
          return;
        }
        onLogin('super_admin', email.trim());

      } else if (role === 'sub_admin') {
        if (email.trim().toLowerCase() !== SUB_ADMIN_EMAIL || password !== SUB_ADMIN_PASSWORD) {
          setError('Invalid email or password');
          return;
        }
        onLogin('sub_admin', email.trim());

      } else if (role === 'vendor') {
        if (email.trim().toLowerCase() !== VENDOR_EMAIL || password !== VENDOR_PASSWORD) {
          setError('Invalid email or password');
          return;
        }
        onLogin('vendor', email.trim());

      } else if (role === 'client') {
        if (!zip || zip.length < 4) { setError('Please enter a valid ZIP code'); return; }
        onLogin('client', zip);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto animate-scale-in">
      <button onClick={onBack} className="flex items-center gap-1.5 text-muted hover:text-text transition-colors text-sm mb-6 group">
        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> All roles
      </button>

      <div className={`card p-8 bg-gradient-to-br ${meta.gradient} border`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center ${meta.color}`}>
            <meta.icon size={22} />
          </div>
          <div>
            <p className="font-bold text-lg">{meta.label}</p>
            <p className="text-xs text-muted">{meta.desc}</p>
          </div>
        </div>

        <div className="space-y-4">
          {role === 'client' ? (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">Your ZIP Code</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder="e.g. 560038"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-2 border border-border focus:border-accent outline-none transition-all"
                  />
                </div>

              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                  Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    placeholder={role === 'super_admin' ? 'your-email@gmail.com' : 'your@email.com'}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-2 border border-border focus:border-accent outline-none transition-all"
                    autoComplete="username"
                  />
                </div>
              </div>

              {(
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-12 py-3 rounded-xl bg-surface-2 border border-border focus:border-accent outline-none transition-all"
                      autoComplete="current-password"
                    />
                    <button
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}


            </>
          )}

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button className="w-full" size="lg" onClick={handleLogin} disabled={loading}>
            {loading ? <Spinner /> : <>Sign In <ArrowRight size={16} /></>}
          </Button>
        </div>
      </div>
    </div>
  );
}
