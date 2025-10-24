'use client';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

export default function Dashboard() {
  const [me, setMe] = useState<any>(null);
  const [today, setToday] = useState<any[]>([]);
  const [err, setErr] = useState<string|undefined>();

  async function load() {
    try {
      const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/doctor/me`, { credentials: 'include' });
      if (!meRes.ok) throw new Error(await meRes.text());
      setMe(await meRes.json());
      const tRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/doctor/appointments/today`, { credentials: 'include' });
      setToday(await tRes.json());
    } catch { setErr('Please login again'); }
  }

  useEffect(()=>{ load(); }, []);

  if (err) return <p>{err} · <a className="underline" href="/doctor/login">Login</a></p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      {me && <p className="text-slate-600">Welcome, <b>{me.name}</b></p>}

      <div className="space-y-2">
        <h2 className="font-medium">Today&apos;s Appointments</h2>
        {today.length===0 && <p className="text-sm text-slate-600">No appointments today.</p>}
        {today.map(a => (
          <div key={a.id} className="card p-4">
            <div className="text-sm">{dayjs(a.start_at).format('HH:mm')} – {dayjs(a.end_at).format('HH:mm')}</div>
            <div className="font-medium">{a.patient_name}</div>
            <div className="text-sm text-slate-600">{a.patient_email} · {a.patient_phone}</div>
            {a.reason && <div className="text-sm mt-1">Reason: {a.reason}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
