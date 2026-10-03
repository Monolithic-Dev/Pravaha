import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { createBreaker } from "@/lib/ai-breaker";
import { env } from "@/lib/env";
import { log } from "@/lib/log";

// Tried in order. Verified Oct 1: the newest Flash models were returning 503 "high demand", so a single
// model would make Ask fail exactly when traffic peaks (e.g. during judging). Override with GEMINI_MODELS.
export const DEFAULT_MODELS = ["gemini-3.6-flash", "gemini-3.1-flash-lite", "gemini-3.5-flash-lite"];

export class AiUnconfigured extends Error {}

let client: GoogleGenAI | undefined;

function models(): string[] {
  const configured = env().GEMINI_MODELS?.split(",").map((m) => m.trim()).filter(Boolean);
  return configured?.length ? configured : DEFAULT_MODELS;
}

// Zod is the single source of truth: the same schema constrains Gemini's JSON output and validates it.
function jsonSchemaFor(schema: z.ZodType): unknown {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  delete json.$schema; // Gemini rejects the meta-schema key
  return json;
}

// Last resort when every Gemini model is busy or out of quota (both seen on Oct 2: 503 "high demand" and
// free-tier 429s). Groq's OpenAI-compatible API gets the same JSON schema, and the same Zod parse validates it.
export const GROQ_MODELS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"];

type Attempt = { model: string; call: (signal: AbortSignal) => Promise<string> };

function geminiAttempts(apiKey: string, system: string, prompt: string, responseJsonSchema: unknown): Attempt[] {
  client ??= new GoogleGenAI({ apiKey });
  const gemini = client;
  return models().map((model) => ({
    model,
    call: async (signal) => {
      const response = await gemini.models.generateContent({
        model,
        contents: prompt,
        config: { systemInstruction: system, responseMimeType: "application/json", responseJsonSchema, abortSignal: signal },
      });
      return response.text ?? "";
    },
  }));
}

function groqAttempts(apiKey: string, system: string, prompt: string, schema: unknown): Attempt[] {
  return GROQ_MODELS.map((model) => ({
    model,
    call: async (signal) => {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        signal,
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
          // Not strict: strict mode rejects optional fields; Zod validates the result either way.
          response_format: { type: "json_schema", json_schema: { name: "result", schema, strict: false } },
        }),
      });
      if (!res.ok) throw new Error(`groq ${res.status}: ${(await res.text()).slice(0, 120)}`);
      const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      return body.choices?.[0]?.message?.content ?? "";
    },
  }));
}

// Shared by every request this server instance handles (see ai-breaker.ts).
const breaker = createBreaker();

function attemptsFor(system: string, prompt: string, schema: z.ZodType): Attempt[] {
  const { GEMINI_API_KEY, GROQ_API_KEY } = env();
  if (!GEMINI_API_KEY && !GROQ_API_KEY) throw new AiUnconfigured("Neither GEMINI_API_KEY nor GROQ_API_KEY is set");
  const jsonSchema = jsonSchemaFor(schema);
  return [
    ...(GEMINI_API_KEY ? geminiAttempts(GEMINI_API_KEY, system, prompt, jsonSchema) : []),
    ...(GROQ_API_KEY ? groqAttempts(GROQ_API_KEY, system, prompt, jsonSchema) : []),
  ];
}

const MIN_ATTEMPT_MS = 1_500;

// One structured call with a fallback chain (Gemini models, then Groq): the first model that answers with
// schema-valid JSON wins. Either key alone is enough; with neither, callers degrade (AiUnconfigured).
// `budgetMs` caps the WHOLE chain (each attempt gets min(timeoutMs, what's left)), so a slow provider can't
// push a request past the route's maxDuration before the next provider is tried. Models whose circuit is
// open (recent quota/auth/overload failure) are skipped, unless every model is, in which case all are tried.
export async function generateJson<T extends z.ZodType>(
  schema: T,
  {
    system,
    prompt,
    timeoutMs = 12_000,
    budgetMs = 24_000,
    task,
  }: { system: string; prompt: string; timeoutMs?: number; budgetMs?: number; task: string },
): Promise<{ data: z.infer<T>; model: string }> {
  const all = attemptsFor(system, prompt, schema);
  const healthy = all.filter((a) => !breaker.isOpen(a.model));
  const attempts = healthy.length ? healthy : all;
  if (healthy.length < all.length) log("ai.skipped_open_circuits", { task, skipped: all.length - healthy.length });

  const deadline = Date.now() + budgetMs;
  let lastError: unknown;
  for (const { model, call } of attempts) {
    const remaining = deadline - Date.now();
    if (remaining < MIN_ATTEMPT_MS) break;
    const started = Date.now();
    try {
      const data = schema.parse(JSON.parse(await call(AbortSignal.timeout(Math.min(timeoutMs, remaining)))));
      breaker.recordSuccess(model);
      log("ai.done", { task, model, ms: Date.now() - started });
      return { data, model };
    } catch (error) {
      lastError = error;
      const cooldownMs = breaker.recordFailure(model, error);
      log("ai.model_failed", {
        task,
        model,
        ms: Date.now() - started,
        cooldownMs,
        error: error instanceof Error ? error.message.slice(0, 160) : String(error),
      });
    }
  }
  throw lastError ?? new Error(`no model answered within ${budgetMs} ms`);
}

const Probe = z.object({ ok: z.boolean() });

export type ProbeResult = { model: string; ok: boolean; ms: number; error?: string };

// Deep health: one tiny structured call per model (ignoring the breaker), so "is AI working in production?"
// has an answer instead of a guess. Errors are shortened and never include keys.
export async function probeModels(timeoutMs = 8_000): Promise<ProbeResult[]> {
  const attempts = attemptsFor("Reply with {\"ok\": true}.", "ping", Probe);
  return Promise.all(
    attempts.map(async ({ model, call }) => {
      const started = Date.now();
      try {
        Probe.parse(JSON.parse(await call(AbortSignal.timeout(timeoutMs))));
        return { model, ok: true, ms: Date.now() - started };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { model, ok: false, ms: Date.now() - started, error: message.replace(/key=[^&\s]+/gi, "key=…").slice(0, 140) };
      }
    }),
  );
}
