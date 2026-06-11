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

  return (
    <main className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-teal-900/40">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">☀️</span>
          <span className="font-bold text-teal-300 tracking-tight text-sm">Subsidized Energy</span>
        </Link>
        <button
          onClick={() => { logout(); router.push('/'); }}
          className="text-sm text-teal-500 hover:text-teal-300 transition-colors"
        >
          Sign out
        </button>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 gap-8">
        <div className="w-full max-w-lg flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-900/60 border border-teal-700 flex items-center justify-center text-xl">
              ☀️
            </div>
            <div>
              <p className="text-xs text-teal-500 uppercase tracking-wider">Signed in as</p>
              <p className="text-sm font-mono text-teal-200 truncate">{user.suiAddress}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-teal-900/40 bg-teal-950/30">
              <p className="text-xs text-teal-500 uppercase tracking-wider mb-1">SRE Points</p>
              <p className="text-3xl font-bold text-teal-300">{user.srePoints}</p>
            </div>
            <div className="p-5 rounded-2xl border border-teal-900/40 bg-teal-950/30">
              <p className="text-xs text-teal-500 uppercase tracking-wider mb-1">Account type</p>
              <p className="text-lg font-semibold text-teal-200">{user.custodial ? 'Custodial' : 'Self-custody'}</p>
            </div>
          </div>

          {user.email && (
            <div className="px-4 py-3 rounded-xl border border-teal-900/30 bg-teal-950/20 text-sm text-teal-400">
              {user.email}
            </div>
          )}

          <div className="rounded-2xl border border-dashed border-teal-800/40 p-8 text-center text-teal-600 text-sm">
            Inverter management, certificate history, and pipeline controls coming in Slice 2.
          </div>
        </div>
      </div>
    </main>
  );
}
