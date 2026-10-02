import { after, NextResponse } from "next/server";
import { z } from "zod";

import { saveAnswer } from "@/lib/answers";
import { cleanFollowUps, validateAnswer } from "@/lib/citations";
import { AiUnconfigured } from "@/lib/ai";
import { askGrounded } from "@/lib/answer";
import { apiError, parseJson } from "@/lib/http";
import { logAsk } from "@/lib/insights";
import { getLecture } from "@/lib/lectures";
import { log } from "@/lib/log";
import { momentUrl, reelUrl } from "@/lib/media";
import { clientIp, takeAskToken } from "@/lib/rate-limit";
import { retrieveForQuestion, type Hit } from "@/lib/search";
import { searchableQuestion } from "@/lib/translate";

export const maxDuration = 30;

const Body = z.object({
  question: z.string().trim().min(3).max(300),
  lectureId: z.uuid().optional(),
});

const FALLBACK_CLIPS = 4;
const NDJSON = "application/x-ndjson";

const withMoment = (h: Hit & { n: number }) => ({
  ...h,
  momentUrl: momentUrl(h.publicId, h.startS, h.endS, { durationS: h.durationS, words: h.words }),
});

// Answer Reel: every cited moment, across sessions, stitched into one video in citation order.
const reelFor = (hits: Hit[]) =>
  reelUrl(hits.map((h) => ({ publicId: h.publicId, startS: h.startS, endS: h.endS, label: h.speaker ?? h.title })));

// Progress the client can show while it waits: real retrieval facts, then the model step.
type Progress =
  | { type: "retrieved"; moments: number; sessions: string[] }
  | { type: "writing" };

// One Ask, start to finish. `progress` lets the streaming response report each step as it happens;
// the JSON response ignores it. Same retrieval, validation and fallback either way.
async function ask(question: string, lectureId: string | null, progress: (p: Progress) => void) {
  const started = Date.now();
  // A trial session (/try) is private and short-lived: its questions stay out of Insights and its answers
  // aren't stored as shareable links (they would outlive the video).
  const trial = lectureId ? Boolean((await getLecture(lectureId))?.trialExpiresAt) : false;
  const logged = (...args: Parameters<typeof logAsk>) => (trial ? Promise.resolve() : logAsk(...args));
  // A question in Hindi (or any non-Latin script) is searched in English; the answer stays in its language.
  const hits = await retrieveForQuestion(await searchableQuestion(question), { lectureId });
  progress({ type: "retrieved", moments: hits.length, sessions: [...new Set(hits.map((h) => h.title))].slice(0, 5) });

  if (hits.length === 0) {
    // Nothing in the library matches — no reason to call the model.
    log("ask.done", { status: "not_found", retrieved: 0, cited: 0, dropped: 0, ms: Date.now() - started });
    after(() => logged(question, "not_found", []));
    return { status: "not_found" as const, answer: null, citations: [], reel: null, followUps: [], answerId: null };
  }

  try {
    progress({ type: "writing" });
    const raw = await askGrounded(question, hits);
    const result = validateAnswer(raw, hits);
    log("ask.done", {
      status: result.status,
      retrieved: hits.length,
      cited: result.citations.length,
      dropped: result.dropped,
      ms: Date.now() - started,
    });
    after(() => logged(question, result.status, result.citations.map((c) => c.lectureId)));
    const body = {
      status: result.status,
      answer: result.answer,
      citations: result.citations.map(withMoment),
      reel: reelFor(result.citations),
      followUps: result.status === "answered" ? cleanFollowUps(raw.follow_ups, question) : [],
    };
    // Stored as shown, so /a/[answerId] can be shared without re-running the model.
    const answerId = result.status === "answered" && !trial ? await saveAnswer(question, body) : null;
    return { ...body, answerId };
  } catch (error) {
    // NFR4: the model failing never means an error page — show the most relevant moments instead.
    const kind = error instanceof AiUnconfigured ? "unconfigured" : error instanceof Error ? error.name : "unknown";
    log("ai.error", { kind, message: error instanceof Error ? error.message.slice(0, 200) : undefined, ms: Date.now() - started });
    const citations = hits.slice(0, FALLBACK_CLIPS).map((h, i) => withMoment({ ...h, n: i + 1 }));
    after(() => logged(question, "fallback", citations.map((c) => c.lectureId)));
    return { status: "fallback" as const, answer: null, citations, reel: reelFor(citations), followUps: [], answerId: null };
  }
}

export async function POST(request: Request) {
  const parsed = await parseJson(request, Body);
  if ("response" in parsed) return parsed.response;
  const { question, lectureId } = parsed.data;

  // Rate-limit before any work that costs money (SECURITY.md).
  const token = await takeAskToken(clientIp(request));
  if (!token.ok) {
    log("ask.rate_limited", { scope: token.scope });
    const response = apiError(429, "rate_limited", "You've asked a lot — try again in a few minutes.");
    response.headers.set("Retry-After", String(token.retryAfterS));
    return response;
  }

  // Default: one JSON body (API clients, eval script). With Accept: application/x-ndjson the same Ask is
  // streamed as newline-delimited JSON events, ending with { type: "result", ...body }.
  if (!request.headers.get("accept")?.includes(NDJSON)) {
    return NextResponse.json(await ask(question, lectureId ?? null, () => {}));
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: object) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        send({ type: "result", ...(await ask(question, lectureId ?? null, send)) });
      } catch (error) {
        // Retrieval or the database failed (ask() already absorbs AI failures).
        log("ask.stream_failed", { error: error instanceof Error ? error.message.slice(0, 200) : String(error) });
        send({ type: "error" });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": `${NDJSON}; charset=utf-8`, "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
