"use client";

import { useMemo, useRef, useState } from "react";

import { MomentButton } from "@/components/MomentButton";
import { Player } from "@/components/Player";
import { SaveButton } from "@/components/SaveButton";
import { StudyPanel } from "@/components/StudyPanel";
import { formatTime } from "@/lib/format";
import type { SubtitleLanguage } from "@/lib/language";
import type { SegmentRow } from "@/lib/lectures";
import { recordProgress } from "@/lib/saved";
import type { StudyPack } from "@/lib/study-pack-schema";

type Props = {
  lectureId: string;
  publicId: string;
  title: string;
  durationS: number | null;
  startAt: number;
  searchable: boolean;
  subtitles: SubtitleLanguage[];
  segments: SegmentRow[];
  pack: StudyPack | null;
  // Title, speaker and status, rendered under the player in the same column (not below the whole grid).
  children?: React.ReactNode;
};

export function WatchView({ lectureId, publicId, title, durationS, startAt, searchable, subtitles, segments, pack, children }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSaved = useRef(startAt);
  const [time, setTime] = useState(startAt);
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState<"transcript" | "study">(pack ? "study" : "transcript");

  const currentIndex = useMemo(() => {
    let index = 0;
    for (let i = 0; i < segments.length; i++) if (segments[i]!.startS <= time) index = i;
    return index;
  }, [segments, time]);
  const current = segments[currentIndex];

  const visible = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return needle ? segments.filter((s) => s.text.toLowerCase().includes(needle)) : segments;
  }, [segments, filter]);

  function seek(seconds: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = seconds;
    video.play().catch(() => {});
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <Player
          publicId={publicId}
          startAt={startAt}
          searchable={searchable}
          subtitles={subtitles}
          videoRef={videoRef}
          onTime={(t) => {
            setTime((prev) => (Math.abs(prev - t) >= 0.5 ? t : prev));
            // "Continue watching" (this device only), written at most every 5 s of playback.
            if (durationS && Math.abs(t - lastSaved.current) >= 5) {
              lastSaved.current = t;
              recordProgress({ lectureId, publicId, title, t, durationS });
            }
          }}
        />
        {current && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <MomentButton
              lectureId={lectureId}
              publicId={publicId}
              title={title}
              startS={current.startS}
              endS={current.endS}
              durationS={durationS}
              words={current.words}
              segmentId={current.id}
              label="Share this moment"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg"
            />
            <SaveButton
              moment={{
                segmentId: current.id,
                lectureId,
                publicId,
                title,
                speaker: null,
                startS: current.startS,
                endS: current.endS,
                text: current.text,
              }}
            />
            <span className="text-sm text-muted">
              {current.chapterTitle ? `${current.chapterTitle} · ` : ""}
              <span className="tabular">{formatTime(current.startS)}</span>
            </span>
          </div>
        )}
        {children}
      </div>

      {segments.length > 0 && (
        <aside aria-label="Session tools" className="rounded-2xl border border-border bg-surface lg:max-h-[78vh] lg:overflow-hidden">
          {pack && (
            <div role="tablist" className="flex border-b border-border text-sm font-medium">
              {(["study", "transcript"] as const).map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={`flex-1 px-3 py-2.5 capitalize ${tab === t ? "border-b-2 border-accent text-fg" : "text-muted hover:text-fg"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
          {tab === "study" && pack ? (
            <div className="max-h-[60vh] overflow-y-auto lg:max-h-[calc(78vh-44px)]">
              <StudyPanel pack={pack} publicId={publicId} onSeek={seek} />
            </div>
          ) : (
          <>
          <div className="border-b border-border p-3">
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search this session…"
              aria-label="Search this session's transcript"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm"
            />
          </div>
          <ol className="max-h-[50vh] overflow-y-auto p-2 lg:max-h-[calc(70vh-60px)]">
            {visible.map((s) => {
              const active = s.id === current?.id;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => seek(s.startS)}
                    aria-current={active ? "true" : undefined}
                    className={`flex w-full gap-3 rounded-lg px-2 py-2 text-left text-sm ${
                      active ? "bg-accent/10" : "hover:bg-bg"
                    }`}
                  >
                    <span className="tabular shrink-0 pt-px text-xs text-accent">{formatTime(s.startS)}</span>
                    <span className={active ? "text-fg" : "text-muted"}>{s.text}</span>
                  </button>
                </li>
              );
            })}
            {visible.length === 0 && <li className="p-3 text-sm text-muted">Nothing in this session matches.</li>}
          </ol>
          </>
          )}
        </aside>
      )}
    </div>
  );
}
