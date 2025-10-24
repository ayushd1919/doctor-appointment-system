'use client';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useToast } from '@../../../components/ui/toaster';

type Rule = { weekday:number; start_time:string; end_time:string };
type Unav = { id:number; doctor_id:number; start_at:string; end_at:string; reason?:string|null };

const WD = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function SchedulePage() {
  const { push } = useToast();
  const [rules, setRules] = useState<Rule[]>([
    { weekday:1, start_time:'09:00', end_time:'17:00' },
    { weekday:2, start_time:'09:00', end_time:'17:00' },
    { weekday:3, start_time:'09:00', end_time:'17:00' },
    { weekday:4, start_time:'09:00', end_time:'17:00' },
    { weekday:5, start_time:'09:00', end_time:'17:00' },
  ]);

  // Unavailability form + list
  const [uFrom, setUFrom] = useState<string>('');   // datetime-local
  const [uTo, setUTo] = useState<string>('');       // datetime-local
  const [uReason, setUReason] = useState<string>('');
  const [unavs, setUnavs] = useState<Unav[]>([]);
  const [rangeFrom, setRangeFrom] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [rangeDays, setRangeDays] = useState<number>(7);

  async function saveRules() {
    try {
      // keep only Mon–Fri
      const cleaned = rules.filter(r => r.weekday>=1 && r.weekday<=5);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/doctor/working-rules`, {
        method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
        body: JSON.stringify({ rules: cleaned }),
      });
      if (!res.ok) throw new Error(await res.text());
      push({ title:'Working hours saved', variant:'success' });
    } catch (e:any) {
      push({ title:'Failed to save', description:String(e?.message||''), variant:'error' });
    }
  }

  async function addUnavailability() {
    try {
      if (!uFrom || !uTo) { push({ title:'Select start & end', variant:'error' }); return; }
      const startISO = new Date(uFrom).toISOString();
      const endISO = new Date(uTo).toISOString();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/doctor/unavailability`, {
        method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
        body: JSON.stringify({ start_at: startISO, end_at: endISO, reason: uReason || undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      push({ title:'Unavailability added', variant:'success' });
      setUReason(''); // clear
      // refresh list
      await loadUnavs();
    } catch (e:any) {
      push({ title:'Failed to add', description:String(e?.message||''), variant:'error' });
    }
  }

  async function deleteUnavailability(id:number) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/doctor/unavailability/${id}`, {
        method:'DELETE', credentials:'include'
      });
      if (!res.ok) throw new Error(await res.text());
      setUnavs(prev => prev.filter(u => u.id !== id));
      push({ title:'Removed', variant:'success' });
    } catch (e:any) {
      push({ title:'Failed to delete', description:String(e?.message||''), variant:'error' });
    }
  }

  async function loadUnavs() {
    // Optional backend helper (see note below). If it 404s, just skip.
    try {
      const from = dayjs(rangeFrom).startOf('day').toISOString();
      const to = dayjs(rangeFrom).startOf('day').add(rangeDays, 'day').toISOString();
      const u = new URL(`${process.env.NEXT_PUBLIC_API_BASE}/doctor/unavailability`);
      u.searchParams.set('from', from); u.searchParams.set('to', to);
      const res = await fetch(u.toString(), { credentials:'include' });
      if (!res.ok) return; // silently ignore if endpoint not present
      const data = await res.json();
      setUnavs(data.items || data || []);
    } catch { /* ignore */ }
  }

  useEffect(()=>{ loadUnavs(); }, [rangeFrom, rangeDays]);

  const monFri = useMemo(()=>rules.filter(r=>r.weekday>=1 && r.weekday<=5).sort((a,b)=>a.weekday-b.weekday),[rules]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Schedule</h1>
        <p className="text-sm text-slate-600">Define working hours (Mon–Fri) and mark breaks/emergencies.</p>
      </div>

      {/* Working hours */}
      <div className="card p-4">
        <h2 className="font-medium mb-3">Working hours (Mon–Fri)</h2>
        <div className="grid gap-3">
          {monFri.map((r, idx) => (
            <div key={idx} className="grid grid-cols-5 gap-3 items-center">
              <div className="text-sm">{WD[r.weekday]}</div>
              <input type="time" value={r.start_time} onChange={e=>updateRule(r.weekday,'start_time',e.target.value)} className="input" />
              <input type="time" value={r.end_time}   onChange={e=>updateRule(r.weekday,'end_time',e.target.value)} className="input" />
              <div className="col-span-2 text-xs text-slate-500">20-min slots are derived automatically</div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <button className="btn btn-primary" onClick={saveRules}>Save hours</button>
        </div>
      </div>

      {/* Unavailability (breaks/emergencies) */}
      <div className="card p-4 space-y-4">
        <h2 className="font-medium">Mark slot(s) as unavailable</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <div className="label">Start</div>
            <input type="datetime-local" className="input" value={uFrom} onChange={e=>setUFrom(e.target.value)} />
          </div>
          <div>
            <div className="label">End</div>
            <input type="datetime-local" className="input" value={uTo} onChange={e=>setUTo(e.target.value)} />
          </div>
          <div>
            <div className="label">Reason (optional)</div>
            <input className="input" value={uReason} onChange={e=>setUReason(e.target.value)} placeholder="Lunch / Emergency" />
          </div>
        </div>
        <button className="btn btn-outline" onClick={addUnavailability}>Add unavailability</button>

        <div className="pt-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <div>
              <div className="label">View range start</div>
              <input type="date" className="input" value={rangeFrom} onChange={e=>setRangeFrom(e.target.value)} />
            </div>
            <div>
              <div className="label">Days</div>
              <select className="select" value={rangeDays} onChange={e=>setRangeDays(Number(e.target.value))}>
                <option value={7}>7</option>
                <option value={14}>14</option>
              </select>
            </div>
            <button className="btn btn-outline" onClick={loadUnavs}>Refresh</button>
          </div>

          {unavs.length === 0 ? (
            <p className="text-sm text-slate-600">No unavailability in this range.</p>
          ) : (
            <div className="grid gap-2">
              {unavs.map(u => (
                <div key={u.id} className="grid sm:grid-cols-5 gap-3 items-center card p-3">
                  <div className="text-sm sm:col-span-2">
                    {dayjs(u.start_at).format('ddd, MMM D HH:mm')} – {dayjs(u.end_at).format('HH:mm')}
                  </div>
                  <div className="text-sm text-slate-600 sm:col-span-2">{u.reason || '—'}</div>
                  <button className="btn btn-outline" onClick={()=>deleteUnavailability(u.id)}>Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  function updateRule(weekday:number, key:'start_time'|'end_time', val:string) {
    setRules(prev => {
      const copy = [...prev];
      const i = copy.findIndex(x => x.weekday===weekday);
      if (i>=0) copy[i] = { ...copy[i], [key]: val };
      else copy.push({ weekday, start_time: key==='start_time'?val:'09:00', end_time: key==='end_time'?val:'17:00' });
      return copy;
    });
  }
}
