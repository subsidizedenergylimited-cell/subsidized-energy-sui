'use client';

import { useState } from 'react';
import Link from 'next/link';
import { verifyCertificate, type VerifyOutcome } from '@/lib/verify';
import { VerifyResult } from '@/components/VerifyResult';

const PREFILL = '0xa584fd4632cb0b2a601c1e172ff6eac9909850c6ef227828b679d75edfb94c24';

export default function VerifyPage() {
  const [certId, setCertId]   = useState(PREFILL);
  const [verifying, setVerifying] = useState(false);
  const [outcome, setOutcome] = useState<VerifyOutcome | null>(null);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const id = certId.trim();
    if (!id) return;
    setVerifying(true);
    setOutcome(null);
    try {
      setOutcome(await verifyCertificate(id));
    } finally {
      setVerifying(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-teal-900/40">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">☀️</span>
          <span className="font-bold text-teal-300 tracking-tight text-sm">Subsidized Energy</span>
        </Link>
        <Link href="/auth" className="text-sm text-teal-500 hover:text-teal-300 transition-colors">
          Sign in
        </Link>
      </nav>

      <div className="flex-1 px-4 py-12 max-w-xl mx-auto w-full flex flex-col gap-8">

        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-teal-800/40 bg-teal-950/40 text-teal-500 text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Trustless · No login required
          </div>
          <h1 className="text-2xl font-bold text-teal-200">Verify a $SUB Certificate</h1>
          <p className="mt-2 text-sm text-teal-500 leading-relaxed">
            Cross-check any $SUB certificate against its original Walrus reading.
            This runs <span className="text-teal-300 font-medium">entirely in your browser</span> —
            no Subsidized Energy server is contacted.
          </p>
        </div>

        {/* How it works */}
        <div className="rounded-2xl border border-teal-900/30 bg-teal-950/20 px-5 py-4 flex flex-col gap-3">
          <p className="text-xs text-teal-500 uppercase tracking-wider font-medium">How it works</p>
          <ol className="flex flex-col gap-2">
            {[
              ['Sui RPC', 'Fetches the on-chain object directly from the Sui testnet fullnode.'],
              ['Walrus',  'Reads the original production reading from the Walrus aggregator.'],
              ['Compare', 'Checks watt_hours, producer, and production_day for exact equality.'],
            ].map(([step, desc]) => (
              <li key={step} className="flex items-start gap-3 text-xs">
                <span className="shrink-0 w-14 text-teal-600 font-mono">{step}</span>
                <span className="text-teal-500">{desc}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Input form */}
        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-teal-400 font-medium uppercase tracking-wider">
              Certificate Object ID
            </label>
            <input
              type="text"
              value={certId}
              onChange={(e) => { setCertId(e.target.value); setOutcome(null); }}
              placeholder="0x…"
              spellCheck={false}
              className="px-4 py-3 rounded-xl bg-[#0a0f0a] border border-teal-800/50 text-teal-100 placeholder-teal-700 focus:outline-none focus:border-teal-500 text-sm font-mono"
            />
            <p className="text-xs text-teal-700">
              Pre-filled with a real testnet certificate. Paste any <code className="text-teal-600">0x…</code> object ID.
            </p>
          </div>

          <button
            type="submit"
            disabled={verifying || !certId.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verifying ? 'Verifying…' : '🔍 Verify certificate'}
          </button>
        </form>

        {/* Result */}
        {outcome && <VerifyResult outcome={outcome} />}

        {/* Footer note */}
        <p className="text-xs text-teal-800 text-center">
          Source: Sui testnet fullnode · Walrus testnet aggregator · No backend calls made
        </p>
      </div>
    </main>
  );
}
