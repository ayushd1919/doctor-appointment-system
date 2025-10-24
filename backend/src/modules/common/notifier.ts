export async function sendBookingNotifications({
  email, phone, doctor_id, start_at,
}: { email: string; phone: string; doctor_id: number; start_at: string }) {
  if (process.env.SEND_EMAILS === 'true') {
    // integrate nodemailer/SendGrid
    console.log('[EMAIL] to=%s doctor=%s start=%s', email, doctor_id, start_at);
  } else {
    console.log('[MOCK EMAIL] to=%s doctor=%s start=%s', email, doctor_id, start_at);
  }
  if (process.env.SEND_SMS === 'true') {
    // integrate Twilio
    console.log('[SMS] to=%s doctor=%s start=%s', phone, doctor_id, start_at);
  } else {
    console.log('[MOCK SMS] to=%s doctor=%s start=%s', phone, doctor_id, start_at);
  }
}
