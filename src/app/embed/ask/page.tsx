import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";

import { AskSession } from "@/components/AskSession";
import { EmbedFrame } from "@/components/EmbedFrame";
import { LogoMark } from "@/components/Logo";
import { getLecture, suggestedQuestions } from "@/lib/lectures";
import { getStudyPack } from "@/lib/study-packs";
import { pickSuggestions } from "@/lib/suggestions";

export const metadata: Metadata = {
  title: "Ask — Pravaha",
  description: "Ask the recordings a question; every answer plays the moment it came from.",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ session?: string }> };

// The Ask box an LMS or course page puts in an iframe: /embed/ask asks the published library,
// /embed/ask?session=<id> one session (unlisted ones too: the organizer chose to share it). This route alone
// may be framed (next.config.ts); the site header and footer are left out (SiteChrome).
export default async function EmbedAskPage({ searchParams }: Props) {
  const { session } = await searchParams;

  if (session === undefined) {
    const suggestions = await suggestedQuestions(3);
    return (
      <EmbedShell>
        <AskSession heading="Ask the library" suggestions={suggestions} />
      </EmbedShell>
    );
  }

  const lecture = z.uuid().safeParse(session).success ? await getLecture(session) : null;
  // Trials expire within a day, so an embed of one would break; they never get an embed.
  if (!lecture || lecture.status !== "ready" || lecture.trialExpiresAt) {
    return (
      <EmbedShell>
        <p className="mt-6 rounded-2xl border border-border bg-surface p-5 text-sm text-muted">
          This session isn&apos;t available to ask. It may still be processing or have been removed.
        </p>
      </EmbedShell>
    );
  }

  const pack = await getStudyPack(lecture.id);
  return (
    <EmbedShell>
      <p className="mt-4 truncate text-sm text-muted">
        <Link href={`/watch/${lecture.id}`} className="font-medium text-fg hover:text-accent">
          {lecture.title}
        </Link>
        {lecture.speaker ? ` · ${lecture.speaker}` : ""}
      </p>
      <AskSession lectureId={lecture.id} suggestions={pack ? pickSuggestions([pack], 3) : []} />
    </EmbedShell>
  );
}

function EmbedShell({ children }: { children: React.ReactNode }) {
  return (
    <EmbedFrame>
      <div className="pt-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight">
          <LogoMark className="size-5" />
          Pravaha
        </Link>
        {children}
        <p className="mt-6 text-xs text-muted">
          Answers come only from these recordings, with a clip for every claim ·{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-fg">
            Privacy
          </Link>
        </p>
      </div>
    </EmbedFrame>
  );
}
