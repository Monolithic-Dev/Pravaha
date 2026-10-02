"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { InsightsPanel } from "@/components/InsightsPanel";
import { StatusBadge } from "@/components/StatusBadge";
import { UploadForm } from "@/components/UploadForm";
import { formatTime } from "@/lib/format";

type Session = {
  id: string;
  title: string;
  speaker: string | null;
  status: "processing" | "ready" | "transcript_failed";
  visibility: "unlisted" | "public";
  durationS: number | null;
  moments: number;
  chapters: number;
  hasStudyPack: boolean;
};

// `demo`: the read-only Studio visitors see without signing in (STUDIO_DEMO). Same real sessions (published
// ones only) and anonymous Insights; uploading, publishing and Study Pack builds need an organizer.
export function Studio({ demo = false }: { demo?: boolean }) {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [view, setView] = useState<"sessions" | "insights">("sessions");
  const [packState, setPackState] = useState<Record<string, "building" | "done" | "failed">>({});

  const refresh = useCallback(async () => {
    const res = await fetch("/api/lectures", { cache: "no-store" });
    if (res.ok) setSessions(await res.json());
  }, []);

  useEffect(() => {
    // Initial fetch; setState happens after the await, so this doesn't cascade renders.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  // NFR2: never a silent black box — poll while anything is still processing.
  const anyProcessing = sessions?.some((s) => s.status === "processing");
  useEffect(() => {
    if (!anyProcessing) return;
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [anyProcessing, refresh]);

  async function setVisibility(id: string, visibility: Session["visibility"]) {
    setSessions((list) => list?.map((s) => (s.id === id ? { ...s, visibility } : s)) ?? null);
    const res = await fetch(`/api/lectures/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility }),
    });
    if (!res.ok) refresh();
  }

  // Builds (or rebuilds) a session's Study Pack: summary, concepts, quiz and highlight reel.
  async function buildPack(id: string) {
    setPackState((p) => ({ ...p, [id]: "building" }));
    const res = await fetch(`/api/lectures/${id}/study-pack`, { method: "POST" });
    setPackState((p) => ({ ...p, [id]: res.ok ? "done" : "failed" }));
  }

  async function signOut() {
    await fetch("/api/organizer/session", { method: "DELETE" });
    window.location.reload();
  }

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
      <div>
        {demo ? (
          <DemoCard />
        ) : (
          <>
            <UploadForm onUploaded={refresh} />
            <button onClick={signOut} className="mt-4 text-sm text-muted hover:text-fg">
              Sign out
            </button>
          </>
        )}
      </div>

      <section aria-label="Studio views">
        <div role="tablist" className="flex gap-1 rounded-xl border border-border bg-surface p-1 text-sm font-medium sm:w-fit">
          {(["sessions", "insights"] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`rounded-lg px-4 py-1.5 capitalize ${view === v ? "bg-accent text-accent-fg" : "text-muted hover:text-fg"}`}
            >
              {v}
            </button>
          ))}
        </div>
        {view === "insights" ? (
          <InsightsPanel />
        ) : sessions === null ? (
          <div className="mt-4 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-16" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <p className="mt-4 text-muted">No sessions yet — upload your first recording.</p>
        ) : (
          <>
            <LibraryStats sessions={sessions} />
            <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-surface">
              {sessions.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <Link href={`/watch/${s.id}`} className="block truncate font-medium hover:text-accent">
                      {s.title}
                    </Link>
                    <p className="text-sm text-muted">
                      {s.speaker ?? "Unknown speaker"}
                      {s.durationS ? <span className="tabular"> · {formatTime(s.durationS)}</span> : null}
                    </p>
                    {s.status === "ready" && (
                      <p className="tabular mt-1 text-xs text-muted">
                        {s.moments} moments indexed · {s.chapters} chapter{s.chapters === 1 ? "" : "s"}
                        {s.hasStudyPack ? " · Study Pack" : ""}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={s.status} />
                  {demo ? (
                    <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">Published</span>
                  ) : (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={s.visibility === "public"}
                        disabled={s.status !== "ready"}
                        onChange={(e) => setVisibility(s.id, e.target.checked ? "public" : "unlisted")}
                        className="size-4 accent-[var(--accent)]"
                      />
                      {s.visibility === "public" ? "Public" : "Unlisted"}
                    </label>
                  )}
                  {!demo && s.status === "ready" && (
                    <button
                      type="button"
                      onClick={() => buildPack(s.id)}
                      disabled={packState[s.id] === "building"}
                      className="rounded-lg border border-border px-3 py-1 text-sm hover:border-accent disabled:opacity-60"
                    >
                      {packState[s.id] === "building"
                        ? "Building…"
                        : packState[s.id] === "done"
                          ? "Study Pack ready ✓"
                          : packState[s.id] === "failed"
                            ? "Retry Study Pack"
                            : "Build Study Pack"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

// What the pipeline has built from the library so far.
function LibraryStats({ sessions }: { sessions: Session[] }) {
  const ready = sessions.filter((s) => s.status === "ready");
  const seconds = ready.reduce((sum, s) => sum + (s.durationS ?? 0), 0);
  const stats = [
    [String(ready.length), ready.length === 1 ? "session ready" : "sessions ready"],
    [formatTime(seconds), "of recordings"],
    [String(ready.reduce((sum, s) => sum + s.moments, 0)), "moments indexed"],
    [String(ready.filter((s) => s.hasStudyPack).length), "Study Packs"],
  ];
  return (
    <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(([value, label]) => (
        <div key={label} className="rounded-2xl border border-border bg-surface p-4">
          <dt className="sr-only">{label}</dt>
          <dd className="tabular text-2xl font-semibold">{value}</dd>
          <dd className="text-sm text-muted">{label}</dd>
        </div>
      ))}
    </dl>
  );
}

const DEMO_STEPS = [
  ["Upload a recording", "Straight to Cloudinary from the browser, up to 100 MB."],
  ["Cloudinary AI processes it", "Word-timed transcript, chapters and adaptive streaming, then a webhook."],
  ["Publish", "Pravaha indexes every sentence and writes a Study Pack. Learners can now ask it."],
  ["Read Insights", "What learners asked, what your library couldn't answer, which moments travel."],
];

function DemoCard() {
  return (
    <div className="rounded-2xl border border-accent/40 bg-surface p-6">
      <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">Read-only demo</span>
      <h2 className="mt-3 text-lg font-semibold">This is what an organizer sees</h2>
      <p className="mt-1 text-sm text-muted">
        Real sessions from this library and real, anonymous learner insights. Uploading and publishing need an organizer sign-in,
        but you can try the whole pipeline with your own short video.
      </p>
      <ol className="mt-5 space-y-3 text-sm">
        {DEMO_STEPS.map(([title, body], i) => (
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
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/try" className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-fg">
          Try with your own video
        </Link>
        <Link
          href="/studio/sign-in"
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:border-accent"
        >
          Organizer sign in
        </Link>
      </div>
    </div>
  );
}
