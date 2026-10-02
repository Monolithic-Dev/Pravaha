"use client";

import "next-cloudinary/dist/cld-video-player.css";

import { CldVideoPlayer } from "next-cloudinary";
import { useRef } from "react";

type Props = {
  publicId: string;
  startAt?: number;
  searchable: boolean;
  onTime?: (seconds: number) => void;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
};

export function Player({ publicId, startAt, searchable, onTime, videoRef }: Props) {
  const ownRef = useRef<HTMLVideoElement | null>(null);
  const ref = videoRef ?? ownRef;

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
        // sp_auto combined with a quality ("sp_auto transformation is not allowed"). full_hd is still an
        // adaptive ladder (1080p down to low renditions), and q_auto/sp_full_hd is accepted.
        transformation={{ streaming_profile: "full_hd" }}
        colors={{ accent: "#2dd4bf", base: "#0e1112", text: "#ecedea" }}
        seekThumbnails
        // Chapters and subtitles come from Cloudinary's auto_chaptering / auto_transcription outputs.
        // `chapters: true` makes the player load {public_id}-chapters.vtt (written by auto_chaptering, verified in Phase 01);
        // the option is typed as object in the SDK, hence the cast.
        {...(searchable
          ? {
              chapters: true as unknown as object,
              chaptersButton: true,
              aiHighlightsGraph: true,
              textTracks: { subtitles: { default: true, label: "Subtitles", maxWords: 8, wordHighlight: true } },
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
