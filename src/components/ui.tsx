import { useEffect, useState, useRef, type ReactNode, type MouseEvent } from 'react';

export function LanguageSelector({
  onChange,
  direction = 'down',
  showLabel = true
}: {
  onChange?: (lang: Language) => void;
  direction?: 'up' | 'down' | 'auto';
  showLabel?: boolean;
}) {
  const [lang, setLang] = useSyncedLanguage();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const change = (l: Language) => {
    setLang(l);
    localStorage.setItem('app_language', l);
    window.dispatchEvent(new Event('app_language_change'));
    if (onChange) onChange(l);
    setOpen(false);
  };

  const options: { code: Language; label: string; flag: string; short: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧', short: 'EN' },
    { code: 'hi', label: 'हिंदी', flag: '🇮🇳', short: 'HI' },
    { code: 'mr', label: 'मराठी', flag: '🇮🇳', short: 'MR' },
  ];

  const currentOpt = options.find(o => o.code === lang) || options[0];

  const menuPosClass = direction === 'up'
    ? 'bottom-full mb-2 right-0'
    : 'top-full mt-2 right-0';

  return (
    <div className="relative inline-block text-left z-20" ref={menuRef}>
      {/* Globe Icon Pill Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-9 px-3 rounded-xl bg-white hover:bg-amber-50 border border-amber-200 flex items-center gap-1.5 text-amber-800 shadow-sm transition-all active:scale-95 cursor-pointer"
        title="Change Language / भाषा बदलें / भाषा बदला"
        aria-label="Change Language"
      >
        <span className="text-base leading-none">🌐</span>
        {showLabel && (
          <span className="text-xs font-black uppercase tracking-wider text-slate-800">{currentOpt.short}</span>
        )}
      </button>

      {/* Floating Dropdown Menu */}
      {open && (
        <div className={`absolute ${menuPosClass} w-48 rounded-2xl bg-white shadow-2xl border border-amber-200 py-2 z-50 animate-scale-in min-w-[185px]`}>
          <div className="px-3.5 py-1.5 border-b border-amber-100 mb-1">
            <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Select Language</p>
          </div>
          {options.map((opt) => (
            <button
              key={opt.code}
              type="button"
              onClick={() => change(opt.code)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold transition-colors cursor-pointer ${
                lang === opt.code
                  ? 'bg-amber-100/70 text-amber-900 font-black'
                  : 'text-slate-700 hover:bg-amber-50/60'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className="text-base">{opt.flag}</span>
                <span className="font-extrabold text-sm text-slate-900">{opt.label}</span>
              </span>
              {lang === opt.code && <span className="text-amber-700 font-black text-sm">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
import { X } from 'lucide-react';

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-[#FAF8F5] text-slate-900 border-t sm:border border-amber-200/80 shadow-2xl rounded-t-3xl sm:rounded-3xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto animate-scale-in`}>
        {title && (
          <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-amber-200 bg-[#F4EFE6] sticky top-0 z-10 rounded-t-3xl">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 truncate pr-2">{title}</h3>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-amber-200/50 text-slate-600 hover:text-slate-900 transition-colors group shrink-0" aria-label="Close">
              <X size={18} className="text-slate-600 group-hover:text-slate-900 transition-colors" />
            </button>
          </div>
        )}
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  side = 'right',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  side?: 'left' | 'right';
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`absolute top-0 ${side === 'right' ? 'right-0 animate-slide-in-right' : 'left-0 animate-slide-in-left'} h-full w-full max-w-md bg-[#FAF8F5] text-slate-900 border-l border-amber-200 shadow-2xl overflow-y-auto`}
      >
        {title && (
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-amber-200 bg-[#F4EFE6] sticky top-0 z-10">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 truncate pr-2">{title}</h3>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-amber-200/50 text-slate-600 hover:text-slate-900 transition-colors group shrink-0" aria-label="Close">
              <X size={18} className="text-slate-600 group-hover:text-slate-900 transition-colors" />
            </button>
          </div>
        )}
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

export function Toast({ message, type = 'success' }: { message: string; type?: 'success' | 'error' | 'info' }) {
  const colors = {
    success: 'border-green-500/30 bg-green-500/10 text-green-400',
    error: 'border-red-500/30 bg-red-500/10 text-red-400',
    info: 'border-accent/30 bg-accent/10 text-accent',
  };
  return (
    <div className={`fixed bottom-6 right-6 z-[60] px-5 py-3 rounded-xl border glass animate-fade-in-up ${colors[type]}`}>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const show = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  return { toast, show };
}

export function Badge({ children, variant = 'default', className = '' }: { children: ReactNode; variant?: 'default' | 'success' | 'warning' | 'error' | 'accent' | 'info'; className?: string }) {
  const variants = {
    default: 'bg-surface-2 text-text border-border font-extrabold',
    success: 'bg-green-100 text-green-800 border-green-300 font-extrabold',
    warning: 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold',
    error: 'bg-red-100 text-red-800 border-red-300 font-extrabold',
    accent: 'bg-[#4A0E17] text-[#C5A059] border-[#C5A059]/40 font-extrabold',
    info: 'bg-blue-100 text-blue-800 border-blue-300 font-extrabold',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  disabled = false,
}: {
  children: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  const variants = {
    primary: 'bg-gradient-to-r from-accent to-accent-2 text-white glow-accent hover:scale-[1.02]',
    secondary: 'bg-surface-2 text-text border border-border hover:border-accent/40',
    ghost: 'text-muted hover:text-text hover:bg-surface-2',
    danger: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20',
    outline: 'border border-border text-text hover:border-accent/40 hover:bg-surface-2',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn-shine inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  maxLength,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-semibold text-text block">
          {label} {required && <span className="text-accent">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 rounded-2xl bg-white/95 border border-border text-text placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all shadow-sm"
      />
    </div>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-semibold text-text block">
          {label} {required && <span className="text-accent">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-4 py-3 rounded-2xl bg-white/95 border border-border text-text focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all appearance-none cursor-pointer shadow-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-white text-text">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
    </div>
  );
}

export function EmptyState({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-2 flex items-center justify-center text-muted mb-4">{icon}</div>
      <p className="text-text font-extrabold text-base">{title}</p>
      {subtitle && <p className="text-muted text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

export function SpotlightCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };
  return (
    <div onMouseMove={handleMove} className={`spotlight relative overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export type Language = 'en' | 'hi' | 'mr';

export const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en';
  const saved = localStorage.getItem('app_language') as Language;
  if (saved && (saved === 'en' || saved === 'hi' || saved === 'mr')) return saved;
  const navLang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase();
  if (navLang.startsWith('hi')) return 'hi';
  if (navLang.startsWith('mr')) return 'mr';
  return 'en';
};

// Single shared hook for staying in sync with the language picked in LanguageSelector
// (localStorage + a same-tab 'app_language_change' event, since the native 'storage'
// event never fires in the tab that made the change). Replaces the same hand-rolled
// useState+useEffect pair that used to be duplicated in every component that needed it.
export function useSyncedLanguage(): [Language, (l: Language) => void] {
  const [lang, setLang] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    const handleChange = () => {
      const updated = localStorage.getItem('app_language') as Language;
      if (updated && (updated === 'en' || updated === 'hi' || updated === 'mr')) {
        setLang(updated);
      }
    };
    window.addEventListener('storage', handleChange);
    window.addEventListener('app_language_change', handleChange);
    return () => {
      window.removeEventListener('storage', handleChange);
      window.removeEventListener('app_language_change', handleChange);
    };
  }, []);

  return [lang, setLang];
}


