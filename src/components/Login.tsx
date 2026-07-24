import { useEffect, useState } from 'react';
import {
  UtensilsCrossed, Shield, Users, Store, ShoppingBag,
  Eye, EyeOff, ArrowRight, Lock, Mail, ChevronLeft,
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
    <div className="min-h-screen noise relative overflow-hidden flex items-center justify-center p-6">
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
          <RoleSelector onSelect={(r) => r === 'client' ? onLogin('client') : setSelected(r)} />
        ) : (
          <CredentialForm role={selected} onLogin={onLogin} onBack={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, ShieldCheck, Eye, EyeOff, UserPlus, ChevronLeft, User } from 'lucide-react';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';

type AuthMode = 'login' | 'signup' | 'reset';

export function Login({ onLogin, onBack }: { onLogin: (r: 'super_admin' | 'sub_admin' | 'vendor', cred?: string) => void; onBack: () => void }) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login States
  const [username, setUsername] = useState(''); // Email or Phone
  const [password, setPassword] = useState(''); // Password or DOB
  const [showPw, setShowPw] = useState(false);

  // Sign-up States
  const [signupForm, setSignupForm] = useState({
    name: '',
    phone: '',
    dob: '',
    address: '',
    pincode: ''
  });

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
      } else {
        onLogin(data.role, username.trim());
      }
    } catch (err: any) {
      setError('Network error, please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setError('');
    setSuccess('');
    
    if (!signupForm.name || !signupForm.phone || !signupForm.dob || !signupForm.address || !signupForm.pincode) {
      setError('All fields are required');
      return;
    }
    
    if (!/^\d{8}$/.test(signupForm.dob)) {
      setError('Date of Birth must be strictly DDMMYYYY (e.g., 19072004) with no slashes or dashes.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/vendors/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          owner_name: signupForm.name, 
          phone: signupForm.phone, 
          birthdate: signupForm.dob, 
          address: signupForm.address, 
          zip_code: signupForm.pincode 
        })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to sign up');
      } else {
        setSuccess('Account created successfully! It is pending admin approval.');
        setTimeout(() => setMode('login'), 3000);
      }
    } catch (err: any) {
      setError('Network error, please try again');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/super-admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to reset password');
      } else {
        setSuccess(data.message || 'Password reset successful!');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text p-6 flex flex-col pt-12 items-center">
      <div className="w-full max-w-md animate-scale-in">
        <button onClick={onBack} className="flex items-center gap-1.5 text-muted hover:text-text transition-colors text-sm mb-8 group font-semibold">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Home
        </button>

        <div className="card p-8 bg-surface-2 border border-border shadow-xl">
          {mode === 'login' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h1 className="font-bold text-xl tracking-tight">Team Sign-In</h1>
                  <p className="text-sm text-muted">Access your workspace</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Email / Phone Number
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      placeholder="Email or Phone Number"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-bg border border-border focus:border-accent outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Password / DOB (DDMMYYYY)
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      placeholder="Password or DDMMYYYY"
                      className="w-full pl-10 pr-12 py-3 rounded-xl bg-bg border border-border focus:border-accent outline-none transition-all"
                    />
                    <button
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
                      className="text-xs text-accent hover:underline font-semibold flex items-center gap-1"
                    >
                      <UserPlus size={14}/> Apply as Vendor
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMode('reset'); setError(''); setSuccess(''); }}
                      className="text-xs text-muted hover:text-text hover:underline font-semibold"
                    >
                      Forgot Admin Password?
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 font-medium">
                    {error}
                  </p>
                )}

                <Button className="w-full h-12" onClick={handleLogin} disabled={loading || !username || !password}>
                  {loading ? <Spinner /> : <>Sign In <ArrowRight size={16} className="ml-1.5" /></>}
                </Button>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div className="space-y-5">
              <div className="mb-4">
                <h1 className="font-bold text-xl tracking-tight text-accent flex items-center gap-2">
                  <UserPlus size={22} /> Vendor Registration
                </h1>
                <p className="text-sm text-muted">Join the platform to manage your store.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider ml-1">Full Name</label>
                  <input type="text" value={signupForm.name} onChange={e => setSignupForm({...signupForm, name: e.target.value})} className="w-full px-4 py-2.5 mt-1 rounded-lg bg-bg border border-border outline-none focus:border-accent transition-colors" placeholder="Owner Name" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider ml-1">Phone Number (Username)</label>
                  <input type="text" value={signupForm.phone} onChange={e => setSignupForm({...signupForm, phone: e.target.value})} className="w-full px-4 py-2.5 mt-1 rounded-lg bg-bg border border-border outline-none focus:border-accent transition-colors" placeholder="+91 99999..." />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider ml-1">Date of Birth (Password)</label>
                  <input type="text" value={signupForm.dob} onChange={e => setSignupForm({...signupForm, dob: e.target.value})} className="w-full px-4 py-2.5 mt-1 rounded-lg bg-bg border border-border outline-none focus:border-accent transition-colors tracking-[0.2em]" placeholder="DDMMYYYY" maxLength={8} />
                  <p className="text-[10px] text-muted mt-1 ml-1">Strictly 8 digits, no slashes (e.g. 19072004 for July 19, 2004)</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-muted uppercase tracking-wider ml-1">Address</label>
                    <input type="text" value={signupForm.address} onChange={e => setSignupForm({...signupForm, address: e.target.value})} className="w-full px-4 py-2.5 mt-1 rounded-lg bg-bg border border-border outline-none focus:border-accent transition-colors" placeholder="Shop Address" />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs font-semibold text-muted uppercase tracking-wider ml-1">Pin Code</label>
                    <input type="text" value={signupForm.pincode} onChange={e => setSignupForm({...signupForm, pincode: e.target.value})} className="w-full px-4 py-2.5 mt-1 rounded-lg bg-bg border border-border outline-none focus:border-accent transition-colors" placeholder="110001" />
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg font-medium">{error}</p>}
              {success && <p className="text-sm text-green-500 bg-green-500/10 px-3 py-2 rounded-lg font-medium">{success}</p>}

              <div className="pt-2 flex flex-col gap-2">
                <Button className="w-full" onClick={handleSignup} disabled={loading}>
                  {loading ? <Spinner /> : 'Submit Application'}
                </Button>
                <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }} className="text-xs text-muted hover:text-text font-semibold p-2">
                  Already have an account? Sign In
                </button>
              </div>
            </div>
          )}

          {mode === 'reset' && (
            <div className="space-y-6">
               <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center">
                  <Mail size={22} className="text-accent" />
                </div>
                <div>
                  <p className="font-bold text-lg">Reset Password</p>
                  <p className="text-xs text-muted">A temporary password will be sent to your email.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider">Super Admin Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="email"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="your-email@gmail.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-bg border border-border focus:border-accent outline-none transition-all font-semibold"
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg font-medium">{error}</p>}
                {success && <p className="text-sm text-green-500 bg-green-500/10 px-3 py-2 rounded-lg font-medium">{success}</p>}

                <Button className="w-full" onClick={handleResetPassword} disabled={loading || !username}>
                  {loading ? <Spinner /> : <>Send Reset Link <ArrowRight size={16} className="ml-1.5" /></>}
                </Button>

                <div className="text-center pt-2">
                  <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }} className="text-xs text-muted hover:text-text font-semibold">
                    Back to Sign In
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
