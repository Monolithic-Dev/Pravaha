import type { ReelClip } from "@/lib/media";

// Weak spots: the quiz questions a learner got wrong, remembered on this device (src/lib/saved.ts) until they
// get them right. Pure, so the rules are unit-tested.

export type WeakSpot = {
  key: string;
  lectureId: string;
  publicId: string;
  title: string;
  question: string;
  answer: string;
  explanation: string;
  segmentId: number;
  startS: number;
  endS: number;
  at: number;
};

export const WEAK_SPOT_LIMIT = 50;

export const weakKey = (lectureId: string, question: string) => `${lectureId}|${question.trim().toLowerCase()}`;

// A wrong answer moves the question to the front (newest first, no duplicates); a right answer clears it.
export function applyQuizResult(list: WeakSpot[], spot: WeakSpot, correct: boolean): WeakSpot[] {
  const rest = list.filter((s) => s.key !== spot.key);
  return correct ? rest : [spot, ...rest].slice(0, WEAK_SPOT_LIMIT);
}

// The explanation clip for each weak spot, newest first, labelled with the question so the reel says what you
// are about to relearn. reelUrl() enforces the clip and length caps.
export function weakSpotClips(spots: WeakSpot[]): ReelClip[] {
  return spots.map((s, i) => ({
    publicId: s.publicId,
    startS: s.startS,
    endS: s.endS,
    label: `${i + 1} · ${s.question.length > 44 ? `${s.question.slice(0, 43).trimEnd()}…` : s.question}`,
  }));
}
