"use client";

import Image from "next/image";
import Link from "next/link";

import { useLiteUrl } from "@/lib/data-saver";
import { formatTime } from "@/lib/format";
import { thumbUrl } from "@/lib/media";
import { clearSaved, toggleSavedMoment, useRecentQuestions, useSavedMoments, useWatchProgress } from "@/lib/saved";

// The learner's Saved page: everything here lives on this device (src/lib/saved.ts).
export function SavedView() {
  const lt = useLiteUrl();
  const moments = useSavedMoments();
  const questions = useRecentQuestions();
  const progress = useWatchProgress();

  return (
    <div className="space-y-10">
      <Section title="Continue watching" count={progress.length} onClear={() => clearSaved("progress")}>
        {progress.length === 0 ? (
          <Empty>Sessions you start watching appear here, so you can pick up where you stopped.</Empty>
        ) : (
          <ContinueWatchingRow items={progress} />
        )}
      </Section>

      <Section title="Saved moments" count={moments.length} onClear={() => clearSaved("moments")}>
        {moments.length === 0 ? (
          <Empty>Tap Save on any answer clip or search result to keep the moment here.</Empty>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {moments.map((m, i) => (
              <li key={m.segmentId} className="rise lift rounded-2xl border border-border bg-surface p-3" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
                <Link href={`/watch/${m.lectureId}?t=${Math.floor(m.startS)}`} className="group block">
                  <div className="relative overflow-hidden rounded-xl bg-border">
                    <Image src={lt(thumbUrl(m.publicId, m.startS))} alt="" width={640} height={360} unoptimized className="aspect-video w-full object-cover" />
                    <span className="tabular absolute right-2 bottom-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs text-white">{formatTime(m.startS)}</span>
                  </div>
                  <p className="mt-2.5 font-medium group-hover:text-accent">{m.title}</p>
                </Link>
                <p className="text-sm text-muted">{m.speaker ?? "Unknown speaker"}</p>
                <p className="mt-1.5 line-clamp-3 text-sm">“{m.text}”</p>
                <button type="button" onClick={() => toggleSavedMoment(m)} className="mt-2 text-sm text-muted hover:text-failed">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Recent questions" count={questions.length} onClear={() => clearSaved("questions")}>
        {questions.length === 0 ? (
          <Empty>Questions you ask are listed here, with a link to each answer.</Empty>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {questions.map((q) => (
              <li key={q.at} className="flex items-center justify-between gap-3 px-4 py-3">
                <Link href={q.answerId ? `/a/${q.answerId}` : `/search?q=${encodeURIComponent(q.question)}`} className="min-w-0 truncate hover:text-accent">
                  {q.question}
                </Link>
                <span className="shrink-0 text-xs text-muted">{new Date(q.at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <p className="text-xs text-muted">Saved items stay on this device only. Nothing here is sent to Pravaha.</p>
    </div>
  );
}

export function ContinueWatchingRow({ items }: { items: ReturnType<typeof useWatchProgress> }) {
  const lt = useLiteUrl();
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p, i) => (
        <li key={p.lectureId} className="rise" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
          <Link href={`/watch/${p.lectureId}?t=${Math.floor(p.t)}`} className="group block">
            <div className="lift relative overflow-hidden rounded-2xl bg-border">
              <Image src={lt(thumbUrl(p.publicId, p.t))} alt="" width={640} height={360} unoptimized className="aspect-video w-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 h-1 bg-black/40">
                <span className="block h-full bg-accent" style={{ width: `${Math.min(100, (p.t / p.durationS) * 100)}%` }} />
              </span>
            </div>
            <p className="mt-2.5 font-medium group-hover:text-accent">{p.title}</p>
            <p className="tabular text-sm text-muted">
              {formatTime(p.t)} of {formatTime(p.durationS)}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Section({ title, count, onClear, children }: { title: string; count: number; onClear: () => void; children: React.ReactNode }) {
  return (
    <section aria-label={title}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {title} {count > 0 && <span className="font-normal text-muted">· {count}</span>}
        </h2>
        {count > 0 && (
          <button type="button" onClick={onClear} className="text-sm text-muted hover:text-fg">
            Clear
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">{children}</p>;
}
