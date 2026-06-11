'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  onDismiss: () => void;
  durationMs?: number;
}

export function Toast({ message, onDismiss, durationMs = 3500 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(t);
  }, [onDismiss, durationMs]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-xl border border-teal-700/50 bg-teal-950/90 backdrop-blur shadow-lg text-sm text-teal-200 whitespace-nowrap">
      <span className="text-emerald-400">✓</span>
      {message}
      <button onClick={onDismiss} className="ml-2 text-teal-500 hover:text-teal-300 transition-colors text-xs">✕</button>
    </div>
  );
}
