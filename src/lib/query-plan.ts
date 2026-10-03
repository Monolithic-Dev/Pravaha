// Pure retrieval planning for Ask (unit-tested). Keyword search matches what lecturers SAY, but learners ask
// in their own words, or in another language: "What is the bias-variance trade-off?" finds nothing in a
// bias-variance lecture that only ever says "polynomial degree", "overfits" and "noise". When a question is in
// another script, or keyword retrieval comes back thin, Ask rewrites it into the library's vocabulary first.

import { needsTranslation } from "@/lib/language";

export const THIN_RETRIEVAL = 3;
export const MAX_SOURCES = 12;

export function needsUnderstanding(question: string, keywordHits: number): boolean {
  return needsTranslation(question) || keywordHits < THIN_RETRIEVAL;
}

// Keyword hits first (they matched the learner's own words), then the expansion's extra moments; no duplicates.
export function mergeHits<T extends { segmentId: number }>(primary: T[], extra: T[], limit = MAX_SOURCES): T[] {
  const seen = new Set<number>();
  const merged: T[] = [];
  for (const hit of [...primary, ...extra]) {
    if (seen.has(hit.segmentId)) continue;
    seen.add(hit.segmentId);
    merged.push(hit);
    if (merged.length === limit) break;
  }
  return merged;
}

// One search string from the model's rewrite. Hyphens and punctuation become spaces ("trade-off" → "trade off") so Postgres
// treats them as separate words instead of an exact hyphenated phrase; terms are de-duplicated and capped.
export function searchStringFor(english: string, terms: string[]): string {
  const words = [english, ...terms]
    .join(" ")
    .replace(/[-–—/?!.,;:"()]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
  return [...new Set(words.map((w) => w.toLowerCase()))].slice(0, 40).join(" ");
}
