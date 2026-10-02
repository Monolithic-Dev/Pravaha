import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { isOrganizer } from "@/lib/auth";
import { env } from "@/lib/env";
import { apiError, unauthorized } from "@/lib/http";
import { forDemo, getInsights } from "@/lib/insights";
import { INSIGHT_REPORTS, insightsCsv } from "@/lib/insights-export";
import { log } from "@/lib/log";
import { publicBaseUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

// Each list in full, not the top 10 the Studio shows; still bounded.
const EXPORT_ROWS = 1000;

// India time, like the daily report ("en-CA" formats as YYYY-MM-DD).
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

// One Insights report as a CSV download. Same access as GET /api/insights: organizers get everything; with
// the demo Studio on, visitors get the same filtered aggregates.
export async function GET(request: NextRequest) {
  const parsed = z.enum(INSIGHT_REPORTS).safeParse(request.nextUrl.searchParams.get("report"));
  if (!parsed.success) return apiError(400, "invalid_report", `report must be one of: ${INSIGHT_REPORTS.join(", ")}.`);
  const report = parsed.data;

  const organizer = await isOrganizer();
  if (!organizer && env().STUDIO_DEMO === "off") return unauthorized();
  const insights = await getInsights({ publishedOnly: !organizer, limit: EXPORT_ROWS, sessionsLimit: EXPORT_ROWS });
  log("insights.export", { report, organizer });

  // The byte-order mark makes Excel read the file as UTF-8, so Hindi and other non-Latin questions survive.
  const csv = "\uFEFF" + insightsCsv(report, organizer ? insights : forDemo(insights), publicBaseUrl());
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pravaha-${report}-${today()}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
