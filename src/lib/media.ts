// Cloudinary delivery URLs. Pure functions — usable on server and client (cloud name is public).
// Every composition here was verified against real output in Phase 01 (docs/phases/PHASE-01-cloudinary-spike.md).

import type { TimedWord } from "@/lib/segments";

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const base = (cloud: string) => `https://res.cloudinary.com/${cloud}/video/upload`;
const sec = (t: number) => Math.max(0, Math.round(t * 10) / 10);

export const MOMENT_PAD_S = 1.5;
export const MOMENT_MAX_S = 60;
const CAPTION_MAX_WORDS = 4;
const CAPTION_MAX_S = 1.8;
const CAPTION_STYLE = "co_white,b_rgb:000000b3,w_660,c_fit";
const VERTICAL_CROP = "c_fill,ar_9:16,w_720,g_auto"; // g_auto must sit in its own component, not with so_/eo_

// Where a session's representative frame comes from: 10% in (past any title card), at most 30 s.
export function posterTime(durationS: number | null | undefined): number {
  return Math.min(30, (durationS ?? 50) * 0.1);
}

// A content-aware 16:9 frame at a moment: g_auto keeps the speaker/slide in frame instead of a blind centre crop.
export function thumbUrl(publicId: string, atS: number, cloud = CLOUD): string {
  return `${base(cloud)}/so_${sec(atS)},c_fill,ar_16:9,w_640,g_auto/f_auto,q_auto/${publicId}.jpg`;
}

// The clip window for a moment: padded so it doesn't start mid-word, clamped to the video, capped at 60 s
// (cost/abuse bound — a learner can't request a full-length derivative).
export function momentWindow(startS: number, endS: number, durationS?: number | null) {
  const start = Math.max(0, startS - MOMENT_PAD_S);
  let end = endS + MOMENT_PAD_S;
  if (durationS) end = Math.min(end, durationS);
  if (end - start > MOMENT_MAX_S) end = start + MOMENT_MAX_S;
  if (end <= start) end = start + 1;
  return { start: sec(start), end: sec(end) };
}

export type Caption = { text: string; from: number; to: number };

// Groups words into short caption cards (≤4 words / ≤1.8 s), timed relative to the clip start.
// Cloudinary's l_subtitles overlay times against the *trimmed* clip, so a mid-video Moment drifts —
// one timed l_text layer per card is exact by construction.
export function captionChunks(words: TimedWord[], clipStart: number, clipEnd: number): Caption[] {
  const inClip = words.filter((w) => w.e > clipStart && w.s < clipEnd);
  const chunks: Caption[] = [];
  let group: TimedWord[] = [];
  const flush = () => {
    if (!group.length) return;
    const from = sec(Math.max(0, group[0]!.s - clipStart));
    const next = Math.min(clipEnd, group.at(-1)!.e + 0.25) - clipStart;
    chunks.push({ text: group.map((w) => w.w).join(" "), from, to: Math.max(sec(next), from + 0.3) });
    group = [];
  };
  for (const w of inClip) {
    if (group.length && (group.length >= CAPTION_MAX_WORDS || w.e - group[0]!.s > CAPTION_MAX_S)) flush();
    group.push(w);
  }
  flush();
  // Cards never overlap: each ends when the next begins.
  for (let i = 0; i < chunks.length - 1; i++) chunks[i]!.to = Math.min(chunks[i]!.to, chunks[i + 1]!.from);
  return chunks.filter((c) => c.to > c.from);
}

// Cloudinary text layers need commas and slashes double-escaped (and % so it survives one decode).
export function encodeLayerText(text: string): string {
  return encodeURIComponent(text).replace(/%2C/g, "%252C").replace(/%2F/g, "%252F").replace(/%25(?!2[CF])/g, "%2525");
}

// A Moment is a URL, not a render job: Cloudinary trims, AI-crops to vertical (tracking the speaker),
// burns in timed captions and picks the best format/quality — generated on first request, then CDN-cached.
// The first request for an asset's g_auto crop returns 423 while Cloudinary analyses the video (see MomentButton).
export function momentUrl(
  publicId: string,
  startS: number,
  endS: number,
  { durationS, words = [], cloud = CLOUD }: { durationS?: number | null; words?: TimedWord[]; cloud?: string } = {},
): string {
  const { start, end } = momentWindow(startS, endS, durationS);
  const captions = captionChunks(words, start, end).map(
    (c) => `l_text:arial_46_bold:${encodeLayerText(c.text)},${CAPTION_STYLE}/fl_layer_apply,g_south,y_220,so_${c.from},eo_${c.to}`,
  );
  return [base(cloud), `so_${start},eo_${end}`, VERTICAL_CROP, ...captions, `f_auto:video,q_auto`, `${publicId}.mp4`].join("/");
}

// A tiny g_auto derivative whose only job is to start Cloudinary's tracking analysis at ingest time,
// so a learner's first Moment doesn't wait on it.
export function trackingWarmupUrl(publicId: string, cloud = CLOUD): string {
  return [base(cloud), "so_0,eo_1", VERTICAL_CROP.replace("w_720", "w_90"), "q_auto", `${publicId}.mp4`].join("/");
}

