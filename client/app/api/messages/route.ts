import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sagahGetMessages, sagahSendMessage } from "@/lib/sagah";
import { syncUserToSagah } from "@/lib/userSync";
import { rateLimit, clientIp } from "@/lib/rateLimit";

// GET /api/messages  — identity from Clerk session
export async function GET() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email } = await syncUserToSagah(clerkUserId);
  const messages = await sagahGetMessages(email);
  return NextResponse.json({ messages });
}

// POST /api/messages  { text }  — identity from Clerk session
export async function POST(req: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 20 messages per 5 min per IP
  const ip = clientIp(req);
  if (!rateLimit(`msg:${ip}`, { max: 20, windowMs: 5 * 60 * 1000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { text } = body as { text?: string };

  if (!text?.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const { email, name, sagahUserId } = await syncUserToSagah(clerkUserId);

  const result = await sagahSendMessage({
    userEmail: email,
    userName: name,
    text: text.trim().slice(0, 2000),
    ...(sagahUserId ? { userId: sagahUserId } : {}),
  });

  return NextResponse.json(result);
}
