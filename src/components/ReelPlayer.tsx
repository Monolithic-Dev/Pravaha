"use client";

import { useState } from "react";

import { formatTime } from "@/lib/format";

// A Cloudinary-stitched reel behind a play button: the video loads only when the learner asks for it.
export function ReelPlayer({ url, title, subtitle, durationS }: { url: string; title: string; subtitle: string; durationS: number }) {
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
        <span className="block font-semibold">{title}</span>
        <span className="text-sm text-muted">
          {subtitle} · <span className="tabular">{formatTime(durationS)}</span>
        </span>
      </span>
    </button>
  );
}
