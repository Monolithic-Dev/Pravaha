// Voice question: the browser's own speech recognition (Web Speech API, free, on-device or the browser vendor's
// service) turns a spoken question into text, and the normal Ask takes it from there. No audio ever reaches
// Pravaha. English (India) and Hindi; the Ask pipeline already answers a Hindi question in Hindi. Pure
// helpers, so they are unit-tested; the microphone itself lives in src/components/VoiceButton.tsx.

export const VOICE_LANGS = [
  { code: "en-IN", label: "EN", name: "English" },
  { code: "hi-IN", label: "हिं", name: "Hindi" },
] as const;
export type VoiceLang = (typeof VOICE_LANGS)[number]["code"];

export const isVoiceLang = (v: unknown): v is VoiceLang => VOICE_LANGS.some((l) => l.code === v);

// Just enough of the (still prefixed in Chrome and Safari) SpeechRecognition API for this feature.
export type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};
export type RecognitionCtor = new () => Recognition;

export function recognitionCtor(w: object): RecognitionCtor | null {
  const speech = w as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  return ((speech.SpeechRecognition ?? speech.webkitSpeechRecognition) as RecognitionCtor | undefined) ?? null;
}

// The words so far, from every result the recogniser has produced (interim ones included while it is still
// listening), with the whitespace tidied.
export function transcriptOf(results: ArrayLike<ArrayLike<{ transcript: string }>>): string {
  let text = "";
  for (let i = 0; i < results.length; i++) text += results[i]![0]?.transcript ?? "";
  return text.replace(/\s+/g, " ").trim();
}

// What to tell the learner for each recogniser error, in plain words; null = nothing worth saying.
export function voiceErrorMessage(code: string): string | null {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Microphone access is blocked. Allow it in your browser's site settings, or type the question.";
    case "no-speech":
      return "I didn't hear anything. Tap the microphone and try again.";
    case "audio-capture":
      return "No microphone was found.";
    case "network":
      return "Voice needs an internet connection. Type the question instead.";
    case "aborted":
      return null;
    default:
      return "Voice didn't work this time. Type the question instead.";
  }
}