export const SHARE_CARD = { width: 1200, height: 630 } as const;
const CARD_TITLE_MAX = 90;

// A designed Open Graph image as one URL: the g_auto frame at the moment, faded at the top and bottom
// (the middle — usually the speaker — stays bright), the Pravaha mark, the title and a subtitle line.
// WhatsApp, LinkedIn and Slack previews come straight from Cloudinary; no image service of our own.
export function shareCardUrl(
  publicId: string,
  atS: number,
  { title, subtitle }: { title: string; subtitle?: string | null },
  cloud = CLOUD,
): string {
  const clipped = title.length > CARD_TITLE_MAX ? `${title.slice(0, CARD_TITLE_MAX - 1).trimEnd()}…` : title;
  const parts = [
    `so_${sec(atS)},c_fill,w_${SHARE_CARD.width},h_${SHARE_CARD.height},g_auto`,
    "e_gradient_fade:symmetric_pad,y_-0.5,b_black",
    `l_text:arial_30_bold:${encodeLayerText("Pravaha")},co_white,b_rgb:0f766e/fl_layer_apply,g_north_west,x_60,y_56`,
    `l_text:arial_60_bold:${encodeLayerText(clipped)},co_white,w_1080,c_fit/fl_layer_apply,g_south_west,x_60,y_130`,
  ];
  if (subtitle) {
    parts.push(`l_text:arial_34:${encodeLayerText(subtitle)},co_rgb:99f6e4/fl_layer_apply,g_south_west,x_60,y_70`);
  }
  return [base(cloud), ...parts, "f_jpg,q_auto", `${publicId}.jpg`].join("/");
}

// The same window in the original 16:9 framing — for inline playback of a citation.
export function clipUrl(publicId: string, startS: number, endS: number, cloud = CLOUD): string {
  const { start, end } = momentWindow(startS, endS);
  return `${base(cloud)}/so_${start},eo_${end}/f_auto:video,q_auto/${publicId}.mp4`;
}

export type ReelClip = { publicId: string; startS: number; endS: number; label?: string };

export const REEL_MAX_CLIPS = 5;
export const REEL_MAX_S = 90;
const REEL_FRAME = "w_1280,h_720,c_fill"; // every clip scaled to one frame size so sessions of any resolution splice cleanly
const REEL_LABEL = "co_white,b_rgb:0f766ecc";

// An Answer Reel: the cited moments — from any number of sessions — stitched into ONE video with
// Cloudinary's fl_splice, each clip labelled with its speaker. Verified on real output (Phase 12).
// Labels are timed on the final reel's timeline, so each appears exactly while its clip plays.
export function reelUrl(clips: ReelClip[], cloud = CLOUD): { url: string; durationS: number; clips: number } | null {
  const windows: (ReelClip & { start: number; end: number })[] = [];
  let total = 0;
  for (const clip of clips.slice(0, REEL_MAX_CLIPS)) {
    const { start, end } = momentWindow(clip.startS, clip.endS);
    if (total + (end - start) > REEL_MAX_S) break;
    windows.push({ ...clip, start, end });
    total += end - start;
  }
  const [first, ...rest] = windows;
  if (!first) return null;

  const parts = [`so_${first.start},eo_${first.end},${REEL_FRAME}`];
  for (const clip of rest) {
    parts.push(`l_video:${clip.publicId.replaceAll("/", ":")},fl_splice`, `so_${clip.start},eo_${clip.end},${REEL_FRAME}`, "fl_layer_apply");
  }
  let offset = 0;
  for (const clip of windows) {
    const length = sec(clip.end - clip.start);
    if (clip.label) {
      parts.push(
        `l_text:arial_34_bold:${encodeLayerText(clip.label)},${REEL_LABEL}`,
        `fl_layer_apply,g_north_west,x_40,y_40,so_${sec(offset)},eo_${sec(offset + length)}`,
      );
    }
    offset += length;
  }
  return {
    url: [base(cloud), ...parts, "f_auto:video,q_auto", `${first.publicId}.mp4`].join("/"),
    durationS: sec(offset),
    clips: windows.length,
  };
}

// What the Cloudinary Video Player requests for a session, as plain URLs, for "Cloudinary under the hood".
// They mirror the player's own requests (src/components/Player.tsx); the player builds the real ones.
export const STREAMING_PROFILE = "hd_lean";

export function playerUrls(publicId: string, cloud = CLOUD) {
  const raw = `https://res.cloudinary.com/${cloud}/raw/upload/${publicId}`;
  return {
    // Adaptive HLS: a master playlist over the profile's 720p / 360p / 180p renditions.
    stream: `${base(cloud)}/q_auto/sp_${STREAMING_PROFILE}/${publicId}.m3u8`,
    // Seek-bar thumbnails: one sprite of frames plus a VTT that maps time to tile.
    seekSprite: `${base(cloud)}/q_auto/sp_${STREAMING_PROFILE}/fl_sprite/${publicId}.vtt`,
    // The AI highlights graph above the seek bar.
    highlights: `${base(cloud)}/e_preview,fl_getinfo/${publicId}`,
    // Written by auto_transcription and auto_chaptering at upload.
    transcript: `${raw}.transcript`,
    chapters: `${raw}-chapters.vtt`,
  };
}
