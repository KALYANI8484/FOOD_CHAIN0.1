import { useEffect, useState } from 'react';
import {
  UtensilsCrossed, Eye, EyeOff, ArrowRight, Lock, Mail, ChevronLeft,
} from 'lucide-react';
import { Button, Spinner } from './ui';
import { supabase } from '../lib/supabase';

type Role = 'super_admin' | 'sub_admin' | 'vendor' | 'client';

interface LoginProps {
  onLogin: (role: Role, cred?: string) => void;
  onBack?: () => void;
}

export function Login({ onLogin, onBack }: LoginProps) {
  return (
    <div className="min-h-screen noise relative overflow-hidden flex items-center justify-center p-6">
      {onBack && (
        <button onClick={onBack} className="absolute top-6 left-6 text-muted hover:text-text transition-colors text-sm flex items-center gap-1.5 group z-10">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Home
        </button>
      )}

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] top-[-80px] left-[-80px]"
          style={{ background: 'radial-gradient(circle, #A0A0D0, transparent 70%)' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full opacity-10 blur-[100px] bottom-0 right-0"
          style={{ background: 'radial-gradient(circle, #8888BB, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-2xl">
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent-2 flex items-center justify-center">
              <UtensilsCrossed size={22} className="text-white" />
            </div>
            <span className="text-3xl font-bold tracking-tight">VIKRAM ADVERTISING</span>
          </div>
          <p className="text-muted">Sign in to access your workspace</p>
        </div>

        <CredentialForm onLogin={onLogin} />
      </div>
    </div>
  );
}

function CredentialForm({ onLogin }: { onLogin: (role: Role, cred?: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  useEffect(() => {
    const savedEmail = localStorage.getItem('foodchain-login-email');
    const savedRemember = localStorage.getItem('foodchain-login-remember') === 'true';
    if (savedRemember && savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (rememberMe && email) {
      localStorage.setItem('foodchain-login-email', email);
      localStorage.setItem('foodchain-login-remember', 'true');
    } else {
      localStorage.removeItem('foodchain-login-email');
      localStorage.removeItem('foodchain-login-remember');
    }
  }, [rememberMe, email]);

  const handleResetPassword = async () => {
    setError('');
    setResetSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/super-admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to reset password');
      } else {
        setResetSuccess(data.message || 'Password reset successful!');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      const superAdminResult = await supabase.from('super_admins').select('*').eq('email', cleanEmail).maybeSingle();
      if (!superAdminResult.error && superAdminResult.data && superAdminResult.data.password === cleanPassword) {
        onLogin('super_admin', cleanEmail);
        return;
      }

      const subAdminResult = await supabase.from('sub_admins').select('*').eq('email', cleanEmail).maybeSingle();
      if (!subAdminResult.error && subAdminResult.data && subAdminResult.data.password === cleanPassword) {
        onLogin('sub_admin', cleanEmail);
        return;
      }

      const vendorResult = await supabase.from('vendors').select('*').eq('email', cleanEmail).maybeSingle();
      if (!vendorResult.error && vendorResult.data && vendorResult.data.password === cleanPassword) {
        onLogin('vendor', cleanEmail);
        return;
      }

      if (cleanEmail === 'vendor@123' && cleanPassword === '1234567') {
        onLogin('vendor', cleanEmail);
        return;
      }

      if (cleanEmail === 'client@123' && cleanPassword === '123456') {
        onLogin('client', cleanEmail);
        return;
      }

      setError('Invalid email or password');
    } catch (err: any) {
      setError(err.message || 'Unable to sign in right now.');
    } finally {
      setLoading(false);
    }
  };

  if (resetMode) {
    return (
      <div className="max-w-md mx-auto animate-scale-in">
        <button onClick={() => setResetMode(false)} className="flex items-center gap-1.5 text-muted hover:text-text transition-colors text-sm mb-6 group">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Login
        </button>

        <div className="card p-8 bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center text-orange-400">
              <Lock size={22} />
            </div>
            <div>
              <p className="font-bold text-lg">Reset Password</p>
              <p className="text-xs text-muted">A temporary password will be sent to your email.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="your-email@gmail.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-2 border border-border focus:border-accent outline-none transition-all font-semibold"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {resetSuccess && (
              <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                {resetSuccess}
              </p>
            )}

            <Button className="w-full" size="lg" onClick={handleResetPassword} disabled={loading || !resetEmail}>
              {loading ? <Spinner /> : <>Send Reset Password <Mail size={16} className="ml-1.5" /></>}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto animate-scale-in">
      <div className="card p-8 bg-gradient-to-br from-white/80 to-[#F8F8FF] border border-white/60 shadow-[0_20px_60px_rgba(17,17,24,0.08)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center text-accent">
            <Lock size={22} />
          </div>
          <div>
            <p className="font-bold text-lg text-text">Welcome back</p>
            <p className="text-xs text-muted">Use your credentials to access your dashboard</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted uppercase tracking-wider">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="your@email.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-2 border border-border focus:border-accent outline-none transition-all"
                autoComplete="username"
              />
            </div>
          </div>

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

          <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
            />
            Remember me
          </label>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => { setResetMode(true); setError(''); setResetSuccess(''); }}
              className="text-xs text-accent hover:underline font-semibold"
            >
              Forgot Password?
            </button>
          </div>

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
