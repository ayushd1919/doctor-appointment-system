'use client';
import { useState } from 'react';
import { useToast } from '@../../../components/ui/toaster';

export default function RegisterPage() {
  const { push } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialtyId, setSpecialtyId] = useState(1); // seed: 1=General Physician, 2=Cardiologist, 3=Pediatrician

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ name, email, password, specialty_id: specialtyId }),
      });
      if (!res.ok) throw new Error(await res.text());
      push({ title:'Registered!', variant:'success' });
      window.location.href = '/doctor/login';
    } catch (err:any) {
      push({ title:'Registration failed', description: err?.message || 'Try a different email', variant:'error' });
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-sm card p-5">
      <h1 className="text-xl font-semibold mb-4">Doctor Registration</h1>
      <form className="space-y-3" onSubmit={submit}>
        <input className="input" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} required />
        <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <div>
          <div className="label">Specialty</div>
          <select className="select" value={specialtyId} onChange={e=>setSpecialtyId(Number(e.target.value))}>
            <option value={1}>General Physician</option>
            <option value={2}>Cardiologist</option>
            <option value={3}>Pediatrician</option>
          </select>
        </div>
        <button className="btn btn-primary w-full" disabled={loading}>{loading?'Creating…':'Create account'}</button>
      </form>
    </div>
  );
}
