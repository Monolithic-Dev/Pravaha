import Image from "next/image";
import Link from "next/link";

import { useLiteUrl } from "@/lib/data-saver";
import { formatTime } from "@/lib/format";
import type { SnippetPart } from "@/lib/highlight";
import { thumbUrl } from "@/lib/media";

export type ResultCardData = {
  lectureId: string;
  publicId: string;
  title: string;
  speaker: string | null;
  startS: number;
  chapterTitle: string | null;
  snippet: SnippetPart[];
};

export function Snippet({ parts }: { parts: SnippetPart[] }) {
  return (
    <>
      {parts.map((p, i) =>
        p.hit ? (
          <mark key={i} className="rounded bg-accent/15 px-0.5 font-semibold text-fg">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

export function ResultCard({ hit, children }: { hit: ResultCardData; children?: React.ReactNode }) {
  const lt = useLiteUrl();
  const href = `/watch/${hit.lectureId}?t=${Math.floor(hit.startS)}`;
  return (
    <article className="lift flex gap-4 rounded-2xl border border-border bg-surface p-3 sm:p-4">
      <Link href={href} className="relative block w-32 shrink-0 overflow-hidden rounded-xl sm:w-44">
        <Image
          src={lt(thumbUrl(hit.publicId, hit.startS))}
          alt={`${hit.title}, at ${formatTime(hit.startS)}`}
          width={320}
          height={180}
          unoptimized // Cloudinary already serves f_auto,q_auto
          className="aspect-video w-full bg-border object-cover"
        />
        <span className="tabular absolute right-1.5 bottom-1.5 rounded-md bg-black/75 px-1.5 py-0.5 text-xs text-white">
          {formatTime(hit.startS)}
        </span>
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={href} className="font-medium hover:text-accent">
          {hit.title}
        </Link>
        <p className="truncate text-sm text-muted">
          {hit.speaker ?? "Unknown speaker"}
          {hit.chapterTitle ? ` · ${hit.chapterTitle}` : ""}
        </p>
        <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed">
          “<Snippet parts={hit.snippet} />”
        </p>
        {children}
      </div>
    </article>
  );
}
