import type { Metadata } from "next";
import { Suspense } from "react";

import { aiStatus, fastStatus, verdict, type FastStatus } from "@/lib/status";
import type { FailureKind, Overall } from "@/lib/status-level";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Status — Pravaha",
  description: "Live health of Pravaha: the database, every AI model, Cloudinary credits and what the library holds.",
};

const HEADLINE: Record<Overall, { text: string; tone: string }> = {
  operational: { text: "All systems operational", tone: "border-ready/50 bg-ready/10 text-ready" },
  degraded: { text: "Degraded: working, with a problem", tone: "border-processing/50 bg-processing/10 text-processing" },
  outage: { text: "Outage", tone: "border-failed/50 bg-failed/10 text-failed" },
};

const KIND: Record<FailureKind, string> = { quota: "quota or rate limit", overloaded: "provider overloaded", error: "error" };

const card = "rounded-2xl border border-border bg-surface p-5";
const h2 = "text-sm font-semibold tracking-wide text-muted uppercase";

function Dot({ ok }: { ok: boolean }) {
  return <span aria-hidden className={`inline-block size-2.5 rounded-full ${ok ? "bg-ready" : "bg-failed"}`} />;
}

// The quick checks render at once; the AI probe (five small model calls, cached for 5 minutes) streams in after.
export default async function StatusPage() {
  const fast = await fastStatus();
  const c = fast.cloudinary;
  const bar = c ? (c.level === "critical" ? "bg-failed" : c.level === "warn" ? "bg-processing" : "bg-accent") : "";

  return (
    <div className="mx-auto mt-6 max-w-4xl">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Status</h1>
      <p className="mt-2 text-muted">Pravaha checks itself live: the database, every AI model and the Cloudinary credits the media runs on.</p>

      <Suspense fallback={<div className="skeleton mt-6 h-20 rounded-2xl" aria-label="Checking" />}>
        <Verdict fast={fast} />
      </Suspense>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className={card} aria-labelledby="st-db">
          <h2 id="st-db" className={h2}>
            Database
          </h2>
          <p className="mt-3 flex items-center gap-2 font-medium">
            <Dot ok={fast.database.ok} />
            {fast.database.ok ? "Reachable" : "Unreachable"}
            <span className="tabular text-sm font-normal text-muted">{fast.database.ms} ms</span>
          </p>
          <p className="mt-1 text-sm text-muted">Neon Postgres: sessions, time-coded moments and the full-text index.</p>
        </section>

        <section className={card} aria-labelledby="st-cld">
          <h2 id="st-cld" className={h2}>
            Cloudinary credits
          </h2>
          {c ? (
            <>
              <p className="mt-3 flex items-baseline justify-between">
                <span className="tabular text-2xl font-semibold">
                  {c.used.toFixed(1)} <span className="text-base font-normal text-muted">of {c.limit}</span>
                </span>
                <span className="tabular text-sm text-muted">{c.pct}% used</span>
              </p>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-border"
                role="progressbar"
                aria-valuenow={c.pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Cloudinary credits used"
              >
                <div className={`h-full ${bar}`} style={{ width: `${Math.min(100, c.pct)}%` }} />
              </div>
              <p className="mt-2 text-sm text-muted">
                Transformations {c.transformations.toFixed(2)} · storage {c.storage.toFixed(2)} · bandwidth {c.bandwidth.toFixed(2)}
                {c.reportedOn ? ` · reported ${c.reportedOn}` : ""}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">Usage couldn&apos;t be read right now.</p>
          )}
        </section>
      </div>

      <Suspense fallback={<div className={`${card} skeleton mt-4 h-48`} aria-label="Probing AI models" />}>
        <AiCard />
      </Suspense>

      {fast.library && (
        <section className={`${card} mt-4`} aria-labelledby="st-lib">
          <h2 id="st-lib" className={h2}>
            In the library
          </h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              [fast.library.sessions, "published sessions"],
              [fast.library.moments, "moments indexed"],
              [fast.library.studyPacks, "Study Packs"],
              [fast.library.questionsAsked, "questions asked"],
            ].map(([n, label]) => (
              <div key={label}>
                <dd className="tabular text-2xl font-semibold">{n}</dd>
                <dt className="text-sm text-muted">{label}</dt>
              </div>
            ))}
          </dl>
        </section>
      )}

      <p className="mt-6 text-xs text-muted">
        Version <span className="font-mono">{fast.version}</span> · checked {new Date(fast.checkedAt).toLocaleTimeString("en-IN")} · JSON at{" "}
        <span className="font-mono">/api/status</span>
      </p>
    </div>
  );
}

async function Verdict({ fast }: { fast: FastStatus }) {
  const { level, reasons } = verdict(fast, await aiStatus());
  const head = HEADLINE[level];
  return (
    <div role="status" className={`mt-6 rounded-2xl border p-5 ${head.tone}`}>
      <p className="text-lg font-semibold">{head.text}</p>
      {reasons.map((r) => (
        <p key={r} className="mt-1 text-sm text-fg">
          {r}
        </p>
      ))}
    </div>
  );
}

async function AiCard() {
  const ai = await aiStatus();
  const up = ai.models?.filter((m) => m.ok).length ?? 0;
  return (
    <section className={`${card} mt-4`} aria-labelledby="st-ai">
      <h2 id="st-ai" className={h2}>
        AI models
      </h2>
      {ai.models ? (
        <>
          <p className="mt-2 text-sm text-muted">
            {up} of {ai.models.length} answering. Ask tries them in order, so one failing model doesn&apos;t stop answers. If all fail, it shows the closest clips.
          </p>
          <ul className="mt-3 divide-y divide-border">
            {ai.models.map((m) => (
              <li key={m.model} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="flex items-center gap-2 font-mono">
                  <Dot ok={m.ok} />
                  {m.model}
                </span>
                <span className="tabular text-muted">{m.ok ? `${m.ms} ms` : m.kind ? KIND[m.kind] : "error"}</span>
              </li>
            ))}
          </ul>
          {ai.probedAt && <p className="mt-2 text-xs text-muted">Probed {new Date(ai.probedAt).toLocaleTimeString("en-IN")}; refreshed every 5 minutes.</p>}
        </>
      ) : (
        <p className="mt-2 text-sm text-muted">No AI provider is configured. Ask shows the most relevant clips without an AI answer.</p>
      )}
    </section>
  );
}
