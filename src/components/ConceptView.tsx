"use client";

import Image from "next/image";
import Link from "next/link";

import { MomentButton } from "@/components/MomentButton";
import { ReelPlayer } from "@/components/ReelPlayer";
import type { ConceptView as Concept } from "@/lib/concepts";
import { formatTime } from "@/lib/format";
import { reelUrl, thumbUrl } from "@/lib/media";

const firstName = (speaker: string | null, title: string) => (speaker ?? title).split(",")[0]!.slice(0, 38);

// One concept, every teacher: the same idea explained in different voices, as one Cloudinary-stitched
// video (each clip labelled with who is speaking) and as cards that open the full session.
export function ConceptView({ concept }: { concept: Concept }) {
  const { moments } = concept;
  const reel = reelUrl(moments.map((m, i) => ({ publicId: m.publicId, startS: m.startS, endS: m.endS, label: `${i + 1} · ${firstName(m.speaker, m.title)}` })));
  const teachers = new Set(moments.map((m) => m.speaker ?? m.lectureId)).size;

  return (
    <div>
      {reel && moments.length > 1 && (
        <ReelPlayer
          url={reel.url}
          title={`Hear it from ${teachers} ${teachers === 1 ? "teacher" : "teachers"}, back to back`}
          subtitle={`${reel.clips} explanations of ${concept.name}, spliced by Cloudinary`}
          durationS={reel.durationS}
        />
      )}
      <ol className="mt-6 grid gap-4 sm:grid-cols-2">
        {moments.map((m, i) => (
          <li key={m.segmentId} className="flex flex-col rounded-2xl border border-border bg-surface p-3">
            <Link href={`/watch/${m.lectureId}?t=${Math.floor(m.startS)}`} className="relative block overflow-hidden rounded-xl">
              <Image
                src={thumbUrl(m.publicId, m.startS)}
                alt={`${m.title}, at ${formatTime(m.startS)}`}
                width={640}
                height={360}
                unoptimized
                className="aspect-video w-full bg-border object-cover"
              />
              <span className="absolute top-2 left-2 grid size-7 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-fg">{i + 1}</span>
              <span className="tabular absolute right-2 bottom-2 rounded bg-black/75 px-1.5 text-xs text-white">{formatTime(m.startS)}</span>
            </Link>
            <p className="mt-3 text-sm font-medium">{m.speaker ?? "Unknown speaker"}</p>
            <p className="truncate text-xs text-muted">{m.title}</p>
            <p className="mt-2 line-clamp-3 flex-1 text-sm">“{m.text}”</p>
            {m.related && <p className="mt-2 text-xs text-muted">Closest moment in this session: it teaches the idea without listing it as a key concept.</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/watch/${m.lectureId}?t=${Math.floor(m.startS)}`} className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:border-accent">
                Open full session
              </Link>
              <MomentButton
                lectureId={m.lectureId}
                publicId={m.publicId}
                title={m.title}
                startS={m.startS}
                endS={m.endS}
                durationS={m.durationS}
                words={m.words}
                segmentId={m.segmentId}
              />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
