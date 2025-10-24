'use client';
import { useEffect, useState } from 'react';

export default function AppointmentsPage() {
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [items, setItems] = useState<any[]>([]);

  async function load(){
    if (!from || !to) return;
    const u = new URL(`${process.env.NEXT_PUBLIC_API_BASE}/doctor/appointments`);
    u.searchParams.set('from', from); u.searchParams.set('to', to);
    const res = await fetch(u.toString(), { credentials: 'include' });
    setItems(await res.json());
  }

  useEffect(()=>{ if(from&&to) load(); },[from,to]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Appointments</h1>
      <div className="card p-4 grid sm:grid-cols-3 gap-3">
        <div>
          <div className="label">From</div>
          <input type="date" className="input" value={from} onChange={e=>setFrom(e.target.value)} />
        </div>
        <div>
          <div className="label">To</div>
          <input type="date" className="input" value={to} onChange={e=>setTo(e.target.value)} />
        </div>
        <div className="flex items-end">
          <button className="btn btn-outline w-full" onClick={load}>Search</button>
        </div>
      </div>

      <div className="grid gap-3">
        {items.map(a => (
          <div key={a.id} className="card p-4 text-sm">
            <div className="font-medium">{new Date(a.start_at).toLocaleString()} – {new Date(a.end_at).toLocaleTimeString()}</div>
            <div>{a.patient_name} · {a.patient_email} · {a.patient_phone}</div>
            {a.reason && <div className="text-slate-600">Reason: {a.reason}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
