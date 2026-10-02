"use client";

import { useState } from "react";

import { formatTime } from "@/lib/format";
import { reelUrl } from "@/lib/media";
import type { StudyPack } from "@/lib/study-pack-schema";

type Props = { pack: StudyPack; publicId: string; onSeek: (seconds: number) => void };

export function StudyPanel({ pack, publicId, onSeek }: Props) {
  const reel = reelUrl(pack.highlights.map((h) => ({ publicId, startS: h.startS, endS: h.endS, label: h.label ?? undefined })));

  return (
    <div className="space-y-6 p-4">
      {reel && (
        <ReelButton
          url={reel.url}
          title={`Session in ${Math.round(reel.durationS)} seconds`}
          subtitle={`${reel.clips} AI-picked highlights, stitched by Cloudinary`}
        />
      )}

      {pack.summary.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">In short</h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            {pack.summary.map((s) => (
              <li key={s} className="flex gap-2">
                <span aria-hidden className="text-accent">•</span>
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}

      {pack.concepts.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">Key concepts</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {pack.concepts.map((c) => (
              <button
                key={`${c.name}-${c.segmentId}`}
                type="button"
                onClick={() => onSeek(c.startS)}
                className="rounded-full border border-border bg-bg px-3 py-1 text-sm hover:border-accent"
              >
                {c.name} <span className="tabular text-xs text-accent">{formatTime(c.startS)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {pack.quiz.length > 0 && <Quiz quiz={pack.quiz} publicId={publicId} onSeek={onSeek} />}
    </div>
  );
}

// A Cloudinary-stitched reel behind a play button; the video loads only when asked for.
function ReelButton({ url, title, subtitle }: { url: string; title: string; subtitle: string }) {
  const [playing, setPlaying] = useState(false);
  if (playing) return <video src={url} className="aspect-video w-full rounded-xl bg-black" controls autoPlay playsInline />;
  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="flex w-full items-center gap-3 rounded-xl border border-accent/40 bg-accent/10 p-3 text-left hover:bg-accent/15"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-fg">▶</span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="text-xs text-muted">{subtitle}</span>
      </span>
    </button>
  );
}

function Quiz({ quiz, publicId, onSeek }: { quiz: StudyPack["quiz"]; publicId: string; onSeek: (seconds: number) => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  // Bumped on every retry so the "missed" reel remounts closed instead of replaying the old one.
  const [round, setRound] = useState(0);
  const answered = Object.keys(answers).length;
  const correct = quiz.filter((q, i) => answers[i] === q.correctIndex).length;
  const missed = quiz.map((q, i) => ({ q, i })).filter(({ q, i }) => answers[i] !== undefined && answers[i] !== q.correctIndex);
  const finished = answered === quiz.length;
  // Every explanation you got wrong, stitched by Cloudinary into one video (fl_splice), in quiz order.
  const missedReel = finished
    ? reelUrl(missed.map(({ q, i }) => ({ publicId, startS: q.startS, endS: q.endS, label: `Question ${i + 1}` })))
    : null;

  function retry(onlyMissed: boolean) {
    setAnswers((a) => (onlyMissed ? Object.fromEntries(Object.entries(a).filter(([i, j]) => quiz[Number(i)]!.correctIndex === j)) : {}));
    setRound((r) => r + 1);
  }

  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">Check yourself</h2>
        {answered > 0 && (
          <span className="tabular text-sm text-muted" aria-live="polite">
            {correct}/{answered} correct
          </span>
        )}
      </div>
      <ol className="mt-2 space-y-4">
        {quiz.map((q, i) => {
          const chosen = answers[i];
          const done = chosen !== undefined;
          return (
            <li key={q.question} className="rounded-xl border border-border bg-bg p-3">
              <p className="text-sm font-medium">
                {i + 1}. {q.question}
              </p>
              <div className="mt-2 grid gap-1.5">
                {q.options.map((option, j) => {
                  const isRight = j === q.correctIndex;
                  const state = !done ? "idle" : isRight ? "right" : j === chosen ? "wrong" : "idle";
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={done}
                      onClick={() => setAnswers((a) => ({ ...a, [i]: j }))}
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        state === "right"
                          ? "border-ready bg-ready/10"
                          : state === "wrong"
                            ? "border-failed bg-failed/10"
                            : "border-border hover:border-accent disabled:hover:border-border"
                      }`}
                    >
                      {option}
                      {state === "right" && <span className="sr-only"> (correct)</span>}
                      {state === "wrong" && <span className="sr-only"> (your answer, incorrect)</span>}
                    </button>
                  );
                })}
              </div>
              {done && (
                <div className="mt-2 text-sm">
                  <p className={chosen === q.correctIndex ? "text-ready" : "text-failed"}>
                    {chosen === q.correctIndex ? "Correct." : "Not quite."} <span className="text-fg">{q.explanation}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => onSeek(q.startS)}
                    className="mt-1.5 font-medium text-accent hover:underline"
                  >
                    ▶ Watch the explanation ({formatTime(q.startS)})
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      {finished && (
        <div key={round} className="rise mt-4 rounded-xl border border-accent/40 bg-accent/5 p-4" aria-live="polite">
          <p className="tabular text-2xl font-semibold">
            {correct}/{quiz.length}
          </p>
          <p className="text-sm text-muted">
            {correct === quiz.length
              ? "All correct. You've got this session."
              : `${missed.length} to review. The explanations are in the session itself.`}
          </p>
          {missedReel && (
            <div className="mt-3">
              <ReelButton
                url={missedReel.url}
                title={missedReel.clips > 1 ? "Watch what you missed" : "Watch the explanation you missed"}
                subtitle={`${missedReel.clips} explanation${missedReel.clips === 1 ? "" : "s"}, ${Math.round(missedReel.durationS)} s, stitched by Cloudinary`}
              />
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {missed.length > 0 && (
              <button type="button" onClick={() => retry(true)} className="rounded-lg bg-accent px-3 py-1.5 font-medium text-accent-fg">
                Retry the {missed.length} I missed
              </button>
            )}
            <button type="button" onClick={() => retry(false)} className="rounded-lg border border-border px-3 py-1.5 hover:border-accent">
              Start over
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
