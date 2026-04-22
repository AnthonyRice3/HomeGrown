import { NextRequest, NextResponse } from "next/server";
import { sagahSendEmail } from "@/lib/sagah";
import { rateLimit, clientIp } from "@/lib/rateLimit";

// Trainer's contact email — override via env if needed
const TRAINER_EMAIL = process.env.TRAINER_EMAIL ?? "info@homegrown.fit";

export async function POST(req: NextRequest) {
  // Rate limit: 3 contact form submissions per 10 min per IP
  const ip = clientIp(req);
  if (!rateLimit(`contact:${ip}`, { max: 3, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email, message } = body as {
    name?: string;
    email?: string;
    message?: string;
  };

  if (!name || !email || !message) {
    return NextResponse.json({ error: "name, email, and message are required" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const trimmedMessage = message.trim().slice(0, 2000); // cap length

  await Promise.allSettled([
    // Notify trainer
    sagahSendEmail({
      to: TRAINER_EMAIL,
      subject: `New inquiry from ${name.trim()}`,
      html: `
        <div style="font-family:sans-serif">
          <p><strong>From:</strong> ${name.trim()} &lt;${email.trim().toLowerCase()}&gt;</p>
          <p><strong>Message:</strong></p>
          <p style="white-space:pre-wrap">${trimmedMessage}</p>
        </div>
      `,
    }),
    // Confirm to sender
    sagahSendEmail({
      to: email.trim().toLowerCase(),
      subject: "We received your message — HomeGrown Fitness",
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <h2 style="color:#f59e0b">Message received!</h2>
          <p>Hi <strong>${name.trim()}</strong>,</p>
          <p>Thanks for reaching out. We'll get back to you within 24 hours.</p>
          <p>— HomeGrown Fitness Team</p>
        </div>
      `,
    }),
  ]);

  return NextResponse.json({ success: true });
}
