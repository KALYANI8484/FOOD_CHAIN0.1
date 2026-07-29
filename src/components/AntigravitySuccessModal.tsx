import React, { useState } from 'react';
import { Check, Sparkles, ArrowRight } from 'lucide-react';

interface AntigravitySuccessModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  primaryActionText?: string;
  onPrimaryAction?: () => void;
}

/* ── Interactive Celebratory Call-To-Action Pill Button with Symmetrical Burst ── */
export function CelebratorySubmitButton({
  text = "Submit",
  onClick,
  disabled = false,
  className = ""
}: {
  text?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    setClicked(true);
    if (onClick) onClick();
    setTimeout(() => setClicked(false), 1200);
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      
      {/* ── Celebratory Explosion Effect (Flanking both sides symmetrically) ── */}
      <div className={`absolute inset-0 pointer-events-none transition-all duration-500 ${clicked ? 'scale-100 opacity-100' : 'scale-90 opacity-90'}`}>
        
        {/* LEFT FLANK BURST */}
        <div className="absolute top-1/2 -left-12 -translate-y-1/2 flex items-center justify-center">
          {/* Cyan Curved Motion Lines (#38BDF8) */}
          <svg className="w-12 h-12 text-[#38BDF8] animate-burst-left" viewBox="0 0 50 50" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M40 25 C 30 15, 15 20, 5 10" />
            <path d="M42 30 C 28 35, 18 42, 8 45" />
          </svg>
          {/* Orange Squiggly Ribbon Stream (#FF7A00) */}
          <svg className="w-8 h-8 text-[#FF7A00] absolute -top-4 -left-4 animate-squiggle" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M25 5 Q 15 15, 20 20 T 5 25" />
          </svg>
          {/* Peach/Gold 5-Point Stars (#FDBA74) */}
          <svg className="w-5 h-5 text-[#FDBA74] fill-current absolute -top-5 left-2 animate-star-pop" viewBox="0 0 24 24">
            <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
          </svg>
          <svg className="w-3.5 h-3.5 text-[#FDBA74] fill-current absolute -bottom-4 left-0 animate-star-pop" style={{ animationDelay: '150ms' }} viewBox="0 0 24 24">
            <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
          </svg>
          {/* Vibrant Green Dots (#22C55E) */}
          <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] absolute -top-2 left-6 animate-dot-float" />
          <span className="w-2 h-2 rounded-full bg-[#22C55E] absolute -bottom-3 left-4 animate-dot-float" style={{ animationDelay: '200ms' }} />
        </div>

        {/* RIGHT FLANK BURST */}
        <div className="absolute top-1/2 -right-12 -translate-y-1/2 flex items-center justify-center">
          {/* Cyan Curved Motion Lines (#38BDF8) */}
          <svg className="w-12 h-12 text-[#38BDF8] animate-burst-right" viewBox="0 0 50 50" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M10 25 C 20 15, 35 20, 45 10" />
            <path d="M8 30 C 22 35, 32 42, 42 45" />
          </svg>
          {/* Orange Squiggly Ribbon Stream (#FF7A00) */}
          <svg className="w-8 h-8 text-[#FF7A00] absolute -top-4 -right-4 animate-squiggle" style={{ animationDelay: '100ms' }} viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 5 Q 15 15, 10 20 T 25 25" />
          </svg>
          {/* Peach/Gold 5-Point Stars (#FDBA74) */}
          <svg className="w-5 h-5 text-[#FDBA74] fill-current absolute -top-5 right-2 animate-star-pop" style={{ animationDelay: '100ms' }} viewBox="0 0 24 24">
            <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
          </svg>
          <svg className="w-3.5 h-3.5 text-[#FDBA74] fill-current absolute -bottom-4 right-0 animate-star-pop" style={{ animationDelay: '250ms' }} viewBox="0 0 24 24">
            <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
          </svg>
          {/* Vibrant Green Dots (#22C55E) */}
          <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E] absolute -top-2 right-6 animate-dot-float" style={{ animationDelay: '100ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#22C55E] absolute -bottom-3 right-4 animate-dot-float" style={{ animationDelay: '300ms' }} />
        </div>
      </div>

      {/* ── Central Orange Pill Button ── */}
      <button
        onClick={handleClick}
        disabled={disabled}
        className={`relative z-10 px-8 py-3.5 rounded-full bg-[#FF5722] hover:bg-[#F4511E] active:scale-95 text-white font-extrabold text-base tracking-wide border-2 border-white/90 shadow-[0_8px_25px_rgba(255,87,34,0.4)] transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${clicked ? 'animate-button-pop' : ''}`}
      >
        <span>{text}</span>
        <ArrowRight className="w-4 h-4 stroke-[3]" />
      </button>

    </div>
  );
}

