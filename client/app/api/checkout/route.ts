import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sagahCreateCheckout } from "@/lib/sagah";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // Auth guard
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 10 checkout sessions per 10 min per IP
  const ip = clientIp(req);
  if (!rateLimit(`checkout:${ip}`, { max: 10, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { amount, metadata } = body as {
    amount?: unknown;
    metadata?: Record<string, string>;
  };

  if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 50) {
    return NextResponse.json({ error: "amount must be an integer ≥ 50 (cents)" }, { status: 400 });
  }

  const result = await sagahCreateCheckout({ amount, metadata });

  if (!result.clientSecret) {
    return NextResponse.json({ error: "Could not create payment intent" }, { status: 502 });
  }

  return NextResponse.json({ clientSecret: result.clientSecret });
}
