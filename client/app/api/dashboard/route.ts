import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sagahGetUserBookings } from "@/lib/sagah";
import { syncUserToSagah } from "@/lib/userSync";

export async function GET() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email } = await syncUserToSagah(clerkUserId);
  const bookings = await sagahGetUserBookings(email);
  return NextResponse.json({ bookings });
}
