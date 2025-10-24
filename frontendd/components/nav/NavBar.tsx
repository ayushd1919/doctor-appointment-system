'use client';

import { useAuth } from '@../../../components/auth/AuthProvider';

export default function NavBar() {
  const { user, loading, logout } = useAuth();

  return (
    <nav className="mx-auto max-w-6xl px-4 py-3 flex gap-6 items-center">
      <a href="/" className="font-semibold text-lg tracking-tight">DocBook</a>
      <a href="/book" className="text-sm hover:opacity-80">Book</a>

      <div className="ml-auto flex items-center gap-3">
        {loading ? (
          <div className="text-sm text-slate-500">…</div>
        ) : user ? (
          <>
            <a href="/doctor/dashboard" className="text-sm hover:opacity-80">Dashboard</a>
            <a href="/doctor/schedule" className="text-sm hover:opacity-80">Schedule</a>
            <a href="/doctor/appointments" className="text-sm hover:opacity-80">Appointments</a>
            <button onClick={logout} className="btn btn-outline text-sm">Logout</button>
          </>
        ) : (
          <>
            <a href="/doctor/login" className="text-sm hover:opacity-80">Doctor Login</a>
            <a href="/doctor/register" className="text-sm hover:opacity-80">Register</a>
          </>
        )}
      </div>
    </nav>
  );
}
