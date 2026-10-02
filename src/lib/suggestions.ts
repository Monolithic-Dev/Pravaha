// Ask suggestions for the home page: real questions the library can answer. Study Pack quiz questions
// were generated from (and are answerable by) a session's transcript, so they make good prompts; concept
// names fill in when a session has no usable question. Pure, so it is unit-tested.

export type PackLike = { quiz?: { question: string }[]; concepts?: { name: string }[] };

const MAX_LEN = 64;
const OPEN_QUESTION = /^(what|why|how|when)\b/i;
// Quiz phrasing that only makes sense next to the options or the session ("Which of the following…").
const QUIZ_ONLY = /\b(following|according to|this (session|lecture|video)|the (speaker|lecturer|instructor)|mentioned|described)\b/i;

const usable = (q: string) => q.length <= MAX_LEN && OPEN_QUESTION.test(q) && !QUIZ_ONLY.test(q);

export function pickSuggestions(packs: PackLike[], limit = 4): string[] {
  const picked: string[] = [];
  const seen = new Set<string>();
  const add = (q: string) => {
    const key = q.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!key || seen.has(key) || picked.length >= limit) return;
    seen.add(key);
    picked.push(q);
  };

  // One question per session first, so the suggestions span the library.
  for (const pack of packs) {
    const q = pack.quiz?.map((item) => item.question.trim()).find(usable);
    if (q) add(q);
  }
  // Then concepts, round-robin across sessions for the same reason.
  const longest = Math.max(0, ...packs.map((p) => p.concepts?.length ?? 0));
  for (let i = 0; i < longest; i++) {
    for (const pack of packs) {
      // "Overfitting Definition" → "Overfitting": the chip already asks "What is …?".
      const name = pack.concepts?.[i]?.name.trim().replace(/\s+(definition|overview|basics|introduction)$/i, "");
      if (name && name.length <= 40) add(`What is ${name.replace(/^the\s+/i, "")}?`);
    }
  }
  return picked;
}
