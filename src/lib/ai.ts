import "server-only";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

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

// One structured call with a fallback chain (Gemini models, then Groq): the first model that answers with
// schema-valid JSON wins. Either key alone is enough; with neither, callers degrade (AiUnconfigured).
export async function generateJson<T extends z.ZodType>(
  schema: T,
  { system, prompt, timeoutMs = 12_000, task }: { system: string; prompt: string; timeoutMs?: number; task: string },
): Promise<{ data: z.infer<T>; model: string }> {
  const { GEMINI_API_KEY, GROQ_API_KEY } = env();
  if (!GEMINI_API_KEY && !GROQ_API_KEY) throw new AiUnconfigured("Neither GEMINI_API_KEY nor GROQ_API_KEY is set");
  const jsonSchema = jsonSchemaFor(schema);
  const attempts = [
    ...(GEMINI_API_KEY ? geminiAttempts(GEMINI_API_KEY, system, prompt, jsonSchema) : []),
    ...(GROQ_API_KEY ? groqAttempts(GROQ_API_KEY, system, prompt, jsonSchema) : []),
  ];

  let lastError: unknown;
  for (const { model, call } of attempts) {
    const started = Date.now();
    try {
      const data = schema.parse(JSON.parse(await call(AbortSignal.timeout(timeoutMs))));
      log("ai.done", { task, model, ms: Date.now() - started });
      return { data, model };
    } catch (error) {
      lastError = error;
      log("ai.model_failed", {
        task,
        model,
        ms: Date.now() - started,
        error: error instanceof Error ? error.message.slice(0, 160) : String(error),
      });
    }
  }
  throw lastError ?? new Error("no model answered");
}