/* ── Antigravity Success Modal ── */
export function AntigravitySuccessModal({
  open,
  onClose,
  title = "Application Submitted!",
  subtitle = "Your vendor application has been executed in a zero-gravity isolated workspace. All systems operational — Free Tier Plan Auto-Assigned!",
  primaryActionText = "Submit",
  onPrimaryAction
}: AntigravitySuccessModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-r from-[#3B82F6] to-[#6366F1] animate-fade-in relative overflow-hidden">
      
      {/* Translucent Dot-Grid Pattern Backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:20px_20px] opacity-25 pointer-events-none" />

      {/* Ambient Pulsing Glow Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/30 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Main Glassmorphic Modal Card */}
      <div className="relative max-w-lg w-full rounded-3xl bg-slate-950/80 backdrop-blur-2xl border border-white/20 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)] text-center overflow-hidden animate-scale-in">
        
        {/* Floating Orbital Ring with Glowing Checkmark Icon */}
        <div className="relative mx-auto w-24 h-24 mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-400/60 animate-ping opacity-30" />
          <div className="absolute inset-1 rounded-full border border-orange-400/60 shadow-[0_0_30px_rgba(255,87,34,0.4)] animate-spin-slow" />
          
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.6)]">
            <Check className="w-9 h-9 text-white stroke-[3.5]" />
          </div>
        </div>

        {/* Headline & Subtitle */}
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-cyan-300 text-xs font-mono uppercase tracking-widest backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            <span>Zero-G Execution Confirmed</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-amber-200 tracking-tight pt-2">
            {title}
          </h2>

          <p className="text-slate-200 text-sm leading-relaxed max-w-md mx-auto pt-1 font-medium">
            {subtitle}
          </p>
        </div>

        {/* System Operational Status Box */}
        <div className="my-6 p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 text-left font-mono text-xs text-slate-300 flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-400 font-bold">ALL SYSTEMS OPERATIONAL</span>
          </div>
          <span className="text-slate-400 text-[10px]">Free Tier Active</span>
        </div>

        {/* Celebratory Pill Button Action */}
        <div className="pt-2 flex justify-center">
          <CelebratorySubmitButton
            text={primaryActionText || "Submit"}
            onClick={() => {
              if (onPrimaryAction) onPrimaryAction();
              onClose();
            }}
          />
        </div>
      </div>

      {/* Burst & Confetti Animations Keyframes */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        @keyframes burst-left {
          0% { transform: scale(0.4) translate(15px, 0); opacity: 0; }
          60% { transform: scale(1.25) translate(-10px, -5px); opacity: 1; }
          100% { transform: scale(1) translate(0, 0); opacity: 1; }
        }
        .animate-burst-left {
          animation: burst-left 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes burst-right {
          0% { transform: scale(0.4) translate(-15px, 0); opacity: 0; }
          60% { transform: scale(1.25) translate(10px, -5px); opacity: 1; }
          100% { transform: scale(1) translate(0, 0); opacity: 1; }
        }
        .animate-burst-right {
          animation: burst-right 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes star-pop {
          0% { transform: scale(0) rotate(-45deg); opacity: 0; }
          70% { transform: scale(1.3) rotate(15deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .animate-star-pop {
          animation: star-pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        @keyframes squiggle {
          0% { stroke-dashoffset: 50; opacity: 0; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        .animate-squiggle {
          animation: squiggle 0.8s ease-out forwards;
        }
        @keyframes dot-float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-6px) scale(1.2); }
        }
        .animate-dot-float {
          animation: dot-float 2.5s ease-in-out infinite;
        }
        @keyframes button-pop {
          0% { transform: scale(0.95); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        .animate-button-pop {
          animation: button-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
      `}</style>
    </div>
  );
}
