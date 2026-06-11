'use client';

import type { VerifyOutcome, OnChainClaim, WalrusReading } from '@/lib/verify';

function formatDay(day: number): string {
  const s = String(day);
  return new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T12:00:00Z`)
    .toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function shorten(s: string, head = 10, tail = 4): string {
  if (s.length <= head + tail + 3) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

// ── Field comparison row ──────────────────────────────────────────────────────

function FieldRow({
  label, claimVal, walrusVal, mismatch,
}: { label: string; claimVal: string; walrusVal: string; mismatch: boolean }) {
  return (
    <div className={`grid grid-cols-3 gap-2 px-3 py-2 rounded-lg text-xs ${mismatch ? 'bg-red-950/30 border border-red-900/40' : ''}`}>
      <span className="text-teal-500 font-medium uppercase tracking-wider self-center">{label}</span>
      <span className={`font-mono truncate ${mismatch ? 'text-red-300' : 'text-teal-200'}`}>
        {claimVal}
      </span>
      <span className={`font-mono truncate ${mismatch ? 'text-red-400 line-through' : 'text-teal-400'}`}>
        {walrusVal}
      </span>
    </div>
  );
}

// ── Comparison panel (MATCH or MISMATCH) ──────────────────────────────────────

function ComparePanel({
  claim, walrus, diffs,
}: { claim: OnChainClaim; walrus: WalrusReading; diffs: string[] }) {
  const isDiff = (f: string) => diffs.includes(f);

  return (
    <div className="flex flex-col gap-2 mt-3">
      {/* Column headers */}
      <div className="grid grid-cols-3 gap-2 px-3 text-xs text-teal-600 uppercase tracking-wider">
        <span>Field</span>
        <span>On-chain (Sui)</span>
        <span>Original (Walrus)</span>
      </div>

      <FieldRow
        label="kWh"
        claimVal={(claim.wattHours / 1000).toFixed(3)}
        walrusVal={(walrus.wattHours / 1000).toFixed(3)}
        mismatch={isDiff('watt_hours')}
      />
      <FieldRow
        label="Day"
        claimVal={formatDay(claim.productionDay)}
        walrusVal={formatDay(walrus.productionDay)}
        mismatch={isDiff('production_day')}
      />
      <FieldRow
        label="Producer"
        claimVal={shorten(claim.producer, 8, 4)}
        walrusVal={shorten(walrus.producer, 8, 4)}
        mismatch={isDiff('producer')}
      />
      <FieldRow
        label="Blob ID"
        claimVal={shorten(claim.walrusBlobId, 10, 4)}
        walrusVal={shorten(claim.walrusBlobId, 10, 4)}
        mismatch={false}
      />
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────────

export function VerifyResult({ outcome }: { outcome: VerifyOutcome }) {
  if (outcome.status === 'NOT_FOUND') {
    return (
      <div className="rounded-xl border border-teal-900/40 bg-teal-950/20 px-4 py-4 flex items-start gap-3">
        <span className="text-xl mt-0.5">🔍</span>
        <div>
          <p className="text-sm font-semibold text-teal-400">Not found</p>
          <p className="text-xs text-teal-600 mt-1 whitespace-pre-wrap">{outcome.message}</p>
        </div>
      </div>
    );
  }

  if (outcome.status === 'ERROR') {
    return (
      <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-4 flex items-start gap-3">
        <span className="text-xl mt-0.5">⚠️</span>
        <div>
          <p className="text-sm font-semibold text-red-400">Verification error</p>
          <p className="text-xs text-red-600 mt-1">{outcome.message}</p>
        </div>
      </div>
    );
  }

  if (outcome.status === 'BLOB_UNAVAILABLE') {
    return (
      <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 px-4 py-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">🟡</span>
          <div>
            <p className="text-sm font-semibold text-amber-400">Walrus blob unavailable</p>
            <p className="text-xs text-amber-600 mt-1">{outcome.message}</p>
          </div>
        </div>
        <div className="border-t border-amber-900/30 pt-3 text-xs text-amber-700">
          <p className="font-medium text-amber-500 mb-1">On-chain claim (unverifiable without blob)</p>
          <p>Producer: <span className="font-mono">{shorten(outcome.claim.producer)}</span></p>
          <p>Production day: {formatDay(outcome.claim.productionDay)}</p>
          <p>Watt-hours: {outcome.claim.wattHours} Wh</p>
        </div>
      </div>
    );
  }

  if (outcome.status === 'MATCH') {
    return (
      <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/20 px-4 py-4 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">✅</span>
          <p className="text-sm font-semibold text-emerald-400">Proof verified — MATCH</p>
        </div>
        <p className="text-xs text-emerald-700 mb-1">
          On-chain claim matches the original Walrus reading exactly.
        </p>
        <ComparePanel claim={outcome.claim} walrus={outcome.walrus} diffs={[]} />
      </div>
    );
  }

  // MISMATCH
  return (
    <div className="rounded-xl border border-red-800/50 bg-red-950/20 px-4 py-4 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-lg">🚨</span>
        <p className="text-sm font-semibold text-red-400">Proof MISMATCH</p>
      </div>
      <p className="text-xs text-red-700 mb-1">
        The on-chain claim differs from the original Walrus reading on:{' '}
        <span className="font-mono text-red-500">{outcome.diffs.join(', ')}</span>
      </p>
      <ComparePanel claim={outcome.claim} walrus={outcome.walrus} diffs={outcome.diffs} />
    </div>
  );
}
