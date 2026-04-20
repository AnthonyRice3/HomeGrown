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

// 2b. Fetch all bookings and filter by email (SAGAH returns all bookings for the account)
export async function sagahGetUserBookings(email: string): Promise<SagahBooking[]> {
  const res = await fetch(
    `${BASE}/api/v1/bookings`,
    { method: "GET", headers: headers() }
  );
  if (!res.ok) return [];
  const body = await res.json();

  // Normalise response shape — SAGAH may return array directly or wrapped
  let all: SagahBooking[] = [];
  if (Array.isArray(body))           all = body as SagahBooking[];
  else if (Array.isArray(body?.data))     all = body.data as SagahBooking[];
  else if (Array.isArray(body?.bookings)) all = body.bookings as SagahBooking[];
  else if (Array.isArray(body?.items))    all = body.items as SagahBooking[];

  // Filter to this user's bookings — check common field name variants
  const normalised = email.trim().toLowerCase();
  return all.filter((b) => {
    const bEmail = (b.email ?? (b as unknown as Record<string, unknown>).clientEmail ?? "") as string;
    return bEmail.trim().toLowerCase() === normalised;
  });
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
export async function sagahCreateCheckout(data: {
  amount: number;
  metadata?: Record<string, string>;
}) {
  const res = await fetch(`${BASE}/api/v1/payments/checkout`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(data),
  });
  return res.json() as Promise<{ clientSecret: string }>;
}

// 5. Check if a date+time slot is available (no existing bookings)
export async function sagahCheckAvailability(date: string, time: string): Promise<boolean> {
  const res = await fetch(
    `${BASE}/api/v1/bookings?date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`,
    { method: "GET", headers: headers() }
  );
  // On API error, be optimistic and allow the booking attempt
  if (!res.ok) return true;
  const body = await res.json();
  const list: unknown[] = Array.isArray(body) ? body : (Array.isArray(body?.data) ? body.data : []);
  return list.length === 0;
}
