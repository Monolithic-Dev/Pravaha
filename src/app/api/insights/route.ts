import { NextResponse } from "next/server";

import { isOrganizer } from "@/lib/auth";
import { env } from "@/lib/env";
import { unauthorized } from "@/lib/http";
import { forDemo, getInsights } from "@/lib/insights";

export const dynamic = "force-dynamic";

// Organizers see everything. With the demo Studio on (STUDIO_DEMO, default "on"), visitors see the same
// anonymous aggregates, minus questions that look like links or contact details.
export async function GET() {
  if (await isOrganizer()) return NextResponse.json(await getInsights());
  if (env().STUDIO_DEMO === "off") return unauthorized();
  return NextResponse.json(forDemo(await getInsights()));
}
