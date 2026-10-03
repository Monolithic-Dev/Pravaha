import type { Metadata } from "next";
import Link from "next/link";

import { UnderTheHood } from "@/components/UnderTheHood";
import { CAPABILITIES } from "@/lib/capabilities";
import { getConcept, listConcepts } from "@/lib/concepts";
import { conceptHoodItems, sessionHoodItems, type HoodItem } from "@/lib/hood-items";
import { getLecture, getSegments, listLectures } from "@/lib/lectures";
import { getStudyPack } from "@/lib/study-packs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "For judges — Pravaha",
  description: "How Pravaha uses Cloudinary, mapped to the hackathon's requirements, with live URLs and a 90-second test.",
};

const REQUIREMENTS: [string, string][] = [
  ["Cloudinary is an active part of the product", "Media in is raw video; transcripts, chapters, streams, clips, reels, cards and tags all come from Cloudinary. Without it there is no product."],
  ["Upload, manage, transform, optimize, search, deliver", "Signed upload · tags and context · Search API · splice, crop, caption, preview transformations · f_auto/q_auto · HLS delivery."],
  ["A live working demo", "This site. Six real NPTEL sessions, no login for learners."],
  ["Public repo with setup instructions", "github.com/Monolithic-Dev/Pravaha, SETUP.md."],
  ["It is monitored, and a real business", "/status shows live database, AI model and Cloudinary-credit health. The business case is in docs/BUSINESS.md and the README."],
  ["README: track, problem, Cloudinary usage, how to test", "Track 3 (Your Media-Savvy Startup); see the README."],
];

const STEPS: [string, string, string][] = [
  ["Ask", "Type: “What is the bias-variance trade-off?” The answer cites clips; open one. Try it in Hindi: “ओवरफिटिंग क्या है?”", "/"],
  ["Watch the answer", "Tap “Watch the answer”: moments from different lecturers as one Cloudinary-edited video.", "/"],
  ["Compare teachers", "Open the Overfitting concept: three lecturers, one video.", "/concepts/overfitting"],
  ["Build a course", "Ask for “Choosing a learning rate”: a 4-step course, one video.", "/learn?topic=Choosing%20a%20learning%20rate"],
  ["Share a Moment", "On any clip tap “Share as Moment”: vertical, speaker-tracked, captioned.", "/search?q=overfitting"],
  ["See the proof", "Open “Cloudinary under the hood” at the bottom of a session, answer or concept.", "/#library"],
];

export default async function JudgesPage() {
  const [lectures, concepts] = await Promise.all([listLectures({ includeAll: false }), listConcepts()]);
  const lecture = lectures[0] ? await getLecture(lectures[0].id) : null;
  const shared = concepts.find((c) => c.entries.length > 1);
  const [segments, pack, concept] = await Promise.all([
    lecture ? getSegments(lecture.id) : [],
    lecture ? getStudyPack(lecture.id) : null,
    shared ? getConcept(shared.key) : null,
  ]);
  const items: HoodItem[] = [
    ...(lecture && segments.length ? sessionHoodItems(lecture, segments, pack?.highlights) : []),
    ...(concept ? conceptHoodItems(concept.key, concept.moments) : []),
  ];

  return (
    <div className="mx-auto mt-6 max-w-4xl">
      <p className="text-sm font-semibold tracking-wide text-accent uppercase">Track 3 · Your Media-Savvy Startup</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Pravaha, for judges</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Pravaha turns lecture recordings into knowledge you can ask. Every answer is a clip of the teacher saying it, and the clip,
        the reel, the share card and the Hindi subtitles are all Cloudinary. This page maps that to the submission requirements.
      </p>

      <section className="mt-8" aria-labelledby="req">
        <h2 id="req" className="text-lg font-semibold">The requirements, and where they are met</h2>
        <dl className="mt-3 divide-y divide-border rounded-2xl border border-border bg-surface">
          {REQUIREMENTS.map(([need, met]) => (
            <div key={need} className="grid gap-1 p-4 sm:grid-cols-[1fr_2fr] sm:gap-4">
              <dt className="font-medium">{need}</dt>
              <dd className="text-sm text-muted">{met}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-8" aria-labelledby="test">
        <h2 id="test" className="text-lg font-semibold">Test it in 90 seconds</h2>
        <ol className="mt-3 space-y-2">
          {STEPS.map(([name, text, href], i) => (
            <li key={name} className="flex gap-3 rounded-2xl border border-border bg-surface p-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-fg">{i + 1}</span>
              <span className="text-sm">
                <Link href={href} className="font-medium text-accent hover:underline">{name}</Link>
                <span className="text-muted"> · {text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8" aria-labelledby="caps">
        <h2 id="caps" className="text-lg font-semibold">{CAPABILITIES.length} Cloudinary capabilities in use</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {CAPABILITIES.map((c) => (
            <li key={c.name} className="rounded-2xl border border-border bg-surface p-4">
              <p className="font-medium">{c.name}</p>
              <p className="mt-1 text-sm text-muted">{c.does}</p>
              <p className="mt-2 text-xs text-muted">
                See it: <span className="text-fg">{c.see}</span> · <code className="font-mono">{c.code}</code>
              </p>
            </li>
          ))}
        </ul>
      </section>

      {items.length > 0 && (
        <section className="mt-8" aria-labelledby="live">
          <h2 id="live" className="text-lg font-semibold">Live Cloudinary URLs</h2>
          <p className="mt-1 text-sm text-muted">Generated from the real library right now. Open any of them.</p>
          <UnderTheHood items={items} title="The URLs behind this library" />
        </section>
      )}
    </div>
  );
}
