import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sagahCreateBooking, sagahSendEmail } from "@/lib/sagah";
import { syncUserToSagah } from "@/lib/userSync";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // Auth guard (middleware also enforces this, belt-and-suspenders)
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 5 bookings per 15 min per IP
  const ip = clientIp(req);
  if (!rateLimit(`book:${ip}`, { max: 5, windowMs: 15 * 60 * 1000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { service, date, time, duration, notes } = body as {
    service?: string;
    date?: string;
    time?: string;
    duration?: number;
    notes?: string;
  };

  if (!service || !date || !time) {
    return NextResponse.json({ error: "service, date, and time are required" }, { status: 400 });
  }

  // Validate date is not in the past
  const bookingDate = new Date(date);
  if (isNaN(bookingDate.getTime()) || bookingDate < new Date(new Date().toDateString())) {
    return NextResponse.json({ error: "Date must be today or in the future" }, { status: 400 });
  }

  // Derive name + email from Clerk — never trust client-supplied identity
  const { name, email, sagahUserId } = await syncUserToSagah(clerkUserId);

  const booking = await sagahCreateBooking({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    service: service.trim(),
    date,
    time,
    ...(duration ? { duration } : {}),
    ...(notes ? { notes: notes.trim() } : {}),
    ...(sagahUserId ? { userId: sagahUserId } : {}),
  });

  if (booking.conflict) {
    return NextResponse.json(
      { error: booking.error ?? "That time slot was just taken.", conflict: true },
      { status: 409 }
    );
  }

  // Send confirmation email (best-effort — don't block on failure)
  sagahSendEmail({
    to: email.trim().toLowerCase(),
    subject: "Booking Confirmed — HomeGrown Fitness",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#f59e0b">Your booking is confirmed!</h2>
        <p>Hi <strong>${name.trim()}</strong>,</p>
        <p>Your <strong>${service.trim()}</strong> session has been booked for
           <strong>${date}</strong> at <strong>${time}</strong>.</p>
        <p>If you need to reschedule or have any questions, just reply to this email.</p>
        <p>— HomeGrown Fitness Team</p>
      </div>
    `,
  }).catch(() => {/* non-critical */});

  return NextResponse.json({ success: true, bookingId: booking.bookingId ?? null });
}
