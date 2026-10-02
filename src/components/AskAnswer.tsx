"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { MomentButton } from "@/components/MomentButton";
import { UnderTheHood } from "@/components/UnderTheHood";
import { Snippet } from "@/components/ResultCard";
import { SaveButton } from "@/components/SaveButton";
import { formatTime } from "@/lib/format";
import type { SnippetPart } from "@/lib/highlight";
import type { TimedWord } from "@/lib/segments";
import { answerHoodItems } from "@/lib/hood-items";
import { clipUrl, thumbUrl } from "@/lib/media";
import { recordQuestion } from "@/lib/saved";

export type Citation = {
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

type Reel = { url: string; durationS: number; clips: number } | null;

export type AskResponse =
  | { status: "answered"; answer: string; citations: Citation[]; reel: Reel; followUps?: string[]; answerId?: string | null }
  | { status: "not_found" | "fallback"; answer: null; citations: Citation[]; reel?: Reel; followUps?: string[]; answerId?: string | null };

type Progress = { retrieved?: { moments: number; sessions: string[] }; writing?: boolean };

type State =
  | { kind: "loading"; progress: Progress }
  | { kind: "error"; message: string }
  | { kind: "done"; data: AskResponse };

const UNAVAILABLE = "Ask is unavailable right now — the moments below still work.";

// `lectureId` scopes the Ask to one session (the Watch page's "Ask this session"); `onFollowUp` then keeps
// suggested next questions in that scope instead of linking to a library-wide search.
export function AskAnswer({
  question,
  lectureId,
  onFollowUp,
}: {
  question: string;
  lectureId?: string;
  onFollowUp?: (question: string) => void;
}) {
  const [state, setState] = useState<State>({ kind: "loading", progress: {} });

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      // Streamed: each step arrives as one JSON line, so the learner sees real progress, not a blank wait.
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/x-ndjson" },
        body: JSON.stringify({ question, lectureId }),
        signal: controller.signal,
      });
      if (res.status === 429) return setState({ kind: "error", message: "You've asked a lot — try again in a few minutes." });
      if (!res.ok || !res.body) return setState({ kind: "error", message: UNAVAILABLE });

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += value;
        let newline: number;
        while ((newline = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, newline).trim();
          buffer = buffer.slice(newline + 1);
          if (!line) continue;
          const event = JSON.parse(line);
          if (event.type === "retrieved") {
            setState((s) => (s.kind === "loading" ? { kind: "loading", progress: { ...s.progress, retrieved: event } } : s));
          } else if (event.type === "writing") {
            setState((s) => (s.kind === "loading" ? { kind: "loading", progress: { ...s.progress, writing: true } } : s));
          } else if (event.type === "result") {
            setState({ kind: "done", data: event as AskResponse });
            recordQuestion(question, (event as AskResponse).answerId ?? null);
          } else if (event.type === "error") {
            setState({ kind: "error", message: UNAVAILABLE });
          }
        }
      }
    })().catch((e) => {
      if (e?.name !== "AbortError") setState({ kind: "error", message: "Couldn't reach Pravaha. Check your connection." });
    });
    return () => controller.abort();
  }, [question, lectureId]);

  return (
    <section aria-labelledby="answer-heading" aria-live="polite" className="rise mt-6 rounded-3xl border border-border bg-surface p-5 sm:p-6">
      <h2 id="answer-heading" className="text-sm font-semibold tracking-wide text-accent uppercase">
        {lectureId ? "Answer from this session" : "Answer from your library"}
      </h2>

      {state.kind === "loading" && <Steps progress={state.progress} scoped={!!lectureId} />}
      {state.kind === "error" && <p className="mt-3 text-muted">{state.message}</p>}
      {state.kind === "done" && <AnswerBody data={state.data} question={question} onFollowUp={onFollowUp} />}
    </section>
  );
}

