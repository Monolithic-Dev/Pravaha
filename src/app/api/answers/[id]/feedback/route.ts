import { NextResponse } from "next/server";
import { z } from "zod";

import { recordFeedback } from "@/lib/answers";
import { apiError, parseJson } from "@/lib/http";

const Body = z.object({ helpful: z.boolean() });

// Anonymous 👍/👎 on an answer, for organizer Insights ("answer quality"). No identity, no IP stored;
// the client remembers a vote per answer so one learner doesn't count twice by accident.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{10}$/.test(id)) return apiError(404, "not_found", "Unknown answer.");
  const parsed = await parseJson(request, Body);
  if ("response" in parsed) return parsed.response;
  const ok = await recordFeedback(id, parsed.data.helpful);
  return ok ? new NextResponse(null, { status: 204 }) : apiError(404, "not_found", "Unknown answer.");
}
