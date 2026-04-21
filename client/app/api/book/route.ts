import { NextRequest, NextResponse } from "next/server";
import { sagahCreateBooking, sagahSendEmail } from "@/lib/sagah";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email, service, date, time, duration, notes, userId } = body as {
    name?: string;
    email?: string;
    service?: string;
    date?: string;
    time?: string;
    duration?: number;
    notes?: string;
    userId?: string;
  };

  if (!name || !email || !service || !date || !time) {
    return NextResponse.json({ error: "name, email, service, date, and time are required" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  // Validate date is not in the past
  const bookingDate = new Date(date);
  if (isNaN(bookingDate.getTime()) || bookingDate < new Date(new Date().toDateString())) {
    return NextResponse.json({ error: "Date must be today or in the future" }, { status: 400 });
  }

  const booking = await sagahCreateBooking({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    service: service.trim(),
    date,
    time,
    ...(duration ? { duration } : {}),
    ...(notes ? { notes: notes.trim() } : {}),
    ...(userId ? { userId } : {}),
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
