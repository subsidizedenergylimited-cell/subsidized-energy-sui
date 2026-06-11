'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import { CongratsModal } from '@/components/CongratsModal';
import { Toast } from '@/components/Toast';

// ── Brand config ─────────────────────────────────────────────────────────────

interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'password' | 'email';
  placeholder?: string;
}

interface BrandDef {
  id: string;
  label: string;
  icon: string;
  fields: FieldDef[];
}

const BRANDS: BrandDef[] = [
  {
    id: 'mock',
    label: 'Demo (no hardware)',
    icon: '🔋',
    fields: [
      { key: 'serial', label: 'Demo label', type: 'text', placeholder: 'e.g. DEMO-001' },
    ],
  },
  {
    id: 'solaredge',
    label: 'SolarEdge',
    icon: '⚡',
    fields: [
      { key: 'apiKey',  label: 'API Key',  type: 'password' },
      { key: 'siteId',  label: 'Site ID',  type: 'text' },
    ],
  },
  {
    id: 'growatt',
    label: 'Growatt',
    icon: '🌱',
    fields: [
      { key: 'username', label: 'Username', type: 'text' },
      { key: 'password', label: 'Password', type: 'password' },
    ],
  },
  {
    id: 'deye',
    label: 'Deye / Solarman',
    icon: '☀️',
    fields: [
      { key: 'appId',     label: 'App ID',     type: 'text' },
      { key: 'appSecret', label: 'App Secret', type: 'password' },
      { key: 'email',     label: 'Email',       type: 'email' },
      { key: 'password',  label: 'Password',   type: 'password' },
    ],
  },
  {
    id: 'huawei',
    label: 'Huawei FusionSolar',
    icon: '🔆',
    fields: [
      { key: 'userName',   label: 'Username',    type: 'text' },
      { key: 'systemCode', label: 'System Code', type: 'password' },
    ],
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface Inverter {
  id: string;
  brand: string;
  label: string;
  status: string;
  createdAt: string;
}

const BRAND_ICON: Record<string, string> = Object.fromEntries(
  BRANDS.map((b) => [b.id, b.icon])
);
const BRAND_LABEL: Record<string, string> = Object.fromEntries(
  BRANDS.map((b) => [b.id, b.label])
);

// ── Page ─────────────────────────────────────────────────────────────────────

export default function InvertersPage() {
  const { user, loading, logout, refresh: refreshAuth } = useAuth();
  const router = useRouter();

  // Auth guard
  useEffect(() => {
    if (!loading && !user) router.replace('/auth');
  }, [user, loading, router]);

  // Inverter list
  const [inverters, setInverters] = useState<Inverter[]>([]);
  const [listLoading, setListLoading] = useState(true);

  const fetchInverters = useCallback(async () => {
    try {
      const data = await api.getInverters();
      setInverters(data);
    } catch {
      // ignore — list just stays empty
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) fetchInverters();
  }, [user, fetchInverters]);

  // Connect form
  const [selectedBrand, setSelectedBrand] = useState<BrandDef>(BRANDS[0]);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Reset credentials when brand changes
  useEffect(() => {
    setCredentials({});
    setFormError('');
  }, [selectedBrand]);

  // Success state
  const [congrats, setCongrats] = useState<{ points: number; label: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const result = await api.connectInverter(selectedBrand.id, credentials);
      // Refresh auth so srePoints updates immediately
      await refreshAuth();
      await fetchInverters();

      if (result.bonusAwarded) {
        setCongrats({ points: result.srePointsAwarded, label: result.label });
      } else {
        setToast(`${result.label} connected successfully.`);
      }
      // Reset form
      setCredentials({});
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-teal-500 text-sm">
        Loading…
      </main>
    );
  }
  if (!user) return null;

  const brandDef = selectedBrand;

  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-teal-900/40">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">☀️</span>
          <span className="font-bold text-teal-300 tracking-tight text-sm">Subsidized Energy</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-teal-500 hover:text-teal-300 transition-colors">
            Dashboard
          </Link>
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="text-sm text-teal-500 hover:text-teal-300 transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      <div className="flex-1 px-4 py-10 max-w-2xl mx-auto w-full flex flex-col gap-10">

        {/* ── Connect form ── */}
        <section>
          <h1 className="text-2xl font-bold text-teal-200 mb-1">Connect Inverter</h1>
          <p className="text-sm text-teal-500 mb-6">
            Link your solar inverter to start earning $SUB certificates.
          </p>

          <form onSubmit={handleConnect} className="flex flex-col gap-6">
            {/* Brand selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-teal-400 font-medium uppercase tracking-wider">Brand</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BRANDS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBrand(b)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left ${
                      selectedBrand.id === b.id
                        ? 'border-teal-500 bg-teal-900/40 text-teal-100'
                        : 'border-teal-900/40 bg-teal-950/20 text-teal-400 hover:border-teal-700 hover:text-teal-200'
                    }`}
                  >
                    <span className="text-base">{b.icon}</span>
                    <span className="truncate">{b.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic credential fields */}
            <div className="rounded-2xl border border-teal-800/40 bg-teal-950/30 p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-teal-300">
                <span>{brandDef.icon}</span>
                {brandDef.label}
              </div>

              {brandDef.fields.map((field) => (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <label className="text-xs text-teal-400 font-medium uppercase tracking-wider">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    required
                    value={credentials[field.key] ?? ''}
                    onChange={(e) =>
                      setCredentials((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    placeholder={field.placeholder ?? ''}
                    autoComplete={field.type === 'password' ? 'new-password' : 'off'}
                    className="px-4 py-2.5 rounded-lg bg-[#0a0f0a] border border-teal-800/50 text-teal-100 placeholder-teal-700 focus:outline-none focus:border-teal-500 text-sm font-mono"
                  />
                </div>
              ))}

              {formError && (
                <div className="px-4 py-3 rounded-lg bg-red-950/40 border border-red-800/40 text-red-400 text-sm">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1"
              >
                {submitting ? 'Connecting…' : 'Connect inverter'}
              </button>
            </div>
          </form>
        </section>

        {/* ── My inverters ── */}
        <section>
          <h2 className="text-lg font-semibold text-teal-200 mb-4">My Inverters</h2>

          {listLoading ? (
            <p className="text-sm text-teal-600">Loading…</p>
          ) : inverters.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-teal-800/40 p-8 flex flex-col items-center gap-3 text-center">
              <span className="text-3xl opacity-40">🔌</span>
              <p className="text-sm text-teal-600">No inverters connected yet.</p>
              <p className="text-xs text-teal-700">Connect one above to start minting $SUB certificates.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {inverters.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-teal-900/40 bg-teal-950/20"
                >
                  <span className="text-2xl">{BRAND_ICON[inv.brand] ?? '⚡'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-teal-200 truncate">{inv.label}</p>
                    <p className="text-xs text-teal-600">{BRAND_LABEL[inv.brand] ?? inv.brand}</p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      inv.status === 'active'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/30'
                        : 'bg-teal-950/60 text-teal-500 border border-teal-800/30'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Congrats modal */}
      {congrats && (
        <CongratsModal
          points={congrats.points}
          label={congrats.label}
          onClose={() => setCongrats(null)}
        />
      )}

      {/* Quiet toast */}
      {toast && (
        <Toast message={toast} onDismiss={() => setToast(null)} />
      )}
    </main>
  );
}
