import { NextRequest, NextResponse } from "next/server";
import { sagahCreateCheckout } from "@/lib/sagah";

export async function POST(req: NextRequest) {
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
