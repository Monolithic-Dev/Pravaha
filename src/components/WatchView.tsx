"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { MomentButton } from "@/components/MomentButton";
import { Player } from "@/components/Player";
import { SaveButton } from "@/components/SaveButton";
import { StudyPanel } from "@/components/StudyPanel";
import { chaptersFromSegments } from "@/lib/chapters";
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
  const chapters = useMemo(() => chaptersFromSegments(segments), [segments]);
  // Study when there is a Study Pack, chapters when Cloudinary found more than one, the transcript always.
  const tabs = [...(pack ? (["study"] as const) : []), ...(chapters.length > 1 ? (["chapters"] as const) : []), "transcript" as const];
  type Tab = (typeof tabs)[number];
  const [tab, setTab] = useState<Tab>(tabs[0] ?? "transcript");
  // Follow along: the transcript keeps the line being spoken in view, until the learner scrolls it themselves.
  const [following, setFollowing] = useState(true);
  const listRef = useRef<HTMLOListElement | null>(null);

  const currentIndex = useMemo(() => {
    let index = 0;
    for (let i = 0; i < segments.length; i++) if (segments[i]!.startS <= time) index = i;
    return index;
  }, [segments, time]);
  const current = segments[currentIndex];
  const currentChapter = useMemo(() => {
    let index = -1;
    for (let i = 0; i < chapters.length; i++) if (chapters[i]!.startS <= time) index = i;
    return index;
  }, [chapters, time]);

  // Scrolls only the transcript list (never the page), keeping the current line a third of the way down.
  useEffect(() => {
    const list = listRef.current;
    if (!list || !following || filter || current === undefined) return;
    const line = list.querySelector<HTMLElement>(`[data-segment="${current.id}"]`);
    if (!line) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollTo({ top: line.offsetTop - list.clientHeight / 3, behavior: reduced ? "auto" : "smooth" });
  }, [current, following, filter, tab]);

  const visible = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return needle ? segments.filter((s) => s.text.toLowerCase().includes(needle)) : segments;
  }, [segments, filter]);

  function seek(seconds: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = seconds;
    video.play().catch(() => {});
    setFollowing(true); // jumping to a line or chapter means "follow from here"
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
          {tabs.length > 1 && (
            <div role="tablist" className="flex border-b border-border text-sm font-medium">
              {tabs.map((t) => (
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
          ) : tab === "chapters" ? (
            <ol className="max-h-[60vh] space-y-1 overflow-y-auto p-2 lg:max-h-[calc(78vh-44px)]">
              {chapters.map((c, i) => {
                const active = i === currentChapter;
                const progress = active ? Math.min(1, Math.max(0, (time - c.startS) / (c.endS - c.startS))) : 0;
                return (
                  <li key={c.startS}>
                    <button
                      type="button"
                      onClick={() => seek(c.startS)}
                      aria-current={active ? "true" : undefined}
                      className={`w-full rounded-lg px-3 py-2.5 text-left text-sm ${active ? "bg-accent/10" : "hover:bg-bg"}`}
                    >
                      <span className="flex items-baseline gap-3">
                        <span className="tabular shrink-0 text-xs text-accent">{formatTime(c.startS)}</span>
                        <span className={active ? "font-medium" : "text-muted"}>{c.title}</span>
                      </span>
                      {active && (
                        <span aria-hidden className="mt-2 block h-1 overflow-hidden rounded-full bg-border">
                          <span className="block h-full bg-accent" style={{ width: `${progress * 100}%` }} />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
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
              <div className="relative">
                <ol
                  ref={listRef}
                  onWheel={() => setFollowing(false)}
                  onTouchMove={() => setFollowing(false)}
                  className="relative max-h-[50vh] overflow-y-auto p-2 lg:max-h-[calc(70vh-60px)]"
                >
                  {visible.map((s) => {
                    const active = s.id === current?.id;
                    return (
                      <li key={s.id} data-segment={s.id}>
                        <button
                          type="button"
                          onClick={() => seek(s.startS)}
                          aria-current={active ? "true" : undefined}
                          className={`flex w-full gap-3 rounded-lg border-l-2 px-2 py-2 text-left text-sm transition-colors ${
                            active ? "border-accent bg-accent/10" : "border-transparent hover:bg-bg"
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
                {!following && !filter && (
                  <button
                    type="button"
                    onClick={() => setFollowing(true)}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg shadow-lg"
                  >
                    ↓ Follow along
                  </button>
                )}
              </div>
            </>
          )}
        </aside>
      )}
    </div>
  );
}
