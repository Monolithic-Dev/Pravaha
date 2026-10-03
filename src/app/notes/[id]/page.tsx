import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NotesActions } from "@/components/NotesActions";
import { formatTime } from "@/lib/format";
import { posterTime, SHARE_CARD, shareCardUrl } from "@/lib/media";
import { notesToMarkdown } from "@/lib/notes";
import { loadNotes } from "@/lib/notes-data";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const loaded = await loadNotes((await params).id);
  if (!loaded) return { title: "Notes not found — Pravaha" };
  const { lecture, notes } = loaded;
  const image = shareCardUrl(lecture.publicId, posterTime(lecture.durationS), { title: notes.title, subtitle: "Study notes with timestamps" });
  const description = `Study notes for “${notes.title}”: summary, key concepts, chapters and a quiz, every point linked to its second.`;
  return {
    title: `Study notes: ${notes.title} — Pravaha`,
    description,
    robots: { index: false, follow: true },
    openGraph: {
      type: "article",
      siteName: "Pravaha",
      title: `Study notes: ${notes.title}`,
      description,
      url: `/notes/${lecture.id}`,
      images: [{ url: image, ...SHARE_CARD, alt: notes.title }],
    },
    twitter: { card: "summary_large_image", title: `Study notes: ${notes.title}`, images: [image] },
  };
}

// Relative links on the page; the Markdown export carries absolute ones.
const rel = (url: string) => url.replace(/^https?:\/\/[^/]+/, "");

export default async function NotesPage({ params }: Props) {
  const { id } = await params;
  const loaded = await loadNotes(id);
  if (!loaded) notFound();
  const { lecture, notes } = loaded;
  const stamp = (label: string, url: string) => (
    <Link
      href={rel(url)}
      className="tabular rounded bg-accent/10 px-1.5 py-0.5 text-xs font-semibold text-accent hover:bg-accent/20 print:bg-transparent print:px-0"
    >
      {label}
    </Link>
  );
  const h2 = "mt-8 text-sm font-semibold tracking-wide text-muted uppercase";
  const meta = [notes.speaker, notes.durationS ? formatTime(notes.durationS) : null].filter(Boolean).join(" · ");

  return (
    <article className="mx-auto mt-6 max-w-3xl">
      <p className="text-sm font-semibold tracking-wide text-accent uppercase print:hidden">Study notes</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-balance">{notes.title}</h1>
      <p className="mt-1 text-muted">
        {meta}
        {meta ? " · " : ""}
        <Link href={`/watch/${lecture.id}`} className="font-medium text-accent hover:underline">
          Watch the session
        </Link>
      </p>
      <NotesActions markdown={notesToMarkdown(notes)} downloadHref={`/api/lectures/${lecture.id}/notes?format=md&download=1`} />

      {notes.summary.length > 0 && (
        <section>
          <h2 className={h2}>In short</h2>
          <ul className="mt-2 space-y-1.5">
            {notes.summary.map((s) => (
              <li key={s} className="flex gap-2">
                <span aria-hidden className="text-accent">
                  •
                </span>
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}

      {notes.concepts.length > 0 && (
        <section>
          <h2 className={h2}>Key concepts</h2>
          <ul className="mt-2 space-y-1.5">
            {notes.concepts.map((c) => (
              <li key={`${c.name}-${c.t}`} className="flex items-center gap-2">
                <span className="font-medium">{c.name}</span>
                {stamp(c.label, c.url)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {notes.chapters.length > 0 && (
        <section>
          <h2 className={h2}>Chapters</h2>
          <ol className="mt-2 space-y-1.5">
            {notes.chapters.map((c) => (
              <li key={`${c.title}-${c.t}`} className="flex items-baseline gap-2">
                {stamp(c.label, c.url)}
                <span>{c.title}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {notes.quiz.length > 0 && (
        <section>
          <h2 className={h2}>Check yourself</h2>
          <ol className="mt-2 space-y-4">
            {notes.quiz.map((q, i) => (
              <li key={q.question} className="break-inside-avoid">
                <p className="font-medium">
                  {i + 1}. {q.question}
                </p>
                <p className="mt-1 text-sm">
                  <span className="font-semibold">Answer:</span> {q.answer}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted">
                  {q.explanation} {stamp(q.label, q.url)}
                </p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <p className="mt-10 text-xs text-muted">Made with Pravaha: ask your recordings, watch the answer.</p>
    </article>
  );
}
