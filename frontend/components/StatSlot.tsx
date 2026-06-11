'use client';

interface StatSlotProps {
  label: string;
  value: string | number;
  unit?: string;
}

export function StatSlot({ label, value, unit }: StatSlotProps) {
  return (
    <div className="flex flex-col items-center gap-1 px-8 py-5 rounded-2xl border border-teal-800/40 bg-teal-950/30 backdrop-blur">
      <span className="text-3xl font-bold text-teal-300 tabular-nums">
        {value}
        {unit && <span className="text-lg ml-1 text-teal-400">{unit}</span>}
      </span>
      <span className="text-sm text-teal-600 uppercase tracking-widest">{label}</span>
    </div>
  );
}
