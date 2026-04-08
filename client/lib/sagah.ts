/**
 * lib/sagah.ts — server-only helpers for calling SAGAH's v1 API.
 * All four endpoints: users, bookings, email, payments/checkout.
 * Import only in API routes (never in "use client" components).
 */

const BASE = process.env.SAGAH_BASE_URL ?? "https://sagah.xyz";
const KEY  = process.env.SAGAH_API_KEY ?? "";

function headers(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${KEY}`,
  };
}

// 1. Register / upsert an end-user
export async function sagahRegisterUser(data: {
  email: string;
  name: string;
  plan?: string;
  metadata?: Record<string, unknown>;
}) {
  const res = await fetch(`${BASE}/api/v1/users`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(data),
  });
  return res.json() as Promise<{ userId: string; isNew: boolean }>;
}

// 2. Create a booking / appointment
export async function sagahCreateBooking(data: {
  name: string;
  email: string;
  service: string;
  date: string;       // YYYY-MM-DD
  time: string;
  duration?: number;  // minutes
}) {
  const res = await fetch(`${BASE}/api/v1/bookings`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(data),
  });
  return res.json() as Promise<{ bookingId: string }>;
}

// 3. Send a transactional email via Resend
export async function sagahSendEmail(data: {
  to: string;
  subject: string;
  html: string;
}) {
  const res = await fetch(`${BASE}/api/v1/email`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(data),
  });
  return res.json();
}

// 4. Create a Stripe PaymentIntent — returns { clientSecret }
export async function sagahCreateCheckout(data: { amount: number }) {
  const res = await fetch(`${BASE}/api/v1/payments/checkout`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(data),
  });
  return res.json() as Promise<{ clientSecret: string }>;
}
