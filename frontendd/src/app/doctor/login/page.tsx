'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@../../../components/auth/AuthProvider';

export default function DoctorLoginPage() {
  const { user } = useAuth();

  // ✅ start empty (no prefill)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (user) window.location.href = '/doctor/dashboard';
  }, [user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error(await res.text());
      window.location.href = '/doctor/dashboard';
    } catch (err) {
      setMsg('Login failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm card p-5">
      <h1 className="text-xl font-semibold mb-4">Doctor Login</h1>
      <form className="space-y-3" onSubmit={submit}>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            inputMode="email"
            autoComplete="username"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="password">Password</label>
          <div className="flex gap-2">
            <input
              id="password"
              className="input flex-1"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setShowPw(s => !s)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {msg && <p className="text-sm text-red-600 mt-3">{msg}</p>}

      <p className="text-xs text-slate-600 mt-4">
        No account? <a className="underline" href="/doctor/register">Register</a>
      </p>
    </div>
  );
}
