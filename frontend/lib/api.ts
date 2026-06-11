'use client';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const TOKEN_KEY = 'sub_jwt';
const ADDR_KEY  = 'sub_address';

export const api = {
  getToken(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  },
  getAddress(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem(ADDR_KEY) : null;
  },
  setSession(token: string, suiAddress: string) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ADDR_KEY, suiAddress);
  },
  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADDR_KEY);
  },

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> ?? {}),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE}${path}`, { ...init, headers });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(body.error ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
  },

  async register(email: string, password: string): Promise<{ token: string; suiAddress: string }> {
    const data = await this.request<{ token: string; suiAddress: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setSession(data.token, data.suiAddress);
    return data;
  },

  async login(email: string, password: string): Promise<{ token: string; suiAddress: string }> {
    const data = await this.request<{ token: string; suiAddress: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setSession(data.token, data.suiAddress);
    return data;
  },

  async walletNonce(address: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/auth/wallet/nonce', {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
  },

  async walletVerify(address: string, message: string, signature: string): Promise<{ token: string; suiAddress: string }> {
    const data = await this.request<{ token: string; suiAddress: string }>('/auth/wallet/verify', {
      method: 'POST',
      body: JSON.stringify({ address, message, signature }),
    });
    this.setSession(data.token, data.suiAddress);
    return data;
  },

  async me(): Promise<{ id: string; email: string | null; suiAddress: string; srePoints: number; custodial: boolean }> {
    return this.request('/me');
  },

  async connectInverter(brand: string, credentials: Record<string, string>): Promise<{
    id: string; brand: string; label: string; status: string;
    bonusAwarded: boolean; srePointsAwarded: number;
  }> {
    return this.request('/inverters/connect', {
      method: 'POST',
      body: JSON.stringify({ brand, credentials }),
    });
  },

  async getInverters(): Promise<Array<{
    id: string; brand: string; label: string; status: string; createdAt: string;
  }>> {
    return this.request('/inverters');
  },

  async getCertificates(): Promise<Array<{
    id: string;
    productionDay: number;
    wattHours: number;
    walrusBlobId: string;
    certObjectId: string;
    txDigest: string;
    mintedAt: string;
    inverter: { brand: string; label: string };
  }>> {
    return this.request('/certificates');
  },
};
