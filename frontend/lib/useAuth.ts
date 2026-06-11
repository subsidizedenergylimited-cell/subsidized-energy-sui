'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

export interface AuthUser {
  id: string;
  email: string | null;
  suiAddress: string;
  srePoints: number;
  custodial: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = api.getToken();
    if (!token) { setUser(null); setLoading(false); return; }
    try {
      const me = await api.me();
      setUser(me);
    } catch {
      api.clearSession();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const logout = useCallback(() => {
    api.clearSession();
    setUser(null);
  }, []);

  return { user, loading, logout, refresh };
}
