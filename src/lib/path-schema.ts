import { z } from "zod";

// What the model returns for a Learning Path: an ordered micro-course where every step is ONE retrieved moment.
export const RawPath = z.object({
  title: z.string().describe("A short course title, under 8 words."),
  steps: z
    .array(
      z.object({
        title: z.string().describe("What this step teaches, under 7 words."),
        why: z.string().describe("One sentence: what this moment adds to the previous steps."),
        segment_id: z.number().int().describe("The excerpt id this step plays."),
      }),
    )
    .describe("3–5 steps ordered from fundamentals to advanced, preferring different sessions."),
});
export type RawPath = z.infer<typeof RawPath>;

export const MIN_STEPS = 3;
export const MAX_STEPS = 5; // an Answer Reel holds 5 clips (media.ts REEL_MAX_CLIPS)

export type ValidatedPath<T> = { title: string; steps: (T & { n: number; stepTitle: string; why: string })[] } | null;

// Same discipline as Ask's citations: a step must play a moment we retrieved; repeats and empty steps are
// dropped; too few real steps means there is no course to show (the caller says so instead of padding).
export function validatePath<T extends { segmentId: number }>(raw: RawPath, candidates: T[]): ValidatedPath<T> {
  const byId = new Map(candidates.map((c) => [c.segmentId, c]));
  const used = new Set<number>();
  const steps: (T & { n: number; stepTitle: string; why: string })[] = [];
  for (const step of raw.steps) {
    const moment = byId.get(step.segment_id);
    if (!moment || used.has(step.segment_id) || !step.title.trim()) continue;
    used.add(step.segment_id);
    steps.push({ ...moment, n: steps.length + 1, stepTitle: step.title.trim().slice(0, 60), why: step.why.trim().slice(0, 220) });
    if (steps.length === MAX_STEPS) break;
  }
  if (steps.length < MIN_STEPS) return null;
  return { title: raw.title.trim().slice(0, 80) || "Learning path", steps };
}

// Reel label for a step: "2 · Momentum smooths the path".
export const stepLabel = (n: number, title: string) => `${n} · ${title}`;
