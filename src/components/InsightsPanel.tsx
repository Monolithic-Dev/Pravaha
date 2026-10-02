"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { formatTime } from "@/lib/format";
import type { Insights } from "@/lib/insights";

export function InsightsPanel() {
  const [data, setData] = useState<Insights | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/insights", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  if (failed) return <p className="mt-4 text-muted">Insights are unavailable right now.</p>;
  if (!data) return <div className="mt-4 skeleton h-64 rounded-2xl" aria-label="Loading insights…" />;

  const { totals, gaps, topQuestions, topMoments, feedback } = data;
  const ratings = feedback ? feedback.helpful + feedback.unhelpful : 0;
  return (
    <div className="mt-4 space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Questions asked" value={String(totals.questions)} />
        <Stat label="Answered from your library" value={`${Math.round(totals.answeredRate * 100)}%`} />
        <Stat label="Moments shared" value={String(totals.shares)} />
        <Stat
          label={ratings ? `Answers rated helpful (${ratings} ratings)` : "Answers rated helpful"}
          value={ratings ? `${Math.round((feedback!.helpful / ratings) * 100)}%` : "—"}
        />
      </div>

      <Card
        title="Knowledge gaps"
        hint="Learners asked these and your library had no answer. Record a session on them next."
        empty="No gaps yet: everything learners asked was covered."
      >
        {gaps.map((g) => (
          <li key={g.question} className="flex items-start justify-between gap-3 py-2">
            <span>{g.question}</span>
            <span className="tabular shrink-0 rounded-full bg-failed/10 px-2 text-sm text-failed">×{g.times}</span>
          </li>
        ))}
      </Card>

      <Card title="Most asked" hint="What learners want to know, over the last 30 days." empty="No questions yet.">
        {topQuestions.map((q) => (
          <li key={q.question} className="flex items-start justify-between gap-3 py-2">
            <Link href={`/search?q=${encodeURIComponent(q.question)}`} className="hover:text-accent">
              {q.question}
            </Link>
            <span className="tabular shrink-0 text-sm text-muted">
              ×{q.times} · {Math.round((q.answered / q.times) * 100)}% answered
            </span>
          </li>
        ))}
      </Card>

      <Card title="Moments that travel" hint="Opened and shared as Moments, most shared first." empty="No Moments shared yet.">
        {topMoments.map((m) => (
          <li key={m.segmentId} className="py-2">
            <Link href={`/watch/${m.lectureId}?t=${Math.floor(m.startS)}`} className="font-medium hover:text-accent">
              {m.title} · <span className="tabular">{formatTime(m.startS)}</span>
            </Link>
            <p className="line-clamp-1 text-sm text-muted">“{m.text}”</p>
            <p className="tabular text-xs text-muted">
              {m.shares} shares · {m.opens} opens
            </p>
          </li>
        ))}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="tabular text-2xl font-semibold">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

function Card({ title, hint, empty, children }: { title: string; hint: string; empty: string; children: React.ReactNode[] }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted">{hint}</p>
      {children.length ? <ul className="mt-2 divide-y divide-border">{children}</ul> : <p className="mt-3 text-sm text-muted">{empty}</p>}
    </section>
  );
}
