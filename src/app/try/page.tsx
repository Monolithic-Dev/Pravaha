import type { Metadata } from "next";
import Link from "next/link";

import { TryFlow } from "@/components/TryFlow";
import { env } from "@/lib/env";
import { TRIAL_SECONDS, TRIAL_TTL_H } from "@/lib/trial-policy";

export const metadata: Metadata = {
  title: "Try it with your own video — Pravaha",
  description: `Upload a short video and ask it questions. Pravaha transcribes it with Cloudinary AI and answers with clips of the moments it came from.`,
};

export const dynamic = "force-dynamic";

export default function TryPage() {
  const enabled = env().TRIALS_PER_DAY > 0;
  return (
    <div className="mt-8">
      <p className="text-sm font-semibold tracking-wide text-accent uppercase">Try it</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Ask your own video a question</h1>
      <p className="mt-3 max-w-2xl text-muted">
        {enabled
          ? "Upload a short clip with speech. In about a minute it has a transcript, chapters and an Ask box, and every answer plays the moment it came from. No account needed."
          : "Any short clip with speech gets a transcript, chapters and an Ask box in about a minute, and every answer plays the moment it came from."}
      </p>
      <div className="mt-8">
        {enabled ? <TryFlow seconds={TRIAL_SECONDS} ttlHours={TRIAL_TTL_H} /> : <TrialsPaused seconds={TRIAL_SECONDS} />}
      </div>
    </div>
  );
}

// What a trial does, measured on a real 60-second upload (docs/API.md → Trials), shown while uploads are off.
const PIPELINE = [
  ["Upload", "Straight from the browser to Cloudinary with a signed preset."],
  ["Trim", "Cloudinary keeps the first 60 seconds, so a trial can't cost more."],
  ["Transcribe and chapter", "Cloudinary AI writes a word-timed transcript and chapters, then calls Pravaha's webhook."],
  ["Ask", "About 20 seconds after upload: a Study Pack, an AI preview and an Ask box with cited clips."],
];

// Trials run real Cloudinary AI on every upload, so a deployment on a free plan can pause them
// (TRIALS_PER_DAY=0). The page then shows what a trial does and where to see the same pipeline instead.
function TrialsPaused({ seconds }: { seconds: number }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <span className="rounded-full bg-processing/10 px-2.5 py-0.5 text-xs font-semibold text-processing">Uploads paused</span>
        <h2 className="mt-3 text-lg font-semibold">Trial uploads are paused on this demo</h2>
        <p className="mt-1 text-sm text-muted">
          Every trial runs Cloudinary&apos;s AI on the video (transcription, chapters, adaptive streaming, previews), and this
          demo runs on Cloudinary&apos;s free plan. Uploads are paused so the library keeps working for everyone. This is what
          happens to a {seconds}-second upload:
        </p>
        <ol className="mt-5 space-y-3 text-sm">
          {PIPELINE.map(([title, body], i) => (
            <li key={title} className="flex gap-3">
              <span className="tabular grid size-6 shrink-0 place-items-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
                {i + 1}
              </span>
              <span>
                <span className="font-medium">{title}</span>
                <span className="block text-muted">{body}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="space-y-3">
        <p className="text-sm font-medium">See the same pipeline on the library</p>
        <Link href="/#library" className="lift block rounded-2xl border border-border bg-surface p-4 hover:border-accent">
          <span className="font-medium">Open a session</span>
          <span className="block text-sm text-muted">
            Transcript, chapters, Study Pack and “Ask this session”, each built the same way.
          </span>
        </Link>
        <Link href="/studio" className="lift block rounded-2xl border border-border bg-surface p-4 hover:border-accent">
          <span className="font-medium">See the organizer Studio</span>
          <span className="block text-sm text-muted">Every session&apos;s pipeline output and live learner insights.</span>
        </Link>
        <Link href="/#q" className="lift block rounded-2xl border border-border bg-surface p-4 hover:border-accent">
          <span className="font-medium">Ask the library a question</span>
          <span className="block text-sm text-muted">Answers come only from the recordings, with a clip for every claim.</span>
        </Link>
      </div>
    </div>
  );
}
