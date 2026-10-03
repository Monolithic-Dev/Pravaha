"use client";

import Link from "next/link";

import { ReelPlayer } from "@/components/ReelPlayer";
import { formatTime } from "@/lib/format";
import { reelUrl } from "@/lib/media";
import { removeWeakSpot, useWeakSpots } from "@/lib/saved";
import { weakSpotClips } from "@/lib/weak-spots";

// Weak spots: every quiz question you got wrong, with the answer, the teacher's explanation and one reel that
// replays exactly those explanations, from any sessions. A question leaves the list when you answer it right.
export function WeakSpots() {
  const spots = useWeakSpots();
  const reel = reelUrl(weakSpotClips(spots));

  if (spots.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
        Quiz questions you get wrong collect here, with a video of exactly what to relearn. Try a session&apos;s{" "}
        <Link href="/#library" className="font-medium text-accent hover:underline">
          Check yourself
        </Link>{" "}
        quiz.
      </p>
    );
  }

  return (
    <div>
      {reel && (
        <ReelPlayer
          url={reel.url}
          title="Play my weak-spot reel"
          subtitle={`The teacher's explanation for ${reel.clips} ${reel.clips === 1 ? "question" : "questions"} you missed, edited into one video`}
          durationS={reel.durationS}
        />
      )}
      <ul className="mt-5 space-y-3">
        {spots.map((s) => (
          <li key={s.key} className="rounded-2xl border border-border bg-surface p-4">
            <p className="font-medium">{s.question}</p>
            <p className="mt-1.5 text-sm">
              <span className="font-semibold text-ready">Answer:</span> {s.answer}
            </p>
            <p className="mt-1 text-sm text-muted">{s.explanation}</p>
            <p className="mt-1 text-xs text-muted">{s.title}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <Link href={`/watch/${s.lectureId}?t=${Math.floor(s.startS)}`} className="font-medium text-accent hover:underline">
                ▶ Watch the explanation ({formatTime(s.startS)})
              </Link>
              <button type="button" onClick={() => removeWeakSpot(s.key)} className="text-muted hover:text-fg">
                I&apos;ve got this
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
