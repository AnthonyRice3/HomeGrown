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

// 2b-internal. Fetch every booking from SAGAH and normalise the response shape.
// SAGAH ignores all query params on GET /api/v1/bookings — it always returns everything.
async function sagahFetchAllBookings(): Promise<Record<string, unknown>[]> {
  const res = await fetch(`${BASE}/api/v1/bookings`, {
    method: "GET",
    headers: headers(),
  });
  if (!res.ok) return [];
  const body = await res.json();

  // Log raw shape once so Vercel logs reveal the actual field names
  if (process.env.NODE_ENV !== "production") {
    console.log("[sagah bookings raw]", JSON.stringify(body).slice(0, 500));
  } else {
    const sample = Array.isArray(body) ? body[0] : (body?.data?.[0] ?? body?.bookings?.[0] ?? body?.items?.[0] ?? null);
    console.log("[sagah bookings] shape sample:", JSON.stringify(sample));
  }

  if (Array.isArray(body))                return body as Record<string, unknown>[];
  if (Array.isArray(body?.data))          return body.data as Record<string, unknown>[];
  if (Array.isArray(body?.bookings))      return body.bookings as Record<string, unknown>[];
  if (Array.isArray(body?.items))         return body.items as Record<string, unknown>[];
  return [];
}

// Helper: pick an email field from a raw booking object using common SAGAH field names
function extractEmail(b: Record<string, unknown>): string {
  return (
    (b.email as string) ??
    (b.clientEmail as string) ??
    (b.client_email as string) ??
    (b.userEmail as string) ??
    (b.user_email as string) ??
    (b.bookedBy as string) ??
    ""
  ).trim().toLowerCase();
}

// 2b. Fetch all bookings for a specific user (filtered client-side by email)
export async function sagahGetUserBookings(email: string): Promise<SagahBooking[]> {
  const all = await sagahFetchAllBookings();
  const normalised = email.trim().toLowerCase();
  return all
    .filter((b) => extractEmail(b) === normalised)
    .map((b) => b as unknown as SagahBooking);
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

// 5. Check if a date+time slot is available by fetching all bookings and filtering client-side
export async function sagahCheckAvailability(date: string, time: string): Promise<boolean> {
  const all = await sagahFetchAllBookings();
  const d = date.trim();
  const t = time.trim().toLowerCase();
  const conflict = all.some((b) => {
    const bDate = ((b.date as string) ?? "").trim();
    const bTime = ((b.time as string) ?? "").trim().toLowerCase();
    return bDate === d && bTime === t;
  });
  return !conflict;
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