// The live "what is happening" list: every line reflects a real server step.
function Steps({ progress, scoped }: { progress: Progress; scoped: boolean }) {
  const { retrieved, writing } = progress;
  const found = retrieved
    ? retrieved.moments
      ? `Found ${retrieved.moments} moment${retrieved.moments === 1 ? "" : "s"} in ${retrieved.sessions.length} session${retrieved.sessions.length === 1 ? "" : "s"}`
      : "No matching moments"
    : null;
  return (
    <div className="mt-4" aria-label="Finding the moments that answer this…">
      <ol className="space-y-2.5 text-sm">
        <Step done={!!retrieved} label={found ?? (scoped ? "Searching this session for what was said…" : "Searching every session for what was said…")} />
        {retrieved && retrieved.sessions.length > 0 && (
          <li className="rise flex flex-wrap gap-1.5 pl-7">
            {retrieved.sessions.map((s) => (
              <span key={s} className="rounded-full border border-border bg-bg px-2.5 py-0.5 text-xs text-muted">
                {s}
              </span>
            ))}
          </li>
        )}
        {retrieved && retrieved.moments > 0 && <Step done={false} active={!!writing} label="Writing an answer only from those moments…" />}
      </ol>
      {/* Shaped like the answer that replaces it (text, Answer Reel, clip cards), so the page below doesn't jump. */}
      <div className="mt-5 space-y-2.5" aria-hidden>
        <div className="skeleton h-4 w-11/12" />
        <div className="skeleton h-4 w-10/12" />
        <div className="skeleton h-4 w-7/12" />
      </div>
      <div className="skeleton mt-6 h-20 rounded-2xl" aria-hidden />
      <div className="mt-5 grid gap-3 md:grid-cols-2" aria-hidden>
        {[0, 1].map((i) => (
          <div key={i} className="rounded-2xl border border-border p-3">
            <div className="skeleton aspect-video rounded-xl" />
            <div className="skeleton mt-3 h-4 w-2/3" />
            <div className="skeleton mt-2 h-3 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Step({ done, active = !done, label }: { done: boolean; active?: boolean; label: string }) {
  return (
    <li className="rise flex items-center gap-2.5">
      <span aria-hidden className="grid size-4.5 shrink-0 place-items-center">
        {done ? (
          <svg viewBox="0 0 20 20" className="size-4.5 text-accent">
            <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.15" />
            <path d="M6 10.5l2.5 2.5L14 7.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : active ? (
          <span className="spinner size-4" />
        ) : (
          <span className="size-2 rounded-full bg-border" />
        )}
      </span>
      <span className={done ? "text-fg" : "text-muted"}>{label}</span>
    </li>
  );
}

export function AnswerBody({
  data,
  question,
  onFollowUp,
}: {
  data: AskResponse;
  question: string;
  onFollowUp?: (question: string) => void;
}) {
  return (
    <>
      {data.status === "answered" && <AnswerText text={data.answer} citations={data.citations} />}
      {data.status === "answered" && <AnswerActions data={data} question={question} />}
      {data.status === "not_found" && (
        <div className="rise mt-3">
          <p className="text-lg">That isn&apos;t covered in this library yet.</p>
          <p className="mt-1 text-sm text-muted">Pravaha only answers from these recordings, so it won&apos;t guess. Try different words, or browse the library.</p>
        </div>
      )}
      {data.status === "fallback" && <p className="rise mt-3 text-muted">Here are the most relevant moments.</p>}
      {data.reel && data.reel.clips > 1 && <AnswerReel reel={data.reel} />}
      {data.citations.length > 0 && (
        <ol className="mt-5 grid gap-3 md:grid-cols-2">
          {data.citations.map((c, i) => (
            <li key={c.segmentId} id={`cite-${c.n}`} className="rise scroll-mt-24 rounded-2xl" style={{ animationDelay: `${120 + i * 70}ms` }}>
              <CitationCard c={c} />
            </li>
          ))}
        </ol>
      )}
      {data.followUps && data.followUps.length > 0 && <FollowUps questions={data.followUps} onAsk={onFollowUp} />}
      {data.citations.length > 0 && (
        <UnderTheHood title="How Cloudinary built this answer" items={answerHoodItems(data.citations, data.reel)} />
      )}
    </>
  );
}

const VOTE_KEY = (id: string) => `pravaha-vote-${id}`;

// Perplexity-style action bar under an answer: what it was built from, then Share, Copy and 👍/👎.
function AnswerActions({ data, question }: { data: Extract<AskResponse, { status: "answered" }>; question: string }) {
  const [copied, setCopied] = useState<"link" | "text" | null>(null);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const answerId = data.answerId ?? null;
  const sessions = new Set(data.citations.map((c) => c.lectureId)).size;

  useEffect(() => {
    if (!answerId) return;
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(VOTE_KEY(answerId));
    } catch {}
    if (saved !== "up" && saved !== "down") return;
    const remembered = saved;
    const frame = requestAnimationFrame(() => setVote(remembered));
    return () => cancelAnimationFrame(frame);
  }, [answerId]);

  function flash(kind: "link" | "text") {
    setCopied(kind);
    setTimeout(() => setCopied(null), 1800);
  }

  async function share() {
    if (!answerId) return;
    const url = `${location.origin}/a/${answerId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: question, text: "Answered from lecture recordings on Pravaha", url });
        return;
      } catch (e) {
        if ((e as Error)?.name === "AbortError") return;
      }
    }
    await navigator.clipboard?.writeText(url).then(() => flash("link"), () => {});
  }

  async function copy() {
    const sources = data.citations
      .map((c) => `[${c.n}] ${c.title}${c.speaker ? ` — ${c.speaker}` : ""}, ${formatTime(c.startS)}: ${location.origin}/watch/${c.lectureId}?t=${Math.floor(c.startS)}`)
      .join("\n");
    await navigator.clipboard?.writeText(`${question}\n\n${data.answer}\n\nSources:\n${sources}`).then(() => flash("text"), () => {});
  }

  async function rate(helpful: boolean) {
    if (!answerId || vote) return;
    const next = helpful ? "up" : "down";
    setVote(next);
    try {
      localStorage.setItem(VOTE_KEY(answerId), next);
    } catch {}
    await fetch(`/api/answers/${answerId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ helpful }),
    }).catch(() => {});
  }

  const btn = "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted hover:bg-bg hover:text-fg";
  return (
    <div className="rise mt-4 flex flex-wrap items-center gap-x-1 gap-y-2 border-y border-border py-2" style={{ animationDelay: "200ms" }}>
      <a href="#cite-1" className="mr-auto flex items-center gap-2 rounded-lg py-1 pr-2 text-sm text-muted hover:text-fg">
        <span className="flex -space-x-2" aria-hidden>
          {data.citations.slice(0, 3).map((c) => (
            <Image
              key={c.segmentId}
              src={thumbUrl(c.publicId, c.startS)}
              alt=""
              width={48}
              height={48}
              unoptimized
              className="size-6 rounded-full border-2 border-surface object-cover"
            />
          ))}
        </span>
        {data.citations.length} moment{data.citations.length === 1 ? "" : "s"} · {sessions} session{sessions === 1 ? "" : "s"}
      </a>
      {answerId && (
        <button type="button" onClick={share} className={btn}>
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v13" />
          </svg>
          {copied === "link" ? "Link copied" : "Share"}
        </button>
      )}
      <button type="button" onClick={copy} className={btn}>
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3" />
        </svg>
        {copied === "text" ? "Copied" : "Copy"}
      </button>
      {answerId && (
        <span className="flex items-center" role="group" aria-label="Was this answer helpful?">
          <button
            type="button"
            onClick={() => rate(true)}
            aria-pressed={vote === "up"}
            aria-label="Helpful"
            disabled={!!vote}
            className={`${btn} disabled:cursor-default ${vote === "up" ? "text-accent" : ""}`}
          >
            <Thumb filled={vote === "up"} />
          </button>
          <button
            type="button"
            onClick={() => rate(false)}
            aria-pressed={vote === "down"}
            aria-label="Not helpful"
            disabled={!!vote}
            className={`${btn} disabled:cursor-default ${vote === "down" ? "text-failed" : ""}`}
          >
            <Thumb filled={vote === "down"} down />
          </button>
          {vote && <span className="rise pl-1 text-xs text-muted">Thanks for the feedback</span>}
        </span>
      )}
    </div>
  );
}

