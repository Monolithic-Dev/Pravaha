import { NextResponse } from "next/server";

import { AiUnconfigured, probeModels, type ProbeResult } from "@/lib/ai";
import { query } from "@/lib/db";
import { env } from "@/lib/env";
import { log } from "@/lib/log";
import { clientIp, takeAskToken } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const DB_TIMEOUT_MS = 3000;

// `?deep=1` also makes one tiny call to every AI model and reports which ones actually answer — "configured"
// doesn't mean "working" (an exhausted quota looks configured). It spends tokens, so it shares Ask's rate limit.
async function deepAi(request: Request): Promise<{ models: ProbeResult[] } | { error: string }> {
  const token = await takeAskToken(clientIp(request));
  if (!token.ok) return { error: "rate_limited" };
  try {
    return { models: await probeModels() };
  } catch (error) {
    return { error: error instanceof AiUnconfigured ? "unconfigured" : "probe_failed" };
  }
}

// Health for uptime monitors and the team: 200 when the app can serve, 503 when the database is unreachable.
// Reports only booleans, timings and the deployed commit; never a secret or a config value.
export async function GET(request: Request) {
  const deep = new URL(request.url).searchParams.get("deep") === "1";
  const started = Date.now();
  const database = await Promise.race([
    query("SELECT 1").then(() => true),
    new Promise<false>((resolve) => setTimeout(() => resolve(false), DB_TIMEOUT_MS)),
  ]).catch(() => false);
  const dbMs = Date.now() - started;

  const { GEMINI_API_KEY, GROQ_API_KEY, TRIALS_PER_DAY, STUDIO_DEMO } = env();
  const body = {
    status: database ? "ok" : "degraded",
    checks: {
      database: { ok: database, ms: dbMs },
      // Without an AI key Ask still answers with the most relevant clips (NFR4), so this isn't a failure.
      ai: {
        configured: Boolean(GEMINI_API_KEY || GROQ_API_KEY),
        providers: [GEMINI_API_KEY && "gemini", GROQ_API_KEY && "groq"].filter(Boolean),
      },
      trials: { enabled: TRIALS_PER_DAY > 0 },
      demoStudio: { enabled: STUDIO_DEMO === "on" },
      ...(deep ? { aiLive: await deepAi(request) } : {}),
    },
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
  };
  if (!database) log("health.degraded", { dbMs });
  return NextResponse.json(body, { status: database ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
