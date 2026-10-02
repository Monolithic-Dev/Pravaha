import "server-only";
import { z } from "zod";

import { generateJson } from "@/lib/ai";
import { needsTranslation } from "@/lib/language";
import { log } from "@/lib/log";

const SearchQuery = z.object({
  english: z.string().describe("The learner's question translated into natural English, keeping technical terms."),
});

const SYSTEM = `Translate the learner's question into English so it can be searched against English lecture transcripts.
Keep technical terms (overfitting, gradient descent, learning rate…) in their usual English form. Return only the translation.`;

// The question used for retrieval. Unchanged unless it contains non-Latin letters; on any AI failure the
// original is used (retrieval then finds less, and Ask falls back exactly as it does for English).
export async function searchableQuestion(question: string): Promise<string> {
  if (!needsTranslation(question)) return question;
  try {
    const { data } = await generateJson(SearchQuery, { system: SYSTEM, prompt: question, timeoutMs: 6_000, task: "translate_question" });
    const english = data.english.trim();
    log("ask.translated", { chars: question.length });
    return english || question;
  } catch {
    return question;
  }
}
