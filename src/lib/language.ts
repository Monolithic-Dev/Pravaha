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

// The language a question's script implies, for telling the model what to answer in. English lecture
// excerpts pull replies into English unless the target language is named outright. null = Latin script.
const SCRIPTS: [RegExp, string][] = [
  [/\p{Script=Devanagari}/u, "Hindi (Devanagari script)"],
  [/\p{Script=Tamil}/u, "Tamil"],
  [/\p{Script=Telugu}/u, "Telugu"],
  [/\p{Script=Kannada}/u, "Kannada"],
  [/\p{Script=Malayalam}/u, "Malayalam"],
  [/\p{Script=Bengali}/u, "Bengali"],
  [/\p{Script=Gujarati}/u, "Gujarati"],
  [/\p{Script=Gurmukhi}/u, "Punjabi (Gurmukhi script)"],
  [/\p{Script=Arabic}/u, "Urdu"],
];

export function answerLanguage(question: string): string | null {
  if (!needsTranslation(question)) return null;
  return SCRIPTS.find(([re]) => re.test(question))?.[1] ?? "the same language and script as the question";
}

// Models sometimes end Indic sentences with the CJK full stop (。). Replace it with the script's own stop:
// the danda (।) for Devanagari, Bengali and Gurmukhi, a plain full stop for the others.
export function fixPunctuation(text: string, language: string | null): string {
  if (!language || !text.includes("。")) return text;
  return text.replaceAll("。", /Hindi|Bengali|Punjabi/.test(language) ? "।" : ".");
}
