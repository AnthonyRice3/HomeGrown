import { NextRequest, NextResponse } from "next/server";
import { sagahRegisterUser } from "@/lib/sagah";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, name } = body as { email?: string; name?: string };

  if (!email || !name) {
    return NextResponse.json({ error: "email and name are required" }, { status: 400 });
  }

  // Basic email format guard
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const result = await sagahRegisterUser({
    email: email.trim().toLowerCase(),
    name: name.trim(),
    metadata: { source: "homegrown_fitness" },
  });

  return NextResponse.json({
    userId: result.userId,
    isNew: result.isNew ?? false,
    name: name.trim(),
    email: email.trim().toLowerCase(),
  });
}
