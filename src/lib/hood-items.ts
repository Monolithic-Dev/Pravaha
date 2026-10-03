import { formatTime } from "@/lib/format";
import { clipUrl, momentUrl, playerUrls, posterTime, reelUrl, shareCardUrl, thumbUrl } from "@/lib/media";
import type { TimedWord } from "@/lib/segments";

// The Cloudinary URLs behind a page, for the "Cloudinary under the hood" panel (src/components/UnderTheHood.tsx).
// Built with the same functions the page uses, so what the panel shows is what the page loads.

export type HoodItem = { title: string; what: string; url: string };

type Session = { publicId: string; title: string; speaker: string | null; durationS: number | null };
type Moment = { startS: number; endS: number; words: TimedWord[]; chapterTitle?: string | null };
type Highlight = { startS: number; endS: number; label: string | null };

export function sessionHoodItems(session: Session, moments: Moment[], highlights: Highlight[] = []): HoodItem[] {
  const { publicId, durationS } = session;
  const player = playerUrls(publicId);
  // A representative moment for the Moment example: a little way in, past any title card.
  const sample = moments[Math.min(2, moments.length - 1)];
  const reel = reelUrl(highlights.map((h) => ({ publicId, startS: h.startS, endS: h.endS, label: h.label ?? undefined })));
  const items: HoodItem[] = [
    {
      title: "Adaptive streaming",
      what: "The player's HLS stream: Cloudinary encodes a ladder of renditions on demand and the player switches with the connection.",
      url: player.stream,
    },
    {
      title: "Transcript (auto_transcription)",
      what: "Word-timed transcript written by Cloudinary at upload. Pravaha indexes it for Find and Ask and uses it for subtitles.",
      url: player.transcript,
    },
  ];
  if (moments.some((m) => m.chapterTitle)) {
    items.push({
      title: "Chapters (auto_chaptering)",
      what: "AI chapters written at upload, shown as marks on the seek bar.",
      url: player.chapters,
    });
  }
  items.push(
    {
      title: "Seek-bar previews",
      what: "One sprite of frames for the thumbnails you see while scrubbing.",
      url: player.seekSprite,
    },
    {
      title: "AI highlights graph",
      what: "Cloudinary's AI rates which parts are most interesting; the player draws it above the seek bar.",
      url: player.highlights,
    },
    {
      title: "Poster frame",
      what: "A frame 10% in, cropped to 16:9 around the speaker by AI, in the best format for your device.",
      url: thumbUrl(publicId, posterTime(durationS)),
    },
    {
      title: "Link preview card",
      what: "The image WhatsApp, LinkedIn and Slack show for this page: a frame, a fade and text layers, all in one URL.",
      url: shareCardUrl(publicId, posterTime(durationS), {
        title: session.title,
        subtitle: [session.speaker, durationS ? formatTime(durationS) : null].filter(Boolean).join(" · "),
      }),
    },
  );
  if (sample) {
    items.push({
      title: "A Moment (vertical short)",
      what: `What "Share this moment" makes at ${formatTime(sample.startS)}: trimmed, cropped to 9:16 following the speaker, with word-timed captions burned in. The first open can take a few seconds while Cloudinary analyses the video.`,
      url: momentUrl(publicId, sample.startS, sample.endS, { durationS, words: sample.words }),
    });
  }
  if (reel) {
    items.push({
      title: "Session in 60 seconds",
      what: `The Study Pack's highlight reel: ${reel.clips} AI-picked moments stitched into one labelled video with fl_splice.`,
      url: reel.url,
    });
  }
  return items;
}

type Cited = {
  n: number;
  publicId: string;
  title: string;
  startS: number;
  endS: number;
  durationS: number | null;
  words: TimedWord[];
};

export function answerHoodItems(citations: Cited[], reel: { url: string; clips: number } | null | undefined): HoodItem[] {
  const first = citations[0];
  const items: HoodItem[] = [];
  if (reel && reel.clips > 1) {
    const sessions = new Set(citations.map((c) => c.publicId)).size;
    items.push({
      title: "Answer Reel",
      what: `The ${reel.clips} cited moments${sessions > 1 ? ` from ${sessions} sessions` : ""} stitched into one video with fl_splice, each labelled with its speaker.`,
      url: reel.url,
    });
  }
  if (first) {
    items.push(
      {
        title: `Source clip [${first.n}]`,
        what: `The cited moment from “${first.title}”, cut from the full recording by start and end offsets. Nothing is stored twice.`,
        url: clipUrl(first.publicId, first.startS, first.endS),
      },
      {
        title: `Source thumbnail [${first.n}]`,
        what: "The frame at that moment, cropped around the speaker by AI.",
        url: thumbUrl(first.publicId, first.startS),
      },
      {
        title: `Moment from source [${first.n}]`,
        what: "The vertical, captioned short that “Share as Moment” makes from it.",
        url: momentUrl(first.publicId, first.startS, first.endS, { durationS: first.durationS, words: first.words }),
      },
    );
  }
  return items;
}

type ConceptMoment = { publicId: string; speaker: string | null; title: string; startS: number; endS: number };

export function conceptHoodItems(key: string, moments: ConceptMoment[]): HoodItem[] {
  const label = (m: ConceptMoment, i: number) => `${i + 1} · ${(m.speaker ?? m.title).split(",")[0]}`;
  const reel = reelUrl(moments.map((m, i) => ({ publicId: m.publicId, startS: m.startS, endS: m.endS, label: label(m, i) })));
  const items: HoodItem[] = [];
  if (reel && reel.clips > 1) {
    items.push({
      title: "Compare reel",
      what: `${reel.clips} explanations of this concept, from different sessions, spliced into one video with fl_splice. Each clip is labelled with its speaker.`,
      url: reel.url,
    });
  }
  const first = moments[0];
  if (first) {
    items.push({
      title: "Explanation thumbnail",
      what: "The frame at that moment, cropped around the speaker by AI.",
      url: thumbUrl(first.publicId, first.startS),
    });
  }
  return items;
}
