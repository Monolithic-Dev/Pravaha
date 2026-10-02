import { NextResponse } from "next/server";

import { query } from "@/lib/db";
import { env } from "@/lib/env";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";

const DB_TIMEOUT_MS = 3000;

// Health for uptime monitors and the team: 200 when the app can serve, 503 when the database is unreachable.
// Reports only booleans, timings and the deployed commit; never a secret or a config value.
export async function GET() {
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
    },
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
  };
  if (!database) log("health.degraded", { dbMs });
  return NextResponse.json(body, { status: database ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
