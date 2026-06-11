'use client';

const SUISCAN = 'https://suiscan.xyz/testnet/object';
const WALRUS_AGG = 'https://aggregator.walrus-testnet.walrus.space/v1/blobs';

interface CertificateCardProps {
  productionDay: number;
  wattHours: number;
  mintedAt: string;
  certObjectId: string;
  walrusBlobId: string;
  inverterLabel: string;
  inverterBrand: string;
}

function formatDay(day: number): string {
  const s = String(day);
  return new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T12:00:00Z`)
    .toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function shorten(s: string, head = 10, tail = 4): string {
  if (s.length <= head + tail + 3) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

export function CertificateCard({
  productionDay, wattHours, mintedAt, certObjectId, walrusBlobId,
  inverterLabel,
}: CertificateCardProps) {
  const kwh = (wattHours / 1000).toFixed(2);
  const mintedDate = new Date(mintedAt).toLocaleString('en', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  });

  return (
    <div className="rounded-2xl border border-teal-900/40 bg-teal-950/20 p-5 flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-teal-500 uppercase tracking-wider">{formatDay(productionDay)}</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-3xl font-bold text-teal-200 tabular-nums">{kwh}</span>
            <span className="text-sm text-teal-400">kWh</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/60 border border-emerald-800/30 text-emerald-400">
            $SUB minted
          </span>
          <span className="text-xs text-teal-600">{mintedDate} UTC</span>
        </div>
      </div>

      <p className="text-xs text-teal-600 -mt-2">{inverterLabel}</p>

      {/* Links */}
      <div className="flex flex-col gap-2">
        <a
          href={`${SUISCAN}/${certObjectId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 group"
        >
          <span className="text-xs text-teal-600 uppercase tracking-wider w-16 shrink-0">Sui cert</span>
          <span className="font-mono text-xs text-teal-400 group-hover:text-teal-200 transition-colors truncate">
            {shorten(certObjectId)}
          </span>
          <span className="text-teal-700 group-hover:text-teal-400 transition-colors text-xs ml-auto shrink-0">↗</span>
        </a>
        <a
          href={`${WALRUS_AGG}/${walrusBlobId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 group"
        >
          <span className="text-xs text-teal-600 uppercase tracking-wider w-16 shrink-0">Walrus</span>
          <span className="font-mono text-xs text-teal-400 group-hover:text-teal-200 transition-colors truncate">
            {shorten(walrusBlobId, 12, 4)}
          </span>
          <span className="text-teal-700 group-hover:text-teal-400 transition-colors text-xs ml-auto shrink-0">↗</span>
        </a>
      </div>

      {/* Verify button — wired in Slice 4 */}
      <button
        disabled
        title="On-chain verification — coming in Slice 4"
        className="w-full py-2 rounded-lg border border-teal-900/40 text-teal-700 text-xs font-medium cursor-not-allowed select-none"
      >
        Verify proof (Slice 4)
      </button>
    </div>
  );
}
