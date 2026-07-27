import { useState } from 'react';
import {
  Mail, Lock, ArrowRight, ShieldCheck, Eye, EyeOff,
  UserPlus, ChevronLeft, Phone, MapPin, Calendar,
  Hash, Store, Users, Shield
} from 'lucide-react';
import { Spinner } from './ui';

type AuthMode = 'login' | 'signup' | 'reset';

/* ── Reusable input ────────────────────────────── */
function Field({
  label, placeholder, type = 'text', value, onChange,
  icon: Icon, hint, maxLength, extra
}: {
  label: string; placeholder: string; type?: string;
  value: string; onChange: (v: string) => void;
  icon: typeof Phone; hint?: string; maxLength?: number;
  extra?: React.ReactNode;
}) {
  const [showPw, setShowPw] = useState(false);
  const inputType = type === 'password' ? (showPw ? 'text' : 'password') : type;
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">{label}</label>
      <div className="relative">
        <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type={inputType}
          value={value}
          maxLength={maxLength}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm font-medium outline-none focus:border-amber-500 focus:ring-3 focus:ring-amber-100 transition-all placeholder:text-gray-300"
        />
        {type === 'password' && (
          <button type="button" onClick={() => setShowPw(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
        {extra}
      </div>
      {hint && <p className="text-[10px] text-gray-400 mt-1 ml-1">{hint}</p>}
    </div>
  );
}


/* ── Main Component ────────────────────────────── */
export function Login({
  onLogin, onBack
}: {
  onLogin: (r: 'super_admin' | 'sub_admin' | 'vendor', cred?: string) => void;
  onBack: () => void;
}) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [sf, setSf] = useState({ name: '', phone: '', dob: '', address: '', pincode: '' });
  const patch = (k: keyof typeof sf) => (v: string) => setSf(p => ({ ...p, [k]: v }));

  const switchMode = (m: AuthMode) => { setMode(m); setError(''); setSuccess(''); };

  /* Login */
  const handleLogin = async () => {
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Invalid credentials');
      else onLogin(data.role, username.trim());
    } catch { setError('Network error — please try again'); }
    finally { setLoading(false); }
  };

  /* Vendor Signup */
  const handleSignup = async () => {
    setError(''); setSuccess('');
    if (!sf.name || !sf.phone || !sf.dob || !sf.address || !sf.pincode) {
      setError('All fields are required'); return;
    }
    if (!/^\d{8}$/.test(sf.dob)) {
      setError('Date of Birth must be exactly 8 digits in DDMMYYYY format — no slashes or dashes.'); return;
    }
    if (!/^\d{6}$/.test(sf.pincode)) {
      setError('PIN Code must be exactly 6 digits.'); return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/vendors/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner_name: sf.name, phone: sf.phone, birthdate: sf.dob, address: sf.address, zip_code: sf.pincode })
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Registration failed');
      else {
        setSuccess('Account created successfully! Redirecting to login...');
        setTimeout(() => switchMode('login'), 2000);
      }
    } catch { setError('Network error — please try again'); }
    finally { setLoading(false); }
  };

  /* Reset Password */
  const handleReset = async () => {
    setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await fetch('/api/super-admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username })
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Reset failed');
      else setSuccess(data.message || 'Reset link sent! Check your email inbox.');
    } catch { setError('Network error — please try again'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F8FF] px-6 py-12" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm font-semibold transition-colors group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>

        <div className="w-full max-w-md animate-scale-in">

          {/* ── LOGIN ───────────────────────────── */}
          {mode === 'login' && (
            <div className="space-y-6">
              <div>
                <img src="/logo.png" alt="Vikrams Ads" className="h-16 w-auto object-contain mb-5" />
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Login / Register
                </h2>
                <p className="text-gray-500 text-sm mt-1">Access your workspace below</p>
              </div>

              <div className="space-y-4">
                <Field
                  label="Email / Phone Number"
                  placeholder="admin@email.com or +91 99999..."
                  value={username} onChange={setUsername}
                  icon={Phone}
                />
                <div>
                  <Field
                    label="Password / Date of Birth"
                    placeholder="Password or DDMMYYYY (e.g. 19072004)"
                    type="password"
                    value={password} onChange={setPassword}
                    icon={Lock}
                    hint="Vendors: enter your DOB as 8 digits with no spaces, slashes, or dashes."
                  />
                  <div className="flex justify-between items-center mt-2 px-1">
                    <button
                      type="button"
                      onClick={() => switchMode('signup')}
                      className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1 hover:underline"
                    >
                      <UserPlus size={13} /> Registration
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl font-medium">
                    <span className="mt-0.5">⚠</span> {error}
                  </div>
                )}

                <button
                  onClick={handleLogin}
                  disabled={loading || !username || !password}
                  className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-sm transition-all shadow-lg shadow-amber-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                  {loading ? <Spinner /> : <><ArrowRight size={16} /> Sign In to Dashboard</>}
                </button>
              </div>
            </div>
          )}

          {/* ── VENDOR SIGN-UP ──────────────────── */}
          {mode === 'signup' && (
            <div className="space-y-5">
              <div>
                <img src="/logo.png" alt="Vikrams Ads" className="h-16 w-auto object-contain mb-5" />
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Vendor Sign-Up
                </h2>
                <p className="text-gray-500 text-sm mt-1">Register your kitchen to start receiving orders instantly.</p>
              </div>

              {/* Credential rule callout */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm space-y-1">
                <p className="font-bold text-amber-800 text-xs uppercase tracking-wider">Your Login Credentials</p>
                <p className="text-amber-700 text-xs">🔑 <strong>Username</strong> = Your Phone Number</p>
                <p className="text-amber-700 text-xs">🔑 <strong>Password</strong> = Your Date of Birth in <strong>DDMMYYYY</strong> format (e.g., <code className="bg-amber-100 px-1 rounded">19072004</code>)</p>
              </div>

              <div className="space-y-3">
                <Field label="Full Name" placeholder="Owner / Shop Name" value={sf.name} onChange={patch('name')} icon={UserPlus} />
                <Field label="Phone Number (will be your username)" placeholder="+91 99999 99999" value={sf.phone} onChange={patch('phone')} icon={Phone} />
                <Field
                  label="Date of Birth (will be your password)"
                  placeholder="DDMMYYYY  e.g. 19072004"
                  value={sf.dob} onChange={patch('dob')}
                  icon={Calendar}
                  maxLength={8}
                  hint="Strictly 8 digits — no slashes, dashes, or spaces. Example: 19072004 for July 19, 2004."
                />
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Field label="Address" placeholder="Street, Area..." value={sf.address} onChange={patch('address')} icon={MapPin} />
                  </div>
                  <div className="col-span-1">
                    <Field label="PIN Code" placeholder="110001" value={sf.pincode} onChange={patch('pincode')} icon={Hash} maxLength={6} />
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl font-medium">
                  <span className="mt-0.5">⚠</span> {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl font-medium">
                  ✅ {success}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-1">
                <button
                  onClick={handleSignup}
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold text-sm transition-all shadow-lg shadow-green-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Spinner /> : <><ArrowRight size={16} /> Submit Application</>}
                </button>
                <button
                  onClick={() => switchMode('login')}
                  className="text-sm text-gray-500 hover:text-gray-800 font-semibold text-center transition-colors"
                >
                  Already registered? Sign In →
                </button>
              </div>
            </div>
          )}

          {/* ── RESET PASSWORD ──────────────────── */}
          {mode === 'reset' && (
            <div className="space-y-6">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 mb-5">
                  <Mail size={26} className="text-white" />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Reset Password
                </h2>
                <p className="text-gray-500 text-sm mt-1">Enter your Super Admin email to receive a temporary password.</p>
              </div>

              <Field
                label="Super Admin Email"
                placeholder="2711vikram@gmail.com"
                type="email"
                value={username} onChange={setUsername}
                icon={Mail}
              />

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl font-medium">
                  <span className="mt-0.5">⚠</span> {error}
                </div>
              )}
              {success && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm px-4 py-3 rounded-xl font-medium">
                  📧 {success}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleReset}
                  disabled={loading || !username}
                  className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Spinner /> : <><ArrowRight size={16} /> Send Reset Link</>}
                </button>
                <button
                  onClick={() => switchMode('login')}
                  className="text-sm text-gray-500 hover:text-gray-800 font-semibold text-center transition-colors"
                >
                  ← Back to Sign In
                </button>
              </div>
            </div>
          )}

        </div>
    </div>
  );
}
