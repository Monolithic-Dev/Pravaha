"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { MomentClip } from "@/components/MomentClip";
import { useLiteUrl } from "@/lib/data-saver";
import { formatTime } from "@/lib/format";
import { momentUrl } from "@/lib/media";
import { shareMoment, trackMoment } from "@/lib/moment-share";
import type { TimedWord } from "@/lib/segments";

type Props = {
  publicId: string;
  lectureId: string;
  title: string;
  startS: number;
  endS: number;
  segmentId: number;
  durationS?: number | null;
  words?: TimedWord[];
  label?: string;
  className?: string;
};

// "Share as Moment": a vertical, AI-cropped, subtitled clip of exactly this moment, shared as a link
// to its branded landing page. Native <dialog> + Web Share API — no modal or share library.
export function MomentButton({ publicId, lectureId, title, startS, endS, segmentId, durationS, words, label, className }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const lt = useLiteUrl();
  const url = lt(momentUrl(publicId, startS, endS, { durationS, words }));

  function show() {
    trackMoment(segmentId, "open");
    setCopied(false);
    setOpen(true); // mounting MomentClip is what starts Cloudinary generating the clip
    dialog.current?.showModal();
  }

  async function share() {
    if ((await shareMoment({ segmentId, title, startS })) === "copied") setCopied(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={show}
        className={className ?? "rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:border-accent"}
      >
        {label ?? "Share as Moment"}
      </button>
      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === dialog.current && dialog.current.close()}
        className="m-auto w-[min(92vw,380px)] rounded-3xl border border-border bg-surface p-4 text-fg backdrop:bg-black/60"
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">
            Moment · <span className="tabular">{formatTime(startS)}</span>
          </p>
          <button type="button" onClick={() => dialog.current?.close()} aria-label="Close" className="px-2 text-xl">
            ×
          </button>
        </div>
        <div className="mt-3">{open ? <MomentClip url={url} /> : <div className="aspect-[9/16] rounded-2xl bg-black" />}</div>
        <p className="mt-3 line-clamp-2 text-sm text-muted">{title}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={share} className="rounded-xl bg-accent px-3 py-2.5 font-medium text-accent-fg">
            {copied ? "Link copied" : "Share"}
          </button>
          <Link
            href={`/watch/${lectureId}?t=${Math.floor(startS)}`}
            className="rounded-xl border border-border px-3 py-2.5 text-center font-medium"
          >
            Full session
          </Link>
        </div>
      </dialog>
    </>
  );
}
