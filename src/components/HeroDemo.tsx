"use client";

import { useEffect, useState } from "react";

export type DemoClip = { title: string; speaker: string | null; thumb: string };

// A looping, self-playing picture of one Ask: the question types itself, retrieval reports in, the answer
// streams with numbered citations, and the cited clips rise in. Decorative (the real Ask bar is right
// beside it), so it is hidden from assistive tech; with reduced motion it shows the finished state, still.
const QUESTION = "How do I stop my model from overfitting?";
const ANSWER: (string | number)[] = [
  "Hold out a validation set and watch its loss",
  1,
  ", stop training early once that loss starts rising",
  2,
  ", and add regularization so the weights stay small",
  3,
  ".",
];

// Milliseconds into each loop at which a stage begins.
const TYPE_MS = 38;
const T_RETRIEVED = QUESTION.length * TYPE_MS + 350;
const T_ANSWER = T_RETRIEVED + 900;
const T_CLIPS = T_ANSWER + 1700;
const LOOP_MS = T_CLIPS + 5200;

export function HeroDemo({ clips }: { clips: DemoClip[] }) {
  const [t, setT] = useState(0);

  useEffect(() => {
    let start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      if (now - start >= LOOP_MS) start = now;
      // 40 ms resolution: smooth enough for typing, and React skips renders when the value is unchanged.
      setT(Math.floor((now - start) / 40) * 40);
      frame = requestAnimationFrame(step);
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      frame = requestAnimationFrame(() => setT(LOOP_MS - 1));
      return () => cancelAnimationFrame(frame);
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, []);

  const typed = QUESTION.slice(0, Math.floor(t / TYPE_MS));
  const typing = typed.length < QUESTION.length;
  const shown = clips.slice(0, 3);
  const sessions = new Set(shown.map((c) => c.title)).size || 3;

  return (
    <div aria-hidden className="relative isolate">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--accent)_22%,transparent),transparent_70%)] blur-2xl" />
      <div className="rounded-2xl border border-border bg-surface/90 p-4 shadow-[0_24px_60px_-30px_color-mix(in_srgb,var(--fg)_45%,transparent)] backdrop-blur">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2.5 text-sm">
          <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span className="min-h-5 truncate">
            {typed}
            {typing && <span className="caret ml-px inline-block h-4 w-px translate-y-0.5 bg-fg" />}
          </span>
          <span className="ml-auto rounded-lg bg-accent px-2.5 py-1 text-xs font-medium text-accent-fg">Ask</span>
        </div>

        <div className="min-h-[19rem] px-1 pt-4">
          {t >= T_RETRIEVED && (
            <p className="rise flex items-center gap-2 text-xs text-muted">
              {t < T_ANSWER ? <span className="spinner size-3" /> : <span className="size-1.5 rounded-full bg-ready" />}
              Found {shown.length ? shown.length * 2 : 6} moments in {sessions} sessions
            </p>
          )}

          {t >= T_ANSWER && (
            <p className="mt-3 text-[15px] leading-relaxed">
              {ANSWER.map((part, i) =>
                typeof part === "number" ? (
                  <span
                    key={i}
                    className="word-in mx-0.5 inline-grid size-5 translate-y-[-1px] place-items-center rounded-full bg-accent align-middle text-[11px] font-semibold text-accent-fg"
                    style={{ animationDelay: `${i * 180}ms` }}
                  >
                    {part}
                  </span>
                ) : (
                  <span key={i} className="word-in" style={{ animationDelay: `${i * 180}ms` }}>
                    {part}
                  </span>
                ),
              )}
            </p>
          )}

          {t >= T_CLIPS && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => {
                const clip = shown[i % Math.max(shown.length, 1)];
                return (
                  <div key={i} className="rise overflow-hidden rounded-xl border border-border bg-bg" style={{ animationDelay: `${i * 120}ms` }}>
                    <div className="relative aspect-video bg-accent/15">
                      {clip && (
                        // eslint-disable-next-line @next/next/no-img-element -- tiny decorative Cloudinary thumbnail
                        <img src={clip.thumb} alt="" className="size-full object-cover" loading="lazy" />
                      )}
                      <span className="absolute top-1 left-1 grid size-4 place-items-center rounded-full bg-accent text-[9px] font-semibold text-accent-fg">
                        {i + 1}
                      </span>
                      {i === 0 && (
                        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white/30">
                          <span className="playhead block h-full bg-accent" />
                        </span>
                      )}
                    </div>
                    <p className="truncate px-1.5 py-1 text-[10px] text-muted">{clip?.speaker ?? clip?.title ?? "Lecture"}</p>
                  </div>
                );
              })}
            </div>
          )}

          {t >= T_CLIPS + 900 && (
            <div className="rise mt-3 flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-xs">
              <span className="grid size-6 place-items-center rounded-full bg-accent text-accent-fg">
                <svg viewBox="0 0 24 24" className="size-3" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <span>
                <span className="font-medium">Watch the answer</span>
                <span className="text-muted"> · 3 moments, one video</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
