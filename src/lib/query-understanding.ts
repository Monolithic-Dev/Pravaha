import "server-only";
import { z } from "zod";

import { generateJson } from "@/lib/ai";
import { libraryVocabulary } from "@/lib/lectures";
import { log } from "@/lib/log";
import { searchStringFor } from "@/lib/query-plan";

const Understood = z.object({
  english: z.string().describe("The learner's question in natural English (translated if it isn't English)."),
  search_terms: z
    .array(z.string())
    .describe("4–10 words or short phrases a lecturer would actually SAY while explaining this, preferring the library's own vocabulary."),
});

const SYSTEM = `You prepare a learner's question for searching English lecture transcripts.
1. english: the question in natural English (translate it if needed; keep technical terms in their usual English form).
2. search_terms: 4–10 words or short phrases a lecturer would actually say while explaining the answer.
   Lecturers rarely say the textbook name of an idea — include the concrete words they use instead
   (e.g. "bias-variance trade-off" → "underfitting", "overfitting", "model complexity", "polynomial degree", "training error").
   Prefer terms from the library vocabulary when they fit. Never answer the question.`;

let cached: { at: number; vocabulary: string[] } | undefined;
const VOCABULARY_TTL_MS = 5 * 60_000;

async function vocabulary(): Promise<string[]> {
  if (cached && Date.now() - cached.at < VOCABULARY_TTL_MS) return cached.vocabulary;
  cached = { at: Date.now(), vocabulary: await libraryVocabulary() };
  return cached.vocabulary;
}

// The question rewritten for retrieval, or null if the AI is unavailable (callers keep the keyword hits).
export async function understandQuestion(question: string): Promise<{ english: string; search: string } | null> {
  try {
    const terms = await vocabulary();
    const prompt = `Library vocabulary (session and chapter titles):\n${terms.map((t) => `- ${t}`).join("\n")}\n\nQuestion: ${question}`;
    const { data, model } = await generateJson(Understood, {
      task: "understand_question",
      system: SYSTEM,
      prompt,
      timeoutMs: 8_000,
      budgetMs: 11_000,
    });
    log("ask.understood", { model, terms: data.search_terms.length });
    return { english: data.english.trim(), search: searchStringFor(data.english, data.search_terms) };
  } catch (error) {
    log("ask.understand_failed", { error: error instanceof Error ? error.message.slice(0, 120) : String(error) });
    return null;
  }
}
