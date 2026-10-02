"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { formatTime } from "@/lib/format";
import type { Lecture } from "@/lib/lectures";
import { posterTime, previewUrl, thumbUrl } from "@/lib/media";

// A library card that plays Cloudinary's AI preview of the session while hovered or focused. The video is
// only created on first hover (nothing loads for people who never hover), and never under reduced motion or
// data saver. If the preview can't play, the poster frame simply stays.
export function LibraryCard({ lecture, index }: { lecture: Lecture; index: number }) {
  const [active, setActive] = useState(false);
  const [shown, setShown] = useState(false);
  const [failed, setFailed] = useState(false);

  function start() {
    if (failed || !previewsAllowed()) return;
    setActive(true);
  }
  function stop() {
    setActive(false);
    setShown(false);
  }

  return (
    <li className="rise" style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}>
      <Link
        href={`/watch/${lecture.id}`}
        className="group block"
        onPointerEnter={(e) => e.pointerType === "mouse" && start()}
        onPointerLeave={stop}
        onFocus={start}
        onBlur={stop}
      >
        <div className="lift relative overflow-hidden rounded-2xl bg-border">
          <Image
            src={thumbUrl(lecture.publicId, posterTime(lecture.durationS))}
            alt=""
            width={640}
            height={360}
            unoptimized // Cloudinary already serves f_auto,q_auto
            className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          {active && (
            <video
              src={previewUrl(lecture.publicId)}
              muted
              autoPlay
              loop
              playsInline
              aria-hidden
              onPlaying={() => setShown(true)}
              onError={() => {
                setFailed(true);
                stop();
              }}
              className={`absolute inset-0 aspect-video w-full object-cover transition-opacity duration-300 ${shown ? "opacity-100" : "opacity-0"}`}
            />
          )}
          {shown && (
            <span className="absolute top-2 left-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">
              AI preview
            </span>
          )}
          {lecture.durationS ? (
            <span className="tabular absolute right-2 bottom-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs text-white">
              {formatTime(lecture.durationS)}
            </span>
          ) : null}
        </div>
        <h3 className="mt-3 font-medium group-hover:text-accent">{lecture.title}</h3>
        <p className="text-sm text-muted">{lecture.speaker ?? "Unknown speaker"}</p>
      </Link>
    </li>
  );
}

function previewsAllowed(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !connection?.saveData;
}
