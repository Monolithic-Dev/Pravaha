import type { SnippetPart } from "@/lib/highlight";
import { MOMENT_MAX_S } from "@/lib/media";
import type { TimedWord } from "@/lib/segments";

// An answer often cites several back-to-back moments of one session ([1] [2] [3] in a row of the same
// explanation). Shown as separate cards they look like duplicates, so neighbours are merged into one card
// whose clip spans them. Pure, so it is unit-tested.

export type CitationLike = {
  n: number;
  segmentId: number;
  lectureId: string;
  publicId: string;
  title: string;
  speaker: string | null;
  startS: number;
  endS: number;
  text: string;
  chapterTitle: string | null;
  durationS: number | null;
  words: TimedWord[];
  snippet: SnippetPart[];
};

export type CitationGroup<C extends CitationLike = CitationLike> = C & { ns: number[] };

// Moments closer than this are one stretch of speech; a merged clip never exceeds the Moment cap.
export const ADJACENT_GAP_S = 3;

export function groupCitations<C extends CitationLike>(citations: C[]): CitationGroup<C>[] {
  const groups: CitationGroup<C>[] = [];
  const byTime = [...citations].sort((a, b) => a.lectureId.localeCompare(b.lectureId) || a.startS - b.startS);
  for (const c of byTime) {
    const last = groups.at(-1);
    const joins =
      last &&
      last.lectureId === c.lectureId &&
      c.startS - last.endS <= ADJACENT_GAP_S &&
      Math.max(last.endS, c.endS) - last.startS <= MOMENT_MAX_S;
    if (!joins) {
      groups.push({ ...c, ns: [c.n] });
      continue;
    }
    last.ns.push(c.n);
    last.endS = Math.max(last.endS, c.endS);
    last.text = `${last.text} ${c.text}`;
    last.words = [...last.words, ...c.words];
    last.snippet = [...last.snippet, { text: " … ", hit: false }, ...c.snippet];
  }
  // Cards follow the answer: ordered by the first citation number each one covers.
  for (const g of groups) g.ns.sort((a, b) => a - b);
  return groups.sort((a, b) => a.ns[0]! - b.ns[0]!);
}

// "1", "1–3" for a run, "1, 3" otherwise.
export function citationLabel(ns: number[]): string {
  const run = ns.every((n, i) => i === 0 || n === ns[i - 1]! + 1);
  return run && ns.length > 2 ? `${ns[0]}–${ns.at(-1)}` : ns.join(", ");
}
