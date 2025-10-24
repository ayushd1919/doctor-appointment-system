import axios from 'axios';

export async function verifyRecaptcha(token: string | undefined) {
  const secret = process.env.RECAPTCHA_SECRET;
  if (!secret) {
    // During local dev, you can choose to bypass by returning true. In prod, require secret.
    return true; // change to false to force CAPTCHA in dev
  }
  if (!token) return false;

  const res = await axios.post(
    'https://www.google.com/recaptcha/api/siteverify',
    new URLSearchParams({ secret, response: token }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 5000 }
  );

  const ok = res.data?.success === true;
  const score = typeof res.data?.score === 'number' ? res.data.score : 0.5; // v3 only
  return ok && score >= 0.5;
}
