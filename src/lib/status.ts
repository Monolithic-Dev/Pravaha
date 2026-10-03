import "server-only";

import { probeModels } from "@/lib/ai";
import { cld } from "@/lib/cloudinary";
import { query } from "@/lib/db";
import { env } from "@/lib/env";
import { log } from "@/lib/log";
import { creditLevel, failureKind, overallStatus, type CreditLevel, type FailureKind, type Overall } from "@/lib/status-level";

// The public status page's data: database, every AI model, Cloudinary credits and what the library holds.
// Expensive checks are cached per server instance so a busy page can't spend tokens or API calls:
// AI probes (five tiny calls) every 5 minutes, Cloudinary's usage report every 10.

const AI_TTL_MS = 5 * 60_000;
const USAGE_TTL_MS = 10 * 60_000;
const DB_TIMEOUT_MS = 3000;

function cached<T>(ttlMs: number, load: () => Promise<T>): () => Promise<T> {
  let value: { at: number; data: T } | null = null;
  let inflight: Promise<T> | null = null;
  return async () => {
    if (value && Date.now() - value.at < ttlMs) return value.data;
    inflight ??= load()
      .then((data) => {
        value = { at: Date.now(), data };
        return data;
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  };
}

export type ModelStatus = { model: string; ok: boolean; ms: number; kind?: FailureKind };
export type CloudinaryUsage = {
  used: number;
  limit: number;
  pct: number;
  level: CreditLevel;
  transformations: number;
  storage: number;
  bandwidth: number;
  reportedOn: string | null;
};

const aiModels = cached(AI_TTL_MS, async (): Promise<{ models: ModelStatus[]; at: string } | null> => {
  const { GEMINI_API_KEY, GROQ_API_KEY } = env();
  if (!GEMINI_API_KEY && !GROQ_API_KEY) return null;
  try {
    const probes = await probeModels();
    return { at: new Date().toISOString(), models: probes.map((p) => ({ model: p.model, ok: p.ok, ms: p.ms, ...(p.ok ? {} : { kind: failureKind(p.error) }) })) };
  } catch (error) {
    log("status.ai_probe_failed", { error: error instanceof Error ? error.message.slice(0, 120) : String(error) });
    return null;
  }
});

const cloudinaryUsage = cached(USAGE_TTL_MS, async (): Promise<CloudinaryUsage | null> => {
  try {
    const u = await cld().api.usage();
    const used = Number(u.credits?.usage ?? 0);
    const limit = Number(u.credits?.limit ?? 0);
    if (!limit) return null;
    const pct = Math.round((used / limit) * 1000) / 10;
    return {
      used,
      limit,
      pct,
      level: creditLevel(pct),
      transformations: Number(u.transformations?.credits_usage ?? 0),
      storage: Number(u.storage?.credits_usage ?? 0),
      bandwidth: Number(u.bandwidth?.credits_usage ?? 0),
      reportedOn: typeof u.last_updated === "string" ? u.last_updated : null,
    };
  } catch (error) {
    log("status.usage_failed", { error: error instanceof Error ? error.message.slice(0, 120) : String(error) });
    return null;
  }
});

async function database(): Promise<{ ok: boolean; ms: number }> {
  const started = Date.now();
  const ok = await Promise.race([query("SELECT 1").then(() => true), new Promise<false>((r) => setTimeout(() => r(false), DB_TIMEOUT_MS))]).catch(() => false);
  return { ok, ms: Date.now() - started };
}

async function libraryCounts() {
  const [row] = await query<{ sessions: string; moments: string; packs: string; asked: string }>(
    `SELECT (SELECT count(*) FROM lectures WHERE status = 'ready' AND visibility = 'public' AND trial_expires_at IS NULL) AS sessions,
            (SELECT count(*) FROM segments s JOIN lectures l ON l.id = s.lecture_id
              WHERE l.status = 'ready' AND l.visibility = 'public' AND l.trial_expires_at IS NULL) AS moments,
            (SELECT count(*) FROM study_packs) AS packs,
            (SELECT count(*) FROM ask_log) AS asked`,
  );
  return { sessions: Number(row?.sessions ?? 0), moments: Number(row?.moments ?? 0), studyPacks: Number(row?.packs ?? 0), questionsAsked: Number(row?.asked ?? 0) };
}

type Library = { sessions: number; moments: number; studyPacks: number; questionsAsked: number };

export type AiStatus = { providers: string[]; models: ModelStatus[] | null; probedAt: string | null };

export const aiStatus = async (): Promise<AiStatus> => {
  const { GEMINI_API_KEY, GROQ_API_KEY } = env();
  const ai = await aiModels();
  return {
    providers: [GEMINI_API_KEY && "gemini", GROQ_API_KEY && "groq"].filter((p): p is string => Boolean(p)),
    models: ai?.models ?? null,
    probedAt: ai?.at ?? null,
  };
};

// The quick checks (milliseconds), so the page can show them while the slower AI probe is still running.
export type FastStatus = { version: string; checkedAt: string; database: { ok: boolean; ms: number }; cloudinary: CloudinaryUsage | null; library: Library | null };

export async function fastStatus(): Promise<FastStatus> {
  const [db, cloudinary] = await Promise.all([database(), cloudinaryUsage()]);
  const library = db.ok ? await libraryCounts().catch(() => null) : null;
  return { version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local", checkedAt: new Date().toISOString(), database: db, cloudinary, library };
}

export function verdict(fast: FastStatus, ai: AiStatus): { level: Overall; reasons: string[] } {
  return overallStatus({
    database: fast.database.ok,
    aiConfigured: ai.providers.length > 0,
    aiOk: ai.models ? ai.models.filter((m) => m.ok).length : null,
    aiTotal: ai.models?.length ?? 0,
    credits: fast.cloudinary?.level ?? null,
  });
}

export type Status = FastStatus & { ai: AiStatus; level: Overall; reasons: string[] };

export async function getStatus(): Promise<Status> {
  const [fast, ai] = await Promise.all([fastStatus(), aiStatus()]);
  return { ...verdict(fast, ai), ...fast, ai };
}
