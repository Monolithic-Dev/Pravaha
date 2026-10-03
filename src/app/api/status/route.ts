import { NextResponse } from "next/server";

import { getStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

// The same data as /status: public, aggregate and secret-free. 200 unless the database is unreachable (503),
// so an uptime monitor can watch it. AI probes and Cloudinary usage are cached server-side (src/lib/status.ts).
export async function GET() {
  const status = await getStatus();
  return NextResponse.json(status, { status: status.level === "outage" ? 503 : 200, headers: { "Cache-Control": "no-store" } });
}
