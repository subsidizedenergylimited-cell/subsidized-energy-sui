'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { StatSlot } from '@/components/StatSlot';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/useAuth';

interface Stats {
  totalKwh: number;
  activeProducers: number;
  carbonOffsetKg: number;
}

export default function LandingPage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalKwh: 0, activeProducers: 0, carbonOffsetKg: 0 });

  useEffect(() => {
    api.request<Stats>('/stats').then(setStats).catch(() => {});
  }, []);

  return (
    <main className="flex flex-col min-h-screen relative">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-teal-900/40">
        <div className="flex items-center gap-2">
          <span className="text-2xl">☀️</span>
          <span className="font-bold text-teal-300 tracking-tight">Subsidized Energy</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/verify" className="text-sm text-teal-500 hover:text-teal-300 transition-colors hidden sm:block">
            Verify
          </Link>
          {!loading && user ? (
            <>
              <span className="text-sm text-teal-500 hidden sm:block">{user.suiAddress.slice(0, 10)}…</span>
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors"
              >
                Dashboard
              </Link>
            </>
          ) : (
            <Link
              href="/auth"
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors"
            >
              Get Started
            </Link>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center flex-1 px-6 py-24 text-center relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-teal-500/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full bg-emerald-500/8 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-8 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-700/50 bg-teal-950/50 text-teal-400 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live on Sui Testnet · Walrus Verified
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold leading-tight tracking-tight">
            <span className="text-white">Your solar panel.</span>
            <br />
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              On-chain, every day.
            </span>
          </h1>

          <p className="text-lg text-teal-300/80 max-w-xl leading-relaxed">
            Subsidized Energy turns your daily solar production into a soulbound $SUB certificate
            on Sui, backed by immutable Walrus proof. No trust required — verify it yourself.
          </p>

          <div className="flex gap-4 flex-wrap justify-center">
            <Link
              href="/auth"
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-semibold text-base transition-all shadow-lg shadow-teal-500/20"
            >
              Connect &amp; Earn $SUB
            </Link>
            <a
              href="https://testnet.suivision.xyz/object/0x62163791a217539103b137252c5d454a0af72a43d5c49561125907ddb8ed04f7"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-xl border border-teal-700 hover:border-teal-500 text-teal-300 font-semibold text-base transition-all"
            >
              View Contract ↗
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-8">
            <StatSlot
              label="Total Production"
              value={stats.totalKwh.toLocaleString()}
              unit="kWh"
            />
            <StatSlot
              label="Active Producers"
              value={stats.activeProducers.toLocaleString()}
            />
            <StatSlot
              label="Carbon Offset"
              value={(stats.carbonOffsetKg / 1000).toFixed(1)}
              unit="t CO₂"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 border-t border-teal-900/40">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-teal-200 mb-12">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Connect Inverter', body: 'Link your solar inverter via our secure adapter. Credentials are encrypted at rest and never logged.' },
              { step: '02', title: 'Daily Proof on Walrus', body: 'Every 24 hours your production reading is stored on Walrus as an immutable, publicly-verifiable blob.' },
              { step: '03', title: 'Mint $SUB Certificate', body: 'A soulbound $SUB NFT is minted on Sui, referencing the Walrus blob ID. It cannot be transferred — only yours.' },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex flex-col gap-3 p-6 rounded-2xl border border-teal-900/30 bg-teal-950/20">
                <span className="text-4xl font-black text-teal-800">{step}</span>
                <h3 className="text-lg font-semibold text-teal-200">{title}</h3>
                <p className="text-sm text-teal-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="px-6 py-6 border-t border-teal-900/40 text-center text-sm text-teal-700">
        Subsidized Energy · Sui Overflow 2026 · Walrus Track
      </footer>
    </main>
  );
}
