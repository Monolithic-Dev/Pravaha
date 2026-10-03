"use client";

import "next-cloudinary/dist/cld-video-player.css";

import { CldVideoPlayer } from "next-cloudinary";
import { useRef, useSyncExternalStore } from "react";

import type { SubtitleLanguage } from "@/lib/language";
import { useDataSaver } from "@/lib/data-saver";
import { STREAMING_PROFILE, STREAMING_PROFILE_LITE } from "@/lib/media";

type Props = {
  publicId: string;
  startAt?: number;
  searchable: boolean;
  subtitles?: SubtitleLanguage[];
  onTime?: (seconds: number) => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
};

export function Player({ publicId, startAt, searchable, subtitles = [], onTime, videoRef }: Props) {
  const ownRef = useRef<HTMLVideoElement | null>(null);
  const ref = videoRef ?? ownRef;
  const lite = useDataSaver();
  // false on the server and during hydration: the player is created only once data saver is known, so a slow
  // connection never starts by requesting the full-quality ladder.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  if (!mounted) return <div className="aspect-video overflow-hidden rounded-2xl bg-black" />;

  return (
    <div className="overflow-hidden rounded-2xl bg-black">
      <CldVideoPlayer
        id={`player-${publicId.replace(/\W/g, "-")}`}
        src={publicId}
        width={1920}
        height={1080}
        videoRef={ref}
        // HLS: adaptive bitrate — quality drops on a weak connection instead of stalling.
        sourceTypes={["hls"]}
        // A named profile, not sp_auto: next-cloudinary always adds q_auto, and Cloudinary rejects
        // sp_auto combined with a quality ("sp_auto transformation is not allowed"). hd_lean is still an
        // adaptive ladder (720p, 360p, 180p) and costs about half of full_hd's six renditions in
        // transformation credits; 720p is plenty for lectures and slides (docs/COST.md).
        transformation={{ streaming_profile: lite ? STREAMING_PROFILE_LITE : STREAMING_PROFILE }}
        colors={{ accent: "#2dd4bf", base: "#0e1112", text: "#ecedea" }}
        // Data saver skips the seek-bar sprite and the highlights graph: two extra downloads.
        seekThumbnails={!lite}
        // Chapters and subtitles come from Cloudinary's auto_chaptering / auto_transcription outputs.
        // `chapters: true` makes the player load {public_id}-chapters.vtt (written by auto_chaptering, verified in Phase 01);
        // the option is typed as object in the SDK, hence the cast.
        {...(searchable
          ? {
              chapters: true as unknown as object,
              chaptersButton: true,
              aiHighlightsGraph: !lite,
              // English from auto_transcription, plus any translated tracks Cloudinary produced (src/lib/subtitles.ts).
              textTracks: {
                subtitles: [
                  { default: true, label: "English", maxWords: 8, wordHighlight: true },
                  ...subtitles.map((lang) => ({ label: lang.label, language: lang.code, maxWords: 8 })),
                ],
              },
            }
          : {})}
        onMetadataLoad={() => {
          const video = ref.current;
          if (!video) return;
          if (startAt && startAt > 0) video.currentTime = startAt;
          if (onTime) video.addEventListener("timeupdate", () => onTime(video.currentTime));
        }}
      />
    </div>
  );
}
