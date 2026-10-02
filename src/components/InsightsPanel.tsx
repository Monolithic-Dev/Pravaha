"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { formatTime } from "@/lib/format";
import type { Insights } from "@/lib/insights";
import type { InsightReport } from "@/lib/insights-export";

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

  const { totals, gaps, topQuestions, topMoments, feedback, daily, topSessions } = data;
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

      <div className="grid gap-6 lg:grid-cols-2">
        <DailyChart days={daily} />
        <SessionsChart sessions={topSessions} />
      </div>

      <Card
        title="Knowledge gaps"
        report="gaps"
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

      <Card title="Most asked" report="questions" hint="What learners want to know, over the last 30 days." empty="No questions yet.">
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

      <Card title="Moments that travel" report="moments" hint="Opened and shared as Moments, most shared first." empty="No Moments shared yet.">
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

function Card({
  title,
  report,
  hint,
  empty,
  children,
}: {
  title: string;
  report: InsightReport;
  hint: string;
  empty: string;
  children: React.ReactNode[];
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <CardTitle title={title} report={report} />
      <p className="text-sm text-muted">{hint}</p>
      {children.length ? (
        <ul className="mt-2 divide-y divide-border">{children}</ul>
      ) : (
        <p className="mt-3 text-sm text-muted">{empty}</p>
      )}
    </section>
  );
}

// Every list downloads in full as CSV (GET /api/insights/export), for a spreadsheet or an LMS report.
function CardTitle({ title, report }: { title: string; report: InsightReport }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h3 className="font-semibold">{title}</h3>
      <a
        href={`/api/insights/export?report=${report}`}
        download
        aria-label={`Download “${title}” as CSV`}
        className="shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium text-muted hover:bg-bg hover:text-fg"
      >
        CSV ↓
      </a>
    </div>
  );
}

const dayLabel = (day: string) => new Date(`${day}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

// Questions per day, answered stacked on unanswered. Plain bars (no chart library) in theme colours.
function DailyChart({ days }: { days: Insights["daily"] }) {
  const max = Math.max(1, ...days.map((d) => d.answered + d.unanswered));
  const total = days.reduce((sum, d) => sum + d.answered + d.unanswered, 0);
  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <CardTitle title="Questions per day" report="daily" />
      <p className="text-sm text-muted">
        Last {days.length} days · <span className="text-accent">■</span> answered <span className="text-failed">■</span> not
        answered
      </p>
      <div
        role="img"
        aria-label={`${total} questions in the last ${days.length} days. ${days
          .filter((d) => d.answered + d.unanswered > 0)
          .map((d) => `${dayLabel(d.day)}: ${d.answered} answered, ${d.unanswered} not`)
          .join("; ")}`}
        className="mt-4 flex h-36 items-end gap-1"
      >
        {days.map((d) => {
          const count = d.answered + d.unanswered;
          return (
            <div
              key={d.day}
              className="group relative flex h-full flex-1 flex-col justify-end"
              title={`${dayLabel(d.day)}: ${d.answered} answered, ${d.unanswered} not answered`}
            >
              {count === 0 ? (
                <div className="h-0.5 rounded-full bg-border" />
              ) : (
                <div className="flex flex-col overflow-hidden rounded-md" style={{ height: `${(count / max) * 100}%` }}>
                  <div className="bg-failed/70" style={{ flexGrow: d.unanswered }} />
                  <div className="bg-accent" style={{ flexGrow: d.answered }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-muted">
        <span>{days[0] ? dayLabel(days[0].day) : ""}</span>
        <span>Today</span>
      </div>
    </section>
  );
}

// Which recordings answers draw on: the sessions doing the teaching.
function SessionsChart({ sessions }: { sessions: Insights["topSessions"] }) {
  const max = Math.max(1, ...sessions.map((s) => s.answers));
  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      <CardTitle title="Sessions answers come from" report="sessions" />
      <p className="text-sm text-muted">How many answers cited each session, last 30 days.</p>
      {sessions.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No answers yet.</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {sessions.map((s) => (
            <li key={s.lectureId}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <Link href={`/watch/${s.lectureId}`} className="min-w-0 truncate hover:text-accent">
                  {s.title}
                </Link>
                <span className="tabular shrink-0 text-muted">{s.answers}</span>
              </div>
              <div aria-hidden className="mt-1 h-2 overflow-hidden rounded-full bg-bg">
                <div className="h-full rounded-full bg-accent" style={{ width: `${(s.answers / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
