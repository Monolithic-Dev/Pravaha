// Library transcripts are English, and retrieval is Postgres English full-text search, which can't match a
// question written in another script (Devanagari, Tamil, Bengali…). Such questions are translated to English
// for retrieval only; the answer is still written in the language of the question. Pure, so it is unit-tested.
const NON_LATIN_LETTER = /(?!\p{Script=Latin})\p{L}/u;

export function needsTranslation(question: string): boolean {
  return NON_LATIN_LETTER.test(question);
}

// Subtitle languages Cloudinary translates transcripts into (upload preset `auto_transcription.translate`),
// with the label the player shows. The player loads `{public_id}.{code}.transcript` for each.
export const SUBTITLE_LANGUAGES = [{ code: "hi-IN", label: "हिन्दी" }] as const;
export type SubtitleLanguage = (typeof SUBTITLE_LANGUAGES)[number];
