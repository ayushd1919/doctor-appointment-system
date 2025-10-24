'use client';
import { useSearchParams } from 'next/navigation';

export default function ConfirmPage() {
  const sp = useSearchParams();
  const id = sp.get('id');
  return (
    <div className="card p-6 max-w-lg">
      <h1 className="text-xl font-semibold">Booking confirmed</h1>
      <p className="text-slate-600 mt-2">Your appointment is scheduled. A confirmation will be sent shortly.</p>
      {id && <p className="text-sm mt-3">Ref: <span className="font-mono">{id}</span></p>}
      <a href="/" className="btn btn-outline mt-6">Back to home</a>
    </div>
  );
}
