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

export interface SagahUser {
  userId: string;
  email: string;
  name: string;
  metadata?: Record<string, unknown>;
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

// 1b. Fetch an existing user by email (returns null if not found)
export async function sagahGetUserByEmail(email: string): Promise<SagahUser | null> {
  const res = await fetch(
    `${BASE}/api/v1/users?email=${encodeURIComponent(email)}`,
    { method: "GET", headers: headers() }
  );
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const body = await res.json() as SagahUser | { data?: SagahUser };
  // Handle both { userId, email, ... } and { data: { ... } } response shapes
  if ("data" in body && body.data) return body.data;
  return body as SagahUser;
}

export interface SagahBooking {
  bookingId: string;
  service: string;
  date: string;   // YYYY-MM-DD
  time: string;
  status?: string;
  name?: string;
  email?: string;
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

// 2b. Fetch all bookings for a user by email
export async function sagahGetUserBookings(email: string): Promise<SagahBooking[]> {
  const res = await fetch(
    `${BASE}/api/v1/bookings?email=${encodeURIComponent(email)}`,
    { method: "GET", headers: headers() }
  );
  if (!res.ok) return [];
  const body = await res.json();
  if (Array.isArray(body)) return body as SagahBooking[];
  if (Array.isArray(body?.data)) return body.data as SagahBooking[];
  return [];
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
export async function sagahCreateCheckout(data: Record<string, any>) {
  const res = await fetch(`${BASE}/api/v1/payments/checkout`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(data),
  });
  return res.json() as Promise<any>;
}

// NOTE: example hosted /payments/checkout usage removed — use `sagahCreateCheckout()` instead
