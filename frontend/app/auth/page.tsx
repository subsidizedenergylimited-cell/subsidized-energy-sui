'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCurrentAccount, useSignPersonalMessage, useConnectWallet, useWallets } from '@mysten/dapp-kit';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/useAuth';

type Mode = 'login' | 'register';

export default function AuthPage() {
  const router = useRouter();
  const { refresh } = useAuth();

  // Email/password state
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // Wallet state
  const wallets = useWallets();
  const { mutate: connectWallet } = useConnectWallet();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const [walletError, setWalletError] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError('');
    setEmailLoading(true);
    try {
      if (mode === 'register') {
        await api.register(email, password);
      } else {
        await api.login(email, password);
      }
      await refresh();
      router.push('/dashboard');
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Auth failed');
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleWalletAuth() {
    if (!currentAccount) {
      setWalletError('No wallet connected. Connect a wallet first.');
      return;
    }
    setWalletError('');
    setWalletLoading(true);
    try {
      const { message } = await api.walletNonce(currentAccount.address);
      const { signature } = await signPersonalMessage({ message: new TextEncoder().encode(message) });
      await api.walletVerify(currentAccount.address, message, signature);
      await refresh();
      router.push('/dashboard');
    } catch (err) {
      setWalletError(err instanceof Error ? err.message : 'Wallet auth failed');
    } finally {
      setWalletLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Back */}
      <Link href="/" className="absolute top-6 left-6 text-sm text-teal-500 hover:text-teal-300 transition-colors">
        ← Back
      </Link>

      <div className="w-full max-w-md flex flex-col gap-8">
        <div className="text-center">
          <span className="text-4xl">☀️</span>
          <h1 className="mt-3 text-2xl font-bold text-teal-200">Join Subsidized Energy</h1>
          <p className="mt-1 text-sm text-teal-500">Two ways to get started — pick yours.</p>
        </div>

        {/* ── Door 1: Email / Password ── */}
        <div className="rounded-2xl border border-teal-800/50 bg-teal-950/30 p-6 flex flex-col gap-5">
          <div className="flex gap-2 p-1 rounded-lg bg-teal-950/60 border border-teal-900/40">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setEmailError(''); }}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  mode === m
                    ? 'bg-teal-600 text-white'
                    : 'text-teal-400 hover:text-teal-200'
                }`}
              >
                {m === 'login' ? 'Sign in' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-teal-400 font-medium uppercase tracking-wider">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="px-4 py-2.5 rounded-lg bg-[#0a0f0a] border border-teal-800/50 text-teal-100 placeholder-teal-700 focus:outline-none focus:border-teal-500 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-teal-400 font-medium uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="px-4 py-2.5 rounded-lg bg-[#0a0f0a] border border-teal-800/50 text-teal-100 placeholder-teal-700 focus:outline-none focus:border-teal-500 text-sm"
              />
            </div>
            {emailError && <p className="text-red-400 text-sm">{emailError}</p>}
            <button
              type="submit"
              disabled={emailLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {emailLoading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>

        <div className="flex items-center gap-3 text-teal-700 text-xs">
          <span className="flex-1 h-px bg-teal-900/40" />
          or
          <span className="flex-1 h-px bg-teal-900/40" />
        </div>

        {/* ── Door 2: Wallet ── */}
        <div className="rounded-2xl border border-teal-800/50 bg-teal-950/30 p-6 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-teal-300">Connect Sui Wallet</h2>

          {!currentAccount ? (
            <div className="flex flex-col gap-2">
              {wallets.length === 0 && (
                <p className="text-xs text-teal-500">No Sui wallets detected. Install Sui Wallet or Suiet.</p>
              )}
              {wallets.map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={() => connectWallet({ wallet })}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-teal-800/40 hover:border-teal-600 bg-teal-950/40 hover:bg-teal-900/30 text-teal-200 text-sm font-medium transition-all"
                >
                  {wallet.icon && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={wallet.icon} alt={wallet.name} className="w-5 h-5 rounded" />
                  )}
                  {wallet.name}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-950/40 border border-emerald-800/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-emerald-300 font-mono truncate">{currentAccount.address}</span>
              </div>
              {walletError && <p className="text-red-400 text-sm">{walletError}</p>}
              <button
                onClick={handleWalletAuth}
                disabled={walletLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {walletLoading ? 'Signing…' : 'Sign in with wallet'}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
