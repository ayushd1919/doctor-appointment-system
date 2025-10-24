// frontend/components/BookingForm.tsx
'use client';

import React, { useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

export default function BookingForm() {
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      // 1) get token from Invisible reCAPTCHA
      const token = await recaptchaRef.current?.executeAsync();
      recaptchaRef.current?.reset();

      const form = new FormData(e.currentTarget);
      const payload = {
        any: form.get('any') === 'on',
        doctor_id: form.get('doctor_id') ? Number(form.get('doctor_id')) : undefined,
        start_at: String(form.get('start_at')),
        patient_name: String(form.get('patient_name')),
        patient_email: String(form.get('patient_email')),
        patient_phone: String(form.get('patient_phone')),
        reason: String(form.get('reason') || ''),
        captchaToken: token,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/public/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data?.ok === false) {
        // backend may return { ok:false, error:'captcha_failed', retryAfter: 3 }
        if (data?.error === 'captcha_failed') {
          setMsg(`Captcha failed. Please try again${data.retryAfter ? ` in ${data.retryAfter}s` : ''}.`);
        } else if (data?.message) {
          setMsg(data.message);
        } else {
          setMsg('Booking failed. Please try again.');
        }
        return;
      }

      setMsg('Booked! Check your email/SMS for confirmation.');
      e.currentTarget.reset();
    } catch (err) {
      setMsg('Network error. Please retry.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {/* your inputs … doctor_id / start_at / patient_* / reason */}
      <input name="patient_name" placeholder="Your name" required className="border p-2 w-full" />
      <input name="patient_email" type="email" placeholder="Your email" required className="border p-2 w-full" />
      <input name="patient_phone" placeholder="Your phone" required className="border p-2 w-full" />
      <input name="start_at" type="datetime-local" required className="border p-2 w-full" />
      <label className="inline-flex items-center gap-2">
        <input name="any" type="checkbox" />
        Any available doctor
      </label>
      <input name="doctor_id" type="number" placeholder="Doctor ID (leave empty if Any)" className="border p-2 w-full" />
      <textarea name="reason" placeholder="Reason (optional)" className="border p-2 w-full" />

      {/* Invisible reCAPTCHA */}
      <ReCAPTCHA
        sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
        size="invisible"
        ref={recaptchaRef}
      />

      <button disabled={loading} className="px-4 py-2 bg-black text-white rounded">
        {loading ? 'Booking…' : 'Book'}
      </button>

      {msg && <p className="text-sm text-red-600">{msg}</p>}
    </form>
  );
}
