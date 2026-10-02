import Link from "next/link";

import { ContinueWatching } from "@/components/ContinueWatching";
import { HeroDemo } from "@/components/HeroDemo";
import { Landing } from "@/components/Landing";
import { LibraryGrid } from "@/components/LibraryGrid";
import { SearchBar } from "@/components/SearchBar";
import { listLectures, suggestedQuestions, type Lecture } from "@/lib/lectures";
import { log } from "@/lib/log";
import { posterTime, thumbUrl } from "@/lib/media";

export const dynamic = "force-dynamic";

async function loadLibrary(): Promise<{ lectures: Lecture[]; suggestions: string[] }> {
  try {
    const [lectures, suggestions] = await Promise.all([listLectures({ includeAll: false }), suggestedQuestions()]);
    return { lectures, suggestions };
  } catch (error) {
    // The hero and search still render if the database is unreachable.
    log("home.library_failed", { error: error instanceof Error ? error.message : String(error) });
    return { lectures: [], suggestions: [] };
  }
}

export default async function Home() {
  const { lectures, suggestions } = await loadLibrary();
  const speakers = new Set(lectures.map((l) => l.speaker).filter(Boolean)).size;
  const demoClips = lectures.slice(0, 3).map((l) => ({
    title: l.title,
    speaker: l.speaker,
    thumb: thumbUrl(l.publicId, posterTime(l.durationS)),
  }));

  return (
    <>
      <section className="relative isolate pt-12 pb-12 sm:pt-20 lg:pb-16">
        <Waves />
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="rise inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:animate-none" />
                <span className="relative size-1.5 rounded-full bg-accent" />
              </span>
              {lectures.length} sessions{speakers > 1 ? ` · ${speakers} speakers` : ""} · every answer is a clip
            </p>
            <h1 className="rise mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-5xl xl:text-[3.4rem]" style={{ animationDelay: "60ms" }}>
              Ask your recordings.
              <br />
              <span className="bg-gradient-to-r from-accent to-[color-mix(in_srgb,var(--accent)_55%,var(--fg))] bg-clip-text text-transparent">
                Watch the answer.
              </span>
            </h1>
            <p className="rise mt-5 max-w-xl text-lg text-muted" style={{ animationDelay: "120ms" }}>
              Every lecture and talk in this library — searchable by what was said, answerable in plain language, with
              every answer a clip of the moment it came from.
            </p>
            <div className="rise mt-8 max-w-2xl" style={{ animationDelay: "180ms" }}>
              <SearchBar />
              {suggestions.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted">Try:</span>
                  {suggestions.map((q) => (
                    <Link
                      key={q}
                      href={`/search?q=${encodeURIComponent(q)}`}
                      className="lift rounded-full border border-border bg-surface px-3 py-1 hover:border-accent"
                    >
                      {q}
                    </Link>
                  ))}
                </div>
              )}
              <p className="mt-4 text-sm text-muted">
                Have a lecture of your own?{" "}
                <Link href="/try" className="font-medium text-accent hover:underline">
                  Ask your own video →
                </Link>
              </p>
            </div>
          </div>
          <div className="rise hidden lg:block" style={{ animationDelay: "240ms" }}>
            <HeroDemo clips={demoClips} />
          </div>
        </div>
      </section>

      <ContinueWatching />

      <HowItWorks />

      <section id="library" aria-labelledby="library-heading" className="scroll-mt-20">
        <h2 id="library-heading" className="mb-4 text-lg font-semibold">
          Library <span className="font-normal text-muted">· {lectures.length} sessions</span>
        </h2>
        <LibraryGrid lectures={lectures} />
      </section>

      <Landing />
    </>
  );
}

// Two slow, overlapping waves behind the hero: the logo's "flow" (प्रवाह). Each path holds two identical
// periods, so sliding it by half its width loops seamlessly. Decorative; still under reduced motion.
const WAVE = "M0 60 C150 20 250 20 400 60 S650 100 800 60 S1050 20 1200 60 S1450 100 1600 60";

function Waves() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-[-50vw] top-0 -z-10 h-full overflow-hidden [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
    >
      <div className="absolute inset-x-0 top-24 h-[28rem] bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--accent)_12%,transparent),transparent_65%)]" />
      <svg viewBox="0 0 1600 120" preserveAspectRatio="none" className="drift absolute top-28 left-0 h-40 w-[200%] text-accent opacity-25">
        <path d={WAVE} fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <svg viewBox="0 0 1600 120" preserveAspectRatio="none" className="drift-slow absolute top-40 left-0 h-48 w-[200%] text-accent opacity-15">
        <path d={WAVE} fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    </div>
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
