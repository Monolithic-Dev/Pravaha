import { NextResponse } from "next/server";
import { z } from "zod";

import { AiUnconfigured } from "@/lib/ai";
import { apiError, parseJson } from "@/lib/http";
import { log } from "@/lib/log";
import { buildPath } from "@/lib/paths";
import { clientIp, takeAskToken } from "@/lib/rate-limit";

export const maxDuration = 45;

const Body = z.object({ topic: z.string().trim().min(3).max(200) });

// Learning Paths: a topic in, an ordered micro-course of moments from across the library out, stitched into
// one Cloudinary reel. Costs one AI call (plus question understanding), so it shares Ask's rate limit.
export async function POST(request: Request) {
  const parsed = await parseJson(request, Body);
  if ("response" in parsed) return parsed.response;

  const token = await takeAskToken(clientIp(request));
  if (!token.ok) {
    const response = apiError(429, "rate_limited", "You've asked a lot — try again in a few minutes.");
    response.headers.set("Retry-After", String(token.retryAfterS));
    return response;
  }

  try {
    const path = await buildPath(parsed.data.topic);
    if (!path) return NextResponse.json({ status: "not_found" });
    return NextResponse.json({ status: "built", path });
  } catch (error) {
    log("path.failed", { error: error instanceof Error ? error.message.slice(0, 160) : String(error) });
    if (error instanceof AiUnconfigured) return apiError(503, "ai_unconfigured", "Learning Paths need an AI key.");
    return apiError(502, "ai_failed", "Couldn't build a course right now — try again in a moment.");
  }
}
