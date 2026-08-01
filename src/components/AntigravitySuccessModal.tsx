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
  title = "Registration Successful!",
  subtitle = "Your vendor account has been created successfully! You can now log in using your phone number and password.",
  primaryActionText = "OK",
  onPrimaryAction
}: AntigravitySuccessModalProps) {
  if (!open) return null;

  const handleAction = () => {
    if (onPrimaryAction) onPrimaryAction();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in w-screen h-screen overflow-y-auto">
      {/* Main Glassmorphic Modal Card */}
      <div className="relative max-w-sm sm:max-w-md w-full rounded-3xl bg-white border border-amber-200/80 p-6 sm:p-8 shadow-2xl text-center overflow-hidden animate-scale-in my-auto">
        
        {/* Floating Orbital Ring with Glowing Checkmark Icon */}
        <div className="relative mx-auto w-20 h-20 mb-5 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-amber-400/50 animate-ping opacity-30" />
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Check className="w-9 h-9 text-white stroke-[3.5]" />
          </div>
        </div>

        {/* Headline & Subtitle */}
        <div className="space-y-2 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Registration Successful!
          </h2>

          <p className="text-gray-600 text-sm leading-relaxed max-w-sm mx-auto pt-1 font-semibold">
            {subtitle}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-6 flex justify-center">
          <button
            onClick={handleAction}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 active:scale-95 text-white font-extrabold text-sm transition-all shadow-lg shadow-amber-500/30 cursor-pointer"
          >
            {primaryActionText}
          </button>
        </div>
      </div>
    </div>
  );
}
