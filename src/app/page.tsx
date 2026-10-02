import Link from "next/link";

import { LibraryGrid } from "@/components/LibraryGrid";
import { SearchBar } from "@/components/SearchBar";
import { listLectures, popularTopics, type Lecture } from "@/lib/lectures";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";

async function loadLibrary(): Promise<{ lectures: Lecture[]; topics: string[] }> {
  try {
    const [lectures, topics] = await Promise.all([listLectures({ includeAll: false }), popularTopics()]);
    return { lectures, topics };
  } catch (error) {
    // The hero and search still render if the database is unreachable.
    log("home.library_failed", { error: error instanceof Error ? error.message : String(error) });
    return { lectures: [], topics: [] };
  }
}

export default async function Home() {
  const { lectures, topics } = await loadLibrary();

  return (
    <>
      <section className="pt-12 pb-10 sm:pt-20">
        <p className="rise inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
          <span className="size-1.5 rounded-full bg-accent" />
          {lectures.length} sessions · every answer is a clip
        </p>
        <h1 className="rise mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl" style={{ animationDelay: "60ms" }}>
          Ask your recordings.
          <br />
          <span className="text-accent">Watch the answer.</span>
        </h1>
        <p className="rise mt-5 max-w-xl text-lg text-muted" style={{ animationDelay: "120ms" }}>
          Every lecture and talk in this library — searchable by what was said, answerable in plain language, with
          every answer a clip of the moment it came from.
        </p>
        <div className="rise mt-8 max-w-2xl" style={{ animationDelay: "180ms" }}>
          <SearchBar />
          {topics.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted">Try:</span>
              {topics.map((t) => (
                <Link
                  key={t}
                  href={`/search?q=${encodeURIComponent(t)}`}
                  className="lift rounded-full border border-border bg-surface px-3 py-1 hover:border-accent"
                >
                  {t}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <HowItWorks />

      <section id="library" aria-labelledby="library-heading" className="scroll-mt-20">
        <h2 id="library-heading" className="mb-4 text-lg font-semibold">
          Library <span className="font-normal text-muted">· {lectures.length} sessions</span>
        </h2>
        <LibraryGrid lectures={lectures} />
      </section>
    </>
  );
}

const STEPS = [
  {
    title: "Upload a recording",
    body: "Cloudinary transcribes it word by word, chapters it with AI and streams it adaptively. No editing.",
    icon: "M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2",
  },
  {
    title: "Ask in plain language",
    body: "Answers come only from your library, and every claim is a clip of the moment it was said.",
    icon: "M8 10h8M8 14h5m-9 6l3-3h10a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14z",
  },
  {
    title: "Share the moment",
    body: "One tap makes a vertical, speaker-tracked, subtitled clip, built by Cloudinary as a URL.",
    icon: "M8.7 13.3l6.6 3.4m0-9.4l-6.6 3.4M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zm12 7a3 3 0 100-6 3 3 0 000 6z",
  },
];

function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="mb-12">
      <h2 id="how-heading" className="sr-only">
        How it works
      </h2>
      <ol className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className="rise lift rounded-2xl border border-border bg-surface p-5"
            style={{ animationDelay: `${240 + i * 80}ms` }}
          >
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-accent/10 text-accent">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={step.icon} />
                </svg>
              </span>
              <span className="tabular text-xs font-semibold text-muted">0{i + 1}</span>
            </div>
            <h3 className="mt-3 font-semibold">{step.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
