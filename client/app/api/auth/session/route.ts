import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { syncUserToSagah } from "@/lib/userSync";

/**
 * GET /api/auth/session
 * Bootstrap endpoint: syncs the Clerk user to SAGAH and returns unified identity.
 * Called once on dashboard mount; safe to call on every sign-in.
 */
export async function GET() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const identity = await syncUserToSagah(clerkUserId);
  return NextResponse.json(identity);
}
