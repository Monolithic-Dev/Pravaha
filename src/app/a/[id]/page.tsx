import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AnswerBody, type AskResponse } from "@/components/AskAnswer";
import { SearchBar } from "@/components/SearchBar";
import { getAnswer } from "@/lib/answers";
import { SHARE_CARD, shareCardUrl } from "@/lib/media";

type Props = { params: Promise<{ id: string }> };

// A shared answer: stored exactly as the asker saw it (src/lib/answers.ts), so the link is stable and
// opening it never re-runs the model. Its preview card is a Cloudinary URL over the first cited moment.
const summary = (data: AskResponse) => {
  const sessions = new Set(data.citations.map((c) => c.lectureId)).size;
  return `Answered from ${data.citations.length} moment${data.citations.length === 1 ? "" : "s"} in ${sessions} session${sessions === 1 ? "" : "s"}`;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const stored = await getAnswer((await params).id);
  if (!stored) return { title: "Answer not found — Pravaha" };
  const data = stored.result as AskResponse;
  const first = data.citations[0];
  const description = data.answer ? data.answer.replace(/\s*\[\d+\]/g, "").slice(0, 200) : summary(data);
  const image = first ? shareCardUrl(first.publicId, first.startS, { title: stored.question, subtitle: `${summary(data)} · Pravaha` }) : undefined;
  return {
    title: `${stored.question} — Pravaha`,
    description,
    robots: { index: false, follow: true },
    openGraph: {
      type: "article",
      siteName: "Pravaha",
      title: stored.question,
      description,
      url: `/a/${stored.id}`,
      images: image ? [{ url: image, ...SHARE_CARD, alt: stored.question }] : undefined,
    },
    twitter: { card: "summary_large_image", title: stored.question, description, images: image ? [image] : undefined },
  };
}

export default async function SharedAnswerPage({ params }: Props) {
  const stored = await getAnswer((await params).id);
  if (!stored) notFound();
  const data = stored.result as AskResponse;
  const asked = new Date(stored.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="mx-auto mt-6 max-w-3xl">
      <p className="rise text-sm text-muted">
        Shared answer · asked {asked} · {summary(data)}
      </p>
      <h1 className="rise mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-3xl" style={{ animationDelay: "60ms" }}>
        {stored.question}
      </h1>
      <section aria-label="Answer" className="rise mt-5 rounded-3xl border border-border bg-surface p-5 sm:p-6" style={{ animationDelay: "120ms" }}>
        <h2 className="text-sm font-semibold tracking-wide text-accent uppercase">Answer from the library</h2>
        <AnswerBody data={{ ...data, answerId: stored.id }} question={stored.question} />
      </section>
      <section aria-labelledby="ask-own" className="mt-10">
        <h2 id="ask-own" className="mb-3 font-semibold">
          Ask your own question
        </h2>
        <SearchBar />
      </section>
    </div>
  );
}
