import { NextRequest, NextResponse } from "next/server";
import { sagahGetMessages, sagahSendMessage } from "@/lib/sagah";

// GET /api/messages?email=alice@example.com
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const messages = await sagahGetMessages(email.trim().toLowerCase());
  return NextResponse.json({ messages });
}

// POST /api/messages  { email, name, text, userId? }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { email, name, text, userId } = body as {
    email?: string;
    name?: string;
    text?: string;
    userId?: string;
  };

  if (!email || !name || !text?.trim()) {
    return NextResponse.json({ error: "email, name, and text are required" }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const result = await sagahSendMessage({
    userEmail: email,
    userName: name,
    text: text.trim().slice(0, 2000),
    ...(userId ? { userId } : {}),
  });

  return NextResponse.json(result);
}
