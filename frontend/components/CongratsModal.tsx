'use client';

import { useEffect, useRef } from 'react';

interface CongratsModalProps {
  points: number;
  label: string;
  onClose: () => void;
}

export function CongratsModal({ points, label, onClose }: CongratsModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="congrats-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-emerald-700/50 bg-gradient-to-b from-[#061a10] to-[#0a0f0a] p-8 flex flex-col items-center gap-6 shadow-2xl shadow-emerald-900/40">
        {/* Glow ring */}
        <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-emerald-500/20 to-transparent pointer-events-none" />

        {/* Sun burst */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-28 h-28 rounded-full bg-emerald-500/15 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute w-20 h-20 rounded-full bg-teal-500/20 animate-pulse" />
          <span className="relative text-6xl select-none" style={{ filter: 'drop-shadow(0 0 16px #10b981)' }}>
            ☀️
          </span>
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <h2 id="congrats-title" className="text-xl font-bold text-emerald-300">
            Inverter Connected!
          </h2>
          <p className="text-sm text-teal-400 leading-relaxed">
            <span className="font-mono text-teal-200">{label}</span> is now live and will generate daily $SUB certificates.
          </p>
        </div>

        {/* Points badge */}
        <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-950/60 border border-emerald-700/40">
          <span className="text-2xl">⚡</span>
          <div className="flex flex-col">
            <span className="text-xs text-emerald-600 uppercase tracking-widest">SRE Bonus</span>
            <span className="text-2xl font-black text-emerald-400">+{points} SRE</span>
          </div>
        </div>

        <button
          ref={closeRef}
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-semibold text-sm transition-all"
        >
          Let&apos;s go →
        </button>
      </div>
    </div>
  );
}
