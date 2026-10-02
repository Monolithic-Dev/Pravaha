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
        Upload a short clip with speech. In about a minute it has a transcript, chapters and an Ask box, and every answer plays
        the moment it came from. No account needed.
      </p>
      <div className="mt-8">
        {enabled ? (
          <TryFlow seconds={TRIAL_SECONDS} ttlHours={TRIAL_TTL_H} />
        ) : (
          <p className="rounded-2xl border border-border bg-surface p-6 text-muted">
            Trial uploads are switched off on this deployment.{" "}
            <Link href="/#library" className="text-accent hover:underline">
              Explore the library
            </Link>{" "}
            instead.
          </p>
        )}
      </div>
    </div>
  );
}
