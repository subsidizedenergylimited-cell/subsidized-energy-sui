'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { api } from '@/lib/api';
import { CertificateCard } from '@/components/CertificateCard';

// Nigeria grid emission factor (kg CO₂ per kWh avoided)
const CO2_FACTOR = 0.43;

type Inverter = { id: string; brand: string; label: string; status: string };
type Certificate = {
  id: string; productionDay: number; wattHours: number;
  walrusBlobId: string; certObjectId: string; txDigest: string;
  mintedAt: string; inverter: { brand: string; label: string };
};

function StatCard({
  label, value, unit, sub, loading,
}: { label: string; value: string | number; unit?: string; sub?: string; loading: boolean }) {
  return (
    <div className="p-5 rounded-2xl border border-teal-900/40 bg-teal-950/30 flex flex-col gap-1">
      <p className="text-xs text-teal-500 uppercase tracking-wider">{label}</p>
      {loading ? (
        <div className="h-8 w-24 rounded-lg bg-teal-900/40 animate-pulse mt-1" />
      ) : (
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-teal-200 tabular-nums">{value}</span>
          {unit && <span className="text-sm text-teal-400">{unit}</span>}
        </div>
      )}
      {sub && <p className="text-xs text-teal-600">{sub}</p>}
    </div>
  );
}

function SectionError({ message }: { message: string }) {
  return (
    <div className="px-4 py-3 rounded-xl border border-red-900/40 bg-red-950/20 text-red-400 text-sm">
      {message}
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  // Independent data states
  const [inverters, setInverters] = useState<Inverter[]>([]);
  const [invertersLoading, setInvertersLoading] = useState(true);
  const [invertersError, setInvertersError] = useState('');

  const [certs, setCerts] = useState<Certificate[]>([]);
  const [certsLoading, setCertsLoading] = useState(true);
  const [certsError, setCertsError] = useState('');

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth');
  }, [user, authLoading, router]);

  const fetchInverters = useCallback(async () => {
    setInvertersLoading(true);
    setInvertersError('');
    try {
      setInverters(await api.getInverters());
    } catch (err) {
      setInvertersError(err instanceof Error ? err.message : 'Failed to load inverters');
    } finally {
      setInvertersLoading(false);
    }
  }, []);

  const fetchCerts = useCallback(async () => {
    setCertsLoading(true);
    setCertsError('');
    try {
      setCerts(await api.getCertificates());
    } catch (err) {
      setCertsError(err instanceof Error ? err.message : 'Failed to load certificates');
    } finally {
      setCertsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchInverters();
      fetchCerts();
    }
  }, [user, fetchInverters, fetchCerts]);

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-teal-500 text-sm">
        Loading…
      </main>
    );
  }
  if (!user) return null;

  // Derived totals
  const totalKwh     = certs.reduce((s, c) => s + c.wattHours, 0) / 1000;
  const co2Kg        = totalKwh * CO2_FACTOR;
  const statsLoading = certsLoading;

  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
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

      <div className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full flex flex-col gap-8">

        {/* Identity strip */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-teal-900/60 border border-teal-700 flex items-center justify-center text-lg shrink-0">
            ☀️
          </div>
          <div className="min-w-0">
            <p className="text-xs text-teal-500 uppercase tracking-wider">Producer dashboard</p>
            <p className="text-sm font-mono text-teal-300 truncate">{user.suiAddress}</p>
            {user.email && <p className="text-xs text-teal-600 truncate">{user.email}</p>}
          </div>
        </div>

        {/* ── Summary stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Energy certified"
            value={totalKwh.toFixed(2)}
            unit="kWh"
            loading={statsLoading}
          />
          <StatCard
            label="SRE Points"
            value={user.srePoints}
            loading={false}
          />
          <StatCard
            label="CO₂ offset"
            value={co2Kg >= 1000 ? (co2Kg / 1000).toFixed(2) : co2Kg.toFixed(2)}
            unit={co2Kg >= 1000 ? 't' : 'kg'}
            sub="est. × 0.43 NG factor"
            loading={statsLoading}
          />
          <StatCard
            label="Inverters"
            value={invertersLoading ? '—' : inverters.length}
            loading={false}
          />
        </div>

        {/* ── Certificates ── */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-teal-200">Your Certificates</h2>
            {!certsLoading && certs.length > 0 && (
              <span className="text-xs text-teal-600">{certs.length} minted</span>
            )}
          </div>

          {certsError && <SectionError message={certsError} />}

          {certsLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-40 rounded-2xl bg-teal-950/30 border border-teal-900/30 animate-pulse" />
              ))}
            </div>
          ) : certs.length === 0 && !certsError ? (
            <div className="rounded-2xl border border-dashed border-teal-800/40 p-8 flex flex-col items-center gap-4 text-center">
              <span className="text-4xl opacity-40">📋</span>
              <div>
                <p className="text-sm font-medium text-teal-400">No certificates yet</p>
                <p className="text-xs text-teal-600 mt-1 leading-relaxed max-w-xs">
                  One $SUB certificate is minted on Sui each day per connected inverter,
                  with your production reading stored on Walrus.
                </p>
              </div>
              {!invertersLoading && inverters.length === 0 && (
                <Link
                  href="/inverters"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium transition-colors"
                >
                  Connect an inverter →
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {certs.map((cert) => (
                <CertificateCard
                  key={cert.id}
                  productionDay={cert.productionDay}
                  wattHours={cert.wattHours}
                  mintedAt={cert.mintedAt}
                  certObjectId={cert.certObjectId}
                  walrusBlobId={cert.walrusBlobId}
                  inverterLabel={cert.inverter.label}
                  inverterBrand={cert.inverter.brand}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── SRE rewards coming soon ── */}
        <div className="rounded-2xl border border-dashed border-teal-900/30 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-950/50 border border-teal-900/40 flex items-center justify-center text-xl opacity-50">
            🪙
          </div>
          <div>
            <p className="text-sm font-medium text-teal-500">$SRE Rewards</p>
            <p className="text-xs text-teal-700 mt-0.5">
              Token launch coming soon. Your {user.srePoints} SRE point{user.srePoints !== 1 ? 's' : ''} will convert.
            </p>
          </div>
          <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-teal-950/60 border border-teal-900/40 text-teal-600 font-medium shrink-0">
            Soon
          </span>
        </div>

        {/* Inverters error (isolated) */}
        {invertersError && <SectionError message={`Inverters: ${invertersError}`} />}
      </div>
    </main>
  );
}
