import { NextRequest, NextResponse } from "next/server";
import { sagahGetAvailability } from "@/lib/sagah";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date is required (YYYY-MM-DD)" }, { status: 400 });
  }

  // Past dates are never available
  if (new Date(date + "T00:00:00") < new Date(new Date().toDateString())) {
    return NextResponse.json({
      date, slotDuration: 60, available: [], booked: [], blocked: [], isFullDayBlocked: true,
    });
  }

  const availability = await sagahGetAvailability(date);
  return NextResponse.json(availability);
}
