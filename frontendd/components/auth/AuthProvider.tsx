'use client';
import { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';

type DoctorUser = { id:number; name:string; email:string; specialty_id:number } | null;
type Ctx = {
  user: DoctorUser;
  loading: boolean;
  refresh(): void;
  logout(): Promise<void>;
};

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<DoctorUser>(null);
  const [loading, setLoading] = useState(true);

  async function fetchMe() {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/doctor/me`, { credentials: 'include' });
      if (!res.ok) { setUser(null); return; }
      setUser(await res.json());
    } catch { setUser(null); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchMe(); }, []);

  async function logout() {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
    } finally {
      setUser(null);
      // hard refresh to update header quickly
      window.location.href = '/';
    }
  }

  return (
    <AuthCtx.Provider value={{ user, loading, refresh: fetchMe, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
