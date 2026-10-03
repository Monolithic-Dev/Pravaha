"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { isVoiceLang, recognitionCtor, transcriptOf, VOICE_LANGS, voiceErrorMessage, type Recognition, type VoiceLang } from "@/lib/voice";

const KEY = "pravaha-voice-lang";

function storedLang(): VoiceLang {
  try {
    const v = localStorage.getItem(KEY);
    return isVoiceLang(v) ? v : "en-IN";
  } catch {
    return "en-IN";
  }
}

// Ask by voice: tap the microphone, say the question (English or Hindi), and it is asked. Hidden where the
// browser has no speech recognition (Firefox), so nobody sees a button that can't work.
export function VoiceButton({ inputId }: { inputId: string }) {
  const supported = useSyncExternalStore(
    () => () => {},
    () => recognitionCtor(window) !== null,
    () => false,
  );
  const [lang, setLang] = useState<VoiceLang>("en-IN");
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const recognition = useRef<Recognition | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setLang(storedLang()));
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => () => recognition.current?.stop(), []);

  if (!supported) return null;

  function toggleLang() {
    const next: VoiceLang = lang === "en-IN" ? "hi-IN" : "en-IN";
    setLang(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Storage blocked: the choice still applies for this page view.
    }
  }

  function start() {
    const Ctor = recognitionCtor(window);
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    if (!Ctor || !input) return;
    if (listening) return recognition.current?.stop();

    const r = new Ctor();
    r.lang = lang;
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;
    let heard = "";
    r.onresult = (e) => {
      heard = transcriptOf(e.results);
      input.value = heard; // shown as it is heard
    };
    r.onerror = (e) => setMessage(voiceErrorMessage(e.error));
    r.onend = () => {
      setListening(false);
      // Ask what was heard; a too-short or empty result is left in the box for the learner to edit.
      if (heard.length >= 2) input.form?.requestSubmit();
    };
    setMessage(null);
    recognition.current = r;
    try {
      r.start();
      setListening(true);
    } catch {
      setMessage(voiceErrorMessage("other"));
    }
  }

  const current = VOICE_LANGS.find((l) => l.code === lang)!;
  const other = VOICE_LANGS.find((l) => l.code !== lang)!;
  return (
    <>
      <div className="absolute top-1/2 right-[5.25rem] flex -translate-y-1/2 items-center gap-0.5">
        <button
          type="button"
          onClick={toggleLang}
          disabled={listening}
          aria-label={`Voice language: ${current.name}. Switch to ${other.name}`}
          title={`Voice language: ${current.name}. Tap to switch to ${other.name}`}
          className="h-8 rounded-md px-1.5 text-xs font-semibold text-muted hover:bg-bg hover:text-fg disabled:opacity-50"
        >
          {current.label}
        </button>
        <button
          type="button"
          onClick={start}
          aria-pressed={listening}
          aria-label={listening ? "Stop listening" : `Ask by voice in ${current.name}`}
          title={listening ? "Stop listening" : `Ask by voice in ${current.name}`}
          className={`grid size-9 place-items-center rounded-full transition-colors ${listening ? "animate-pulse bg-failed text-white" : "text-muted hover:bg-bg hover:text-fg"}`}
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
          </svg>
        </button>
      </div>
      <p role="status" aria-live="polite" className={message || listening ? "mt-2 text-sm text-muted" : "sr-only"}>
        {listening ? `Listening in ${current.name}… say your question.` : message}
      </p>
    </>
  );
}
