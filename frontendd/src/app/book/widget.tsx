'use client';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { API_BASE } from '@/lib/api';
import { useToast } from '../../../components/ui/toaster';
import clsx from 'clsx';

type Doctor = { id: number; name: string; email: string; specialty_id: number; specialty?: string|null };
interface Slot { start: string; end: string; doctor_id: number }

export default function BookingWidget() {
  const { push } = useToast();
  const [query, setQuery] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selected, setSelected] = useState<'any'|number>('any');
  const [days, setDays] = useState(7);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<Slot|null>(null);

  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!;

  // load doctors on search
  useEffect(() => {
    const u = new URL(`${API_BASE}/public/doctors`);
    if (query) u.searchParams.set('search', query);
    fetch(u.toString()).then(r=>r.json()).then(setDoctors).catch(()=>setDoctors([]));
  }, [query]);

  // load availability whenever selection changes
  useEffect(() => { loadAvailability(); /* eslint-disable-next-line */ }, [selected, days]);

  async function loadAvailability() {
    try {
      setLoading(true);
      const from = dayjs().format('YYYY-MM-DD');
      let url: string;
      if (selected === 'any') {
        const u = new URL(`${API_BASE}/public/availability/any`);
        u.searchParams.set('from', from);
        u.searchParams.set('days', String(days));
        url = u.toString();
      } else {
        const u = new URL(`${API_BASE}/public/availability`);
        u.searchParams.set('doctor_id', String(selected));
        u.searchParams.set('from', from);
        u.searchParams.set('days', String(days));
        url = u.toString();
      }
      const data = await fetch(url).then(r=>r.json());
      setSlots((data.slots ?? []).map((s: any) => ({ ...s, start: s.start, end: s.end })));
    } catch {
      push({ title: 'Failed to load slots', variant: 'error' });
    } finally { setLoading(false); }
  }

  const grouped = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of slots) {
      const key = dayjs(s.start).format('YYYY-MM-DD');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return [...map.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
  }, [slots]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="card p-4 grid md:grid-cols-4 gap-3">
        <div>
          <div className="label">Search doctor</div>
          <input className="input" placeholder="Name or specialty" value={query} onChange={e=>setQuery(e.target.value)} />
        </div>
        <div>
          <div className="label">Doctor</div>
          <select className="select" value={String(selected)} onChange={e=>setSelected(e.target.value==='any'?'any':Number(e.target.value))}>
            <option value="any">Any Available Doctor</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.name}{d.specialty?` (${d.specialty})`:''}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="label">Window</div>
          <select className="select" value={days} onChange={e=>setDays(Number(e.target.value))}>
            <option value={7}>Next 7 days</option>
            <option value={14}>Next 14 days</option>
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={loadAvailability} className="btn btn-outline w-full">Refresh</button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-600">
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-emerald-200 border border-emerald-300"/> Free</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-red-200 border border-red-300"/> Taken</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-slate-200 border"/> Unavailable</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-slate-100 border"/> Past</span>
      </div>

      {/* Calendar Grid */}
      <div className="grid gap-6">
        {loading && (
          <div className="grid md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_,i)=> (
              <div key={i} className="card p-4">
                <div className="h-4 w-32 skeleton mb-4"/>
                <div className="grid grid-cols-6 gap-2">
                  {Array.from({ length: 18 }).map((__,j)=> <div key={j} className="h-8 skeleton"/>) }
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && grouped.length === 0 && (
          <div className="text-sm text-slate-600">No slots found in this window.</div>
        )}

        {!loading && grouped.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {grouped.map(([date, list]) => (
              <div key={date} className="card p-4">
                <div className="mb-3 font-medium">{dayjs(date).format('ddd, MMM D')}</div>
                <div className="grid grid-cols-6 gap-2">
                  {list.map(s => (
                    <button
                      key={`${s.doctor_id}-${s.start}`}
                      title={`Doctor ${s.doctor_id}`}
                      className={clsx('h-9 rounded-lg border text-xs', 'hover:shadow-sm', 'bg-emerald-100 border-emerald-300')}
                      onClick={()=> setOpen(s)}
                    >
                      {dayjs(s.start).format('HH:mm')}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking modal */}
      {open && (
        <BookModal slot={open} onClose={()=>setOpen(null)} onBooked={()=>{ setOpen(null); push({ title:'Booked!', variant:'success' }); loadAvailability(); }} />
      )}
    </div>
  );
}

function BookModal({ slot, onClose, onBooked }: { slot: Slot; onClose: ()=>void; onBooked: ()=>void }) {
  const { push } = useToast();
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [submitting, setSubmitting] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!;

  // Safe getter with timeout; returns null if token can’t be obtained (dev fallback)
  async function getCaptchaTokenSafe(): Promise<string | null> {
    try {
      const ref: any = recaptchaRef.current;
      if (!ref || typeof ref.executeAsync !== 'function') return null;

      const p: Promise<string> = ref.executeAsync();
      const token = await Promise.race([
        p,
        new Promise<string>((_, rej) => setTimeout(() => rej(new Error('captcha-timeout')), 7000)),
      ]) as string;

      ref.reset?.();
      return token;
    } catch (e) {
      return null; // treat as “no token” (dev can bypass)
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    
    const formEl = e.currentTarget;

    try {
      // 1) Try to get token (in prod you should enforce it; in dev we allow null)
      const token = await getCaptchaTokenSafe();

      // 2) Collect form
      const form = new FormData(formEl);
      const payload = {
        any: false,
        doctor_id: Number(slot.doctor_id),
        start_at: slot.start,
        patient_name: String(form.get('name')),
        patient_email: String(form.get('email')),
        patient_phone: String(form.get('phone')),
        reason: String(form.get('reason') || ''),
        captchaToken: token ?? undefined,
      };

      // 3) POST with a 12s timeout to prevent hangs
      const controller = new AbortController();
      const kill = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(`${API_BASE}/public/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }).catch((err) => {
        if (err?.name === 'AbortError') throw new Error('Request timed out');
        throw err;
      });

      clearTimeout(kill);

      // 4) Handle response
      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        if (data?.error === 'captcha_failed') {
          push({ title: 'Captcha failed', description: 'Please try again', variant: 'error' });
        } else if (res.status === 409) {
          push({ title: 'Slot unavailable', description: 'It was just taken. Please pick another.', variant: 'error' });
        } else {
          push({ title: 'Booking failed', description: data?.message || 'Please retry', variant: 'error' });
        }
        return; // keep modal open
      }

      push({ title: 'Booked!', variant: 'success' });
      onBooked(); // refresh list
      window.location.href = `/confirm?id=${data.appointment?.id}`;
    } catch (err: any) {
      push({ title: 'Network error', description: String(err?.message || 'Please retry'), variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center p-4">
      <div className="card w-full max-w-md p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm text-slate-600">{new Date(slot.start).toLocaleDateString()}</div>
            <div className="text-lg font-semibold">
              {new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {' – '}
              {new Date(slot.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <button onClick={onClose} className="btn btn-outline">Close</button>
        </div>

        <form className="mt-4 space-y-3" onSubmit={submit}>
          <div>
            <div className="label">Your name</div>
            <input name="name" className="input" placeholder="Full name" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="label">Email</div>
              <input name="email" type="email" className="input" placeholder="you@example.com" required />
            </div>
            <div>
              <div className="label">Phone</div>
              <input name="phone" className="input" placeholder="+91…" required />
            </div>
          </div>
          <div>
            <div className="label">Reason (optional)</div>
            <textarea name="reason" className="input min-h-[80px]" placeholder="Brief reason" />
          </div>
          <button disabled={submitting} className="btn btn-primary w-full">{submitting ? 'Booking…' : 'Confirm booking'}</button>
        </form>

        {/* Single invisible reCAPTCHA instance, only in modal */}
        <ReCAPTCHA sitekey={siteKey} size="invisible" ref={recaptchaRef} />
      </div>
    </div>
  );
}

