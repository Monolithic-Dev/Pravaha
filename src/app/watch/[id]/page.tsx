import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { z } from "zod";

import { WatchView } from "@/components/WatchView";
import { formatTime } from "@/lib/format";
import { getLecture, getSegments } from "@/lib/lectures";
import { posterTime, SHARE_CARD, shareCardUrl } from "@/lib/media";
import { getStudyPack } from "@/lib/study-packs";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
};

// cache(): generateMetadata and the page share one query per request.
const load = cache(async (id: string) => (z.uuid().safeParse(id).success ? getLecture(id) : null));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lecture = await load((await params).id);
  if (!lecture) return { title: "Session not found — Pravaha" };

  const image = shareCardUrl(lecture.publicId, posterTime(lecture.durationS), {
    title: lecture.title,
    subtitle: [lecture.speaker, lecture.durationS ? formatTime(lecture.durationS) : null].filter(Boolean).join(" · "),
  });
  const listed = lecture.status === "ready" && lecture.visibility === "public";
  return {
    title: `${lecture.title} — Pravaha`,
    robots: listed ? undefined : { index: false, follow: false },
    openGraph: {
      type: "video.other",
      siteName: "Pravaha",
      title: lecture.title,
      url: `/watch/${lecture.id}`,
      images: [{ url: image, ...SHARE_CARD, alt: lecture.title }],
    },
    twitter: { card: "summary_large_image", title: lecture.title, images: [image] },
  };
}

export default async function WatchPage({ params, searchParams }: Props) {
  const [{ id }, { t }] = await Promise.all([params, searchParams]);
  const lecture = await load(id);
  if (!lecture) notFound();

  const startAt = Math.max(0, Number(t) || 0);
  const ready = lecture.status === "ready";
  const [segments, pack] = ready ? await Promise.all([getSegments(lecture.id), getStudyPack(lecture.id)]) : [[], null];

  return (
    <article className="mt-4">
      <WatchView
        lectureId={lecture.id}
        publicId={lecture.publicId}
        title={lecture.title}
        durationS={lecture.durationS}
        startAt={startAt}
        searchable={lecture.status === "ready"}
        segments={segments}
        pack={pack}
      >
        <header className="mt-5">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{lecture.title}</h1>
          <p className="mt-1 text-muted">
            {lecture.speaker ?? "Unknown speaker"}
            {lecture.durationS ? <span className="tabular"> · {formatTime(lecture.durationS)}</span> : null}
          </p>
        </header>
        {lecture.status === "processing" && (
          <p className="mt-4 rounded-xl border border-border bg-surface p-4 text-sm">
            Transcribing — search, chapters and subtitles are on their way. The video already plays.
          </p>
        )}
        {lecture.status === "transcript_failed" && (
          <p className="mt-4 rounded-xl border border-border bg-surface p-4 text-sm">
            We couldn&apos;t transcribe this session, so it isn&apos;t searchable. The video still plays.
          </p>
        )}
      </WatchView>
    </article>
  );
}
