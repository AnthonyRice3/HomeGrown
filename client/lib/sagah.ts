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
  clerkUserId?: string;
  avatarUrl?: string;
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
  _id?: string;           // SAGAH primary identifier
  bookingId?: string;     // alias
  service: string;
  date: string;           // YYYY-MM-DD
  time: string;           // as submitted (HH:MM or H:MM AM/PM)
  duration?: number;
  status?: "confirmed" | "pending" | "cancelled";
  notes?: string;
  name?: string;
  email?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 2. Create a booking — returns { conflict: true } on 409
export async function sagahCreateBooking(data: {
  name: string;
  email: string;
  service: string;
  date: string;
  time: string;
  duration?: number;
  notes?: string;
  userId?: string;
}): Promise<{ bookingId?: string; conflict?: boolean; error?: string }> {
  const res = await fetch(`${BASE}/api/v1/bookings`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (res.status === 409) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    return { conflict: true, error: err.error };
  }
  return res.json() as Promise<{ bookingId: string }>;
}

// 2b. Fetch all bookings for a user by email
export async function sagahGetUserBookings(email: string): Promise<SagahBooking[]> {
  const res = await fetch(
    `${BASE}/api/v1/bookings?userEmail=${encodeURIComponent(email.trim().toLowerCase())}`,
    { method: "GET", headers: headers() }
  );
  if (!res.ok) return [];
  const body = await res.json() as { bookings?: SagahBooking[] } | SagahBooking[];
  if (Array.isArray(body)) return body;
  return (body as { bookings?: SagahBooking[] }).bookings ?? [];
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
  // Attribution — required for /admin/actions and /admin/monetization
  userId: string;       // sagahUserId (SAGAH Mongo _id)
  clerkUserId: string;
  userEmail: string;
  userName: string;
  metadata?: Record<string, string>;
}) {
  const res = await fetch(`${BASE}/api/v1/payments/checkout`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      hosted: false,        // custom Stripe Elements UI, not hosted checkout page
      amount: data.amount,
      currency: "usd",
      // Attribution injected server-side — browser never supplies these
      userId:      data.userId,
      clerkUserId: data.clerkUserId,
      userEmail:   data.userEmail,
      userName:    data.userName,
      ...(data.metadata ? { metadata: data.metadata } : {}),
    }),
  });
  return res.json() as Promise<{ clientSecret: string }>;
}

// 5. Get available time slots for a date from SAGAH
export interface SagahAvailability {
  date: string;
  slotDuration: number;
  available: string[];       // HH:MM 24h — open for booking
  booked: string[];          // HH:MM 24h — already confirmed/pending
  blocked: string[];         // HH:MM 24h — manually blocked by the trainer
  isFullDayBlocked: boolean;
}

export async function sagahGetAvailability(date: string): Promise<SagahAvailability> {
  const fallback: SagahAvailability = {
    date, slotDuration: 60, available: [], booked: [], blocked: [], isFullDayBlocked: false,
  };
  const res = await fetch(
    `${BASE}/api/v1/availability?date=${encodeURIComponent(date)}`,
    { method: "GET", headers: headers() }
  );
  if (!res.ok) return fallback;
  return res.json() as Promise<SagahAvailability>;
}

// ─── Messaging ───────────────────────────────────────────────────────────────

export interface SagahMessage {
  _id: string;
  userEmail: string;
  userName: string;
  userId?: string;
  from: "user" | "client";
  text: string;
  read: boolean;
  createdAt: string;
}

// 6. Fetch the full message thread for a user (also marks trainer replies as read)
export async function sagahGetMessages(userEmail: string): Promise<SagahMessage[]> {
  const res = await fetch(
    `${BASE}/api/v1/messages?userEmail=${encodeURIComponent(userEmail.trim().toLowerCase())}`,
    { method: "GET", headers: headers() }
  );
  if (!res.ok) return [];
  const body = await res.json() as { messages?: SagahMessage[] };
  return body.messages ?? [];
}

// 7. Send a message from the end-user to the trainer
export async function sagahSendMessage(data: {
  userEmail: string;
  userName: string;
  text: string;
  userId?: string;
}): Promise<{ messageId: string }> {
  const res = await fetch(`${BASE}/api/v1/messages`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      ...data,
      userEmail: data.userEmail.trim().toLowerCase(),
    }),
  });
  return res.json() as Promise<{ messageId: string }>;
}
