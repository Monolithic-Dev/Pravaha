// Two learners asking the same thing should share one stored answer, however they type it: case, spacing and a
// trailing "?" don't change a question. Pure, so it is unit-tested.
export const CACHE_TTL_HOURS = 24;

export function questionKey(question: string): string {
  return question
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[\s?!.,;:।。؟]+$/u, "") // trailing ? ! . , ; : and the Devanagari, CJK and Arabic stops
    .trim();
}
