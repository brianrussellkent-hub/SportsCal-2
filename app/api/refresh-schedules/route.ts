import { NextResponse } from "next/server";
import { refreshSchedulesFromSources } from "@/lib/live-sources";

export async function GET() {
  const payload = await refreshSchedulesFromSources();
  return NextResponse.json(payload);
}
