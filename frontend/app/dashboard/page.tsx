'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace('/auth');
  }, [user, loading, router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-teal-500 text-sm">
        Loading…
      </main>
    );
  }

  if (!user) return null;

  const hasBonus = user.srePoints > 0;

  return (
    <main className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-teal-900/40">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">☀️</span>
          <span className="font-bold text-teal-300 tracking-tight text-sm">Subsidized Energy</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/inverters" className="text-sm text-teal-400 hover:text-teal-200 transition-colors font-medium">
            Inverters
          </Link>
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="text-sm text-teal-500 hover:text-teal-300 transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center px-6 py-10 gap-8 max-w-lg mx-auto w-full">
        {/* Identity */}
        <div className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl border border-teal-900/40 bg-teal-950/20">
          <div className="w-9 h-9 rounded-full bg-teal-900/60 border border-teal-700 flex items-center justify-center text-lg shrink-0">
            ☀️
          </div>
          <div className="min-w-0">
            <p className="text-xs text-teal-500 uppercase tracking-wider">Signed in as</p>
            <p className="text-sm font-mono text-teal-200 truncate">{user.suiAddress}</p>
            {user.email && <p className="text-xs text-teal-600 truncate">{user.email}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="w-full grid grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl border border-teal-900/40 bg-teal-950/30">
            <p className="text-xs text-teal-500 uppercase tracking-wider mb-1">SRE Points</p>
            <p className="text-3xl font-bold text-teal-300">{user.srePoints}</p>
          </div>
          <div className="p-5 rounded-2xl border border-teal-900/40 bg-teal-950/30">
            <p className="text-xs text-teal-500 uppercase tracking-wider mb-1">Account</p>
            <p className="text-lg font-semibold text-teal-200">{user.custodial ? 'Custodial' : 'Self-custody'}</p>
          </div>
        </div>

        {/* Inverter CTA or link */}
        {!hasBonus ? (
          <Link
            href="/inverters"
            className="w-full flex items-center gap-4 p-5 rounded-2xl border border-dashed border-teal-600/50 bg-teal-950/20 hover:border-teal-500 hover:bg-teal-900/20 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-900/50 border border-teal-700/50 flex items-center justify-center text-xl group-hover:bg-teal-800/50 transition-colors">
              🔌
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-teal-300">Connect your inverter</p>
              <p className="text-xs text-teal-600">Earn +3 SRE points and start minting $SUB certificates daily.</p>
            </div>
            <span className="text-teal-600 group-hover:text-teal-400 transition-colors text-lg">→</span>
          </Link>
        ) : (
          <Link
            href="/inverters"
            className="w-full flex items-center gap-4 p-5 rounded-2xl border border-teal-900/40 bg-teal-950/20 hover:border-teal-700 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-950/50 border border-emerald-800/40 flex items-center justify-center text-xl">
              ⚡
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-teal-300">My Inverters</p>
              <p className="text-xs text-teal-600">View connected inverters and add more.</p>
            </div>
            <span className="text-teal-600 group-hover:text-teal-400 transition-colors text-lg">→</span>
          </Link>
        )}

        {/* Certificates placeholder */}
        <div className="w-full rounded-2xl border border-dashed border-teal-900/30 p-6 text-center text-teal-700 text-sm">
          Certificate history and pipeline controls — Slice 3.
        </div>
      </div>
    </main>
  );
}
