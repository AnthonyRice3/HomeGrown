import { NextRequest, NextResponse } from "next/server";
import { sagahCheckAvailability } from "@/lib/sagah";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const time = req.nextUrl.searchParams.get("time");

  if (!date || !time) {
    return NextResponse.json({ error: "date and time are required" }, { status: 400 });
  }

  // Validate date format: YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  // Reject past dates
  if (new Date(date) < new Date(new Date().toDateString())) {
    return NextResponse.json({ available: false });
  }

  const available = await sagahCheckAvailability(date, time);
  return NextResponse.json({ available });
}