function Thumb({ filled, down = false }: { filled: boolean; down?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`size-4 ${down ? "rotate-180" : ""}`}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 10v11H4V10zM7 10l4-8a3 3 0 013 3v4h5a2 2 0 012 2.3l-1.4 8A2 2 0 0117.6 21H7" />
    </svg>
  );
}

// Suggested next questions: each is a new Ask in the same scope (the library, or `onAsk`'s session).
function FollowUps({ questions, onAsk }: { questions: string[]; onAsk?: (question: string) => void }) {
  const chip = "lift inline-flex items-center gap-1.5 rounded-full border border-border bg-bg px-3 py-1.5 text-left text-sm hover:border-accent";
  return (
    <div className="rise mt-6 border-t border-border pt-4" style={{ animationDelay: "350ms" }}>
      <p className="text-sm font-semibold text-muted">Ask next</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {questions.map((q) => (
          <li key={q}>
            {onAsk ? (
              <button type="button" onClick={() => onAsk(q)} className={chip}>
                <span aria-hidden className="text-accent">↳</span>
                {q}
              </button>
            ) : (
              <Link href={`/search?q=${encodeURIComponent(q)}`} className={chip}>
                <span aria-hidden className="text-accent">↳</span>
                {q}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// The cited moments stitched into one video by Cloudinary — watch the whole answer, across sessions.
function AnswerReel({ reel }: { reel: NonNullable<Reel> }) {
  const [playing, setPlaying] = useState(false);
  if (playing) {
    return <video src={reel.url} className="rise mt-5 aspect-video w-full rounded-2xl bg-black" controls autoPlay playsInline />;
  }
  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="rise lift mt-5 flex w-full items-center gap-4 rounded-2xl border border-accent/40 bg-accent/10 p-4 text-left hover:bg-accent/15"
      style={{ animationDelay: "60ms" }}
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-accent-fg">▶</span>
      <span>
        <span className="block font-semibold">Watch the answer</span>
        <span className="text-sm text-muted">
          {reel.clips} moments stitched into one <span className="tabular">{formatTime(reel.durationS)}</span> video
        </span>
      </span>
    </button>
  );
}

const WORD_STAGGER_MS = 16;
const WORD_STAGGER_CAP_MS = 900;

// Renders "…early stopping [2]." with [n] as chips: hover or focus previews the quote, click jumps to the clip.
// The text was validated server-side before it arrives; the word-by-word reveal is presentation only.
function AnswerText({ text, citations }: { text: string; citations: Citation[] }) {
  const byN = new Map(citations.map((c) => [String(c.n), c]));
  let word = 0;
  const delay = () => `${Math.min(word++ * WORD_STAGGER_MS, WORD_STAGGER_CAP_MS)}ms`;

  function focus(n: string) {
    const el = document.getElementById(`cite-${n}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.remove("pulse");
    void el.offsetWidth; // restart the animation
    el.classList.add("pulse");
  }

  return (
    <p className="mt-3 text-lg leading-relaxed">
      {text.split(/(\[\d+\])/g).map((part, i) => {
        const match = part.match(/^\[(\d+)\]$/);
        if (!match) {
          return part.split(/(\s+)/).map((w, j) =>
            /^\s+$/.test(w) || !w ? (
              w
            ) : (
              <span key={`${i}-${j}`} className="word-in" style={{ animationDelay: delay() }}>
                {w}
              </span>
            ),
          );
        }
        const n = match[1]!;
        const c = byN.get(n);
        return (
          <span key={i} className="group relative mx-0.5 inline-block align-text-top word-in" style={{ animationDelay: delay() }}>
            <button
              type="button"
              onClick={() => focus(n)}
              aria-label={`Source ${n}${c ? `: ${c.title} at ${formatTime(c.startS)}` : ""}`}
              className="inline-grid min-h-6 min-w-6 place-items-center rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-fg transition-transform hover:scale-110"
            >
              {n}
            </button>
            {c && (
              <span
                role="tooltip"
                className="pointer-events-none invisible absolute bottom-full left-1/2 z-20 mb-2 w-72 -translate-x-1/2 translate-y-1 rounded-xl border border-border bg-surface p-3 text-left text-sm leading-snug opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100"
              >
                <span className="block font-medium">{c.title}</span>
                <span className="block text-xs text-muted">
                  {c.speaker ?? "Unknown speaker"} · <span className="tabular">{formatTime(c.startS)}</span>
                </span>
                <span className="mt-1.5 line-clamp-4 block text-fg">“{c.text}”</span>
              </span>
            )}
          </span>
        );
      })}
    </p>
  );
}

function CitationCard({ c }: { c: Citation }) {
  const [playing, setPlaying] = useState(false);
  return (
    <article className="lift h-full rounded-2xl border border-border bg-bg p-3">
      <div className="relative overflow-hidden rounded-xl bg-black">
        {playing ? (
          <video src={clipUrl(c.publicId, c.startS, c.endS)} className="aspect-video w-full" controls autoPlay playsInline />
        ) : (
          <button type="button" onClick={() => setPlaying(true)} className="group block w-full" aria-label={`Play ${c.title} at ${formatTime(c.startS)}`}>
            <Image
              src={thumbUrl(c.publicId, c.startS)}
              alt=""
              width={640}
              height={360}
              unoptimized
              className="aspect-video w-full object-cover opacity-90 transition duration-300 group-hover:scale-[1.03] group-hover:opacity-100"
            />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-12 place-items-center rounded-full bg-white/90 text-black shadow-lg transition-transform group-hover:scale-110">▶</span>
            </span>
          </button>
        )}
        <span className="absolute top-2 left-2 grid size-6 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-fg">
          {c.n}
        </span>
      </div>
      <p className="mt-2.5 font-medium">{c.title}</p>
      <p className="text-sm text-muted">
        {c.speaker ?? "Unknown speaker"} · <span className="tabular">{formatTime(c.startS)}</span>
      </p>
      <p className="mt-1.5 line-clamp-3 text-sm">
        “<Snippet parts={c.snippet} />”
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/watch/${c.lectureId}?t=${Math.floor(c.startS)}`}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:border-accent"
        >
          Open full session
        </Link>
        <MomentButton
          lectureId={c.lectureId}
          publicId={c.publicId}
          title={c.title}
          startS={c.startS}
          endS={c.endS}
          durationS={c.durationS}
          words={c.words}
          segmentId={c.segmentId}
        />
        <SaveButton
          moment={{
            segmentId: c.segmentId,
            lectureId: c.lectureId,
            publicId: c.publicId,
            title: c.title,
            speaker: c.speaker,
            startS: c.startS,
            endS: c.endS,
            text: c.text,
          }}
        />
      </div>
    </article>
  );
}
