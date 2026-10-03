"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { MomentButton } from "@/components/MomentButton";
import { formatTime } from "@/lib/format";
import { thumbUrl } from "@/lib/media";
import type { LearningPath } from "@/lib/paths";

// A Learning Path: the whole course as one Cloudinary-stitched video, then each step as a card that explains
// why it comes next and opens the full session at that second.
export function LearningPathView({ path }: { path: LearningPath }) {
  const sessions = new Set(path.steps.map((s) => s.lectureId)).size;
  const speakers = [...new Set(path.steps.map((s) => s.speaker).filter(Boolean))];

  return (
    <article className="rise mt-6 rounded-3xl border border-border bg-surface p-5 sm:p-6">
      <p className="text-sm font-semibold tracking-wide text-accent uppercase">Learning path</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight text-balance">{path.title}</h2>
      <p className="mt-1 text-sm text-muted">
        {path.steps.length} steps from {sessions} session{sessions === 1 ? "" : "s"}
        {speakers.length ? ` · ${speakers.slice(0, 3).join(", ")}` : ""}
        {path.reel ? (
          <>
            {" "}· <span className="tabular">{formatTime(path.reel.durationS)}</span> total
          </>
        ) : null}
      </p>

      {path.reel && <CourseReel url={path.reel.url} steps={path.steps.length} durationS={path.reel.durationS} />}

      <ol className="mt-6 space-y-4">
        {path.steps.map((step) => (
          <li key={step.segmentId} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-fg">{step.n}</span>
              {step.n < path.steps.length && <span aria-hidden className="mt-1 w-px flex-1 bg-border" />}
            </div>
            <div className="min-w-0 flex-1 pb-2">
              <h3 className="font-semibold">{step.stepTitle}</h3>
              <p className="mt-0.5 text-sm text-muted">{step.why}</p>
              <div className="mt-3 flex gap-3 rounded-2xl border border-border bg-bg p-3">
                <Link href={`/watch/${step.lectureId}?t=${Math.floor(step.startS)}`} className="relative block w-28 shrink-0 overflow-hidden rounded-xl sm:w-36">
                  <Image
                    src={thumbUrl(step.publicId, step.startS)}
                    alt={`${step.title}, at ${formatTime(step.startS)}`}
                    width={288}
                    height={162}
                    unoptimized
                    className="aspect-video w-full bg-border object-cover"
                  />
                  <span className="tabular absolute right-1 bottom-1 rounded bg-black/75 px-1 text-xs text-white">{formatTime(step.startS)}</span>
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{step.title}</p>
                  <p className="truncate text-xs text-muted">{step.speaker ?? "Unknown speaker"}</p>
                  <p className="mt-1 line-clamp-2 text-sm">“{step.text}”</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link
                      href={`/watch/${step.lectureId}?t=${Math.floor(step.startS)}`}
                      className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:border-accent"
                    >
                      Open full session
                    </Link>
                    <MomentButton
                      lectureId={step.lectureId}
                      publicId={step.publicId}
                      title={step.title}
                      startS={step.startS}
                      endS={step.endS}
                      durationS={step.durationS}
                      words={step.words}
                      segmentId={step.segmentId}
                    />
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}

function CourseReel({ url, steps, durationS }: { url: string; steps: number; durationS: number }) {
  const [playing, setPlaying] = useState(false);
  if (playing) return <video src={url} className="mt-5 aspect-video w-full rounded-2xl bg-black" controls autoPlay playsInline />;
  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="mt-5 flex w-full items-center gap-4 rounded-2xl border border-accent/40 bg-accent/10 p-4 text-left hover:bg-accent/15"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-accent-fg">▶</span>
      <span>
        <span className="block font-semibold">Play the whole course</span>
        <span className="text-sm text-muted">
          {steps} moments from different lectures, edited into one <span className="tabular">{formatTime(durationS)}</span> video by Cloudinary
        </span>
      </span>
    </button>
  );
}
