import { NextRequest, NextResponse } from "next/server";
import { sagahGetUserBookings } from "@/lib/sagah";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const bookings = await sagahGetUserBookings(email.trim().toLowerCase());
  return NextResponse.json({ bookings });
}
