"use client";

import { CldUploadWidget } from "next-cloudinary";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

import { TRIAL_MAX_BYTES } from "@/lib/trial-policy";

type Trial = { id: string; publicId: string; title: string; uploadPreset: string; expiresAt: string };
type Status = "processing" | "ready" | "transcript_failed";
type Stage = { kind: "details" } | { kind: "upload"; trial: Trial } | { kind: "processing"; trial: Trial };

const FORMATS = ["mp4", "mov", "webm", "mkv", "m4v"];
const KEY = "pravaha-trials";
// Past this, processing is unusually slow; the page says so instead of spinning forever.
const SLOW_AFTER_MS = 3 * 60_000;

// "Try it with your own video": create a trial, upload it straight to Cloudinary (trial preset: first 60 s
// only), then follow the real pipeline until the session can be asked. Limits live in src/lib/trials.ts.
export function TryFlow({ seconds, ttlHours }: { seconds: number; ttlHours: number }) {
  const [stage, setStage] = useState<Stage>({ kind: "details" });

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        <Progress step={stage.kind === "details" ? 1 : stage.kind === "upload" ? 2 : 3} />
        {stage.kind === "details" && <Details seconds={seconds} onCreated={(trial) => setStage({ kind: "upload", trial })} />}
        {stage.kind === "upload" && (
          <Upload
            trial={stage.trial}
            seconds={seconds}
            onUploaded={() => {
              remember(stage.trial);
              setStage({ kind: "processing", trial: stage.trial });
            }}
            onCancel={() => setStage({ kind: "details" })}
          />
        )}
        {stage.kind === "processing" && <Processing trial={stage.trial} />}
      </div>
      <aside className="space-y-4">
        <div className="rounded-2xl border border-border bg-surface p-5 text-sm">
          <h2 className="font-semibold">What happens to your video</h2>
          <ul className="mt-3 space-y-2.5 text-muted">
            <Fact>Cloudinary keeps only the first {seconds} seconds, transcribes them and finds chapters.</Fact>
            <Fact>It stays private: it never appears in the library, and only people with its link can open it.</Fact>
            <Fact>It is deleted automatically after {ttlHours} hours, with its transcript.</Fact>
            <Fact>Trial uploads are limited per day so the demo stays free for everyone.</Fact>
          </ul>
        </div>
        <YourTrials />
      </aside>
    </div>
  );
}

function Progress({ step }: { step: 1 | 2 | 3 }) {
  const labels = ["Details", "Upload", "Processing"];
  return (
    <ol className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm" aria-label={`Step ${step} of 3`}>
      {labels.map((label, i) => {
        const n = i + 1;
        const state = n < step ? "done" : n === step ? "current" : "todo";
        return (
          <li key={label} className="flex items-center gap-2" aria-current={state === "current" ? "step" : undefined}>
            <span
              className={`grid size-6 place-items-center rounded-full text-xs font-semibold ${
                state === "todo" ? "border border-border text-muted" : "bg-accent text-accent-fg"
              }`}
            >
              {state === "done" ? "✓" : n}
            </span>
            <span className={state === "current" ? "font-medium" : "text-muted"}>{label}</span>
            {n < 3 && <span aria-hidden className="mx-0.5 h-px w-4 bg-border sm:mx-1 sm:w-10" />}
          </li>
        );
      })}
    </ol>
  );
}

function Details({ seconds, onCreated }: { seconds: number; onCreated: (trial: Trial) => void }) {
  const [title, setTitle] = useState("");
  const [rights, setRights] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function start(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/trials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() || "My video", rightsConfirmed: rights }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error?.message ?? "Couldn't start a trial. Try again in a moment.");
        return;
      }
      const { lecture, uploadPreset } = body;
      onCreated({
        id: lecture.id,
        publicId: lecture.publicId,
        title: lecture.title,
        uploadPreset,
        expiresAt: lecture.trialExpiresAt,
      });
    } catch {
      setError("Couldn't reach Pravaha. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={start} className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold">Name your video</h2>
      <p className="mt-1 text-sm text-muted">
        A lecture, a talk, a tutorial: anything with speech. Pravaha uses the first {seconds} seconds.
      </p>
      <label htmlFor="trial-title" className="mt-5 block text-sm font-medium">
        Title <span className="font-normal text-muted">(optional)</span>
      </label>
      <input
        id="trial-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={140}
        placeholder="My video"
        className="mt-1.5 w-full rounded-lg border border-border bg-bg px-3 py-2.5"
      />
      <label className="mt-5 flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={rights}
          onChange={(e) => setRights(e.target.checked)}
          className="mt-0.5 size-4 accent-[var(--accent)]"
        />
        <span>I have the right to use this video, and anyone speaking in it agreed.</span>
      </label>
      {error && (
        <p role="alert" className="mt-3 text-sm text-failed">
          {error}
        </p>
      )}
      <button
        disabled={!rights || busy}
        className="mt-5 rounded-lg bg-accent px-4 py-2.5 font-medium text-accent-fg disabled:opacity-50"
      >
        {busy ? "Starting…" : "Continue to upload"}
      </button>
    </form>
  );
}

function Upload({
  trial,
  seconds,
  onUploaded,
  onCancel,
}: {
  trial: Trial;
  seconds: number;
  onUploaded: () => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold">Upload “{trial.title}”</h2>
      <p className="mt-1 text-sm text-muted">
        Up to 50 MB (MP4, MOV, WebM, MKV). Longer videos are fine: only the first {seconds} seconds are kept.
      </p>
      <CldUploadWidget
        signatureEndpoint="/api/upload-signature"
        uploadPreset={trial.uploadPreset}
        options={{
          publicId: trial.publicId,
          resourceType: "video",
          multiple: false,
          maxFiles: 1,
          sources: ["local", "url"],
          clientAllowedFormats: FORMATS,
          maxFileSize: TRIAL_MAX_BYTES,
        }}
        onSuccess={onUploaded}
        onError={() => setError("Upload failed. Check the file is a video under 50 MB, then try again.")}
      >
        {({ open }) => (
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => open()} className="rounded-lg bg-accent px-4 py-2.5 font-medium text-accent-fg">
              Choose video
            </button>
            <button type="button" onClick={onCancel} className="rounded-lg border border-border px-4 py-2.5">
              Back
            </button>
          </div>
        )}
      </CldUploadWidget>
      {error && (
        <p role="alert" className="mt-3 text-sm text-failed">
          {error}
        </p>
      )}
    </div>
  );
}

// Polls the session until the webhook-driven pipeline finishes, then opens it on the Watch page.
function Processing({ trial }: { trial: Trial }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("processing");
  const [durationS, setDurationS] = useState<number | null>(null);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    let stopped = false;
    const started = Date.now();
    async function poll() {
      try {
        const res = await fetch(`/api/lectures/${trial.id}`, { cache: "no-store" });
        if (res.ok) {
          const lecture = await res.json();
          if (stopped) return;
          setDurationS(lecture.durationS);
          setStatus(lecture.status);
          if (lecture.status === "ready") {
            router.push(`/watch/${trial.id}`);
            return;
          }
          if (lecture.status === "transcript_failed") return;
        }
      } catch {
        // Network blip: keep polling.
      }
      if (stopped) return;
      setSlow(Date.now() - started > SLOW_AFTER_MS);
      timer = setTimeout(poll, 3000);
    }
    let timer = setTimeout(poll, 1500);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [trial.id, router]);

  const steps = [
    { label: "Uploaded to Cloudinary", done: true },
    { label: durationS ? `Trimmed to ${Math.round(durationS)} s and stored` : "Storing the video…", done: durationS !== null },
    { label: "Transcribing and chaptering with Cloudinary AI…", done: status === "ready" },
    { label: "Indexing every sentence for Ask", done: status === "ready" },
  ];

  return (
    <div className="rounded-2xl border border-border bg-surface p-6" aria-live="polite">
      <h2 className="text-lg font-semibold">Making “{trial.title}” askable</h2>
      {status === "transcript_failed" ? (
        <div className="mt-4">
          <p>Cloudinary couldn&apos;t find speech to transcribe in this video, so there is nothing to ask.</p>
          <Link href={`/watch/${trial.id}`} className="mt-3 inline-block text-sm text-accent hover:underline">
            Watch it anyway
          </Link>
        </div>
      ) : (
        <>
          <ol className="mt-4 space-y-3 text-sm">
            {steps.map((s, i) => {
              const active = !s.done && steps.slice(0, i).every((p) => p.done);
              return (
                <li key={s.label} className="flex items-center gap-2.5">
                  <span aria-hidden className="grid size-4.5 shrink-0 place-items-center">
                    {s.done ? (
                      <span className="grid size-4.5 place-items-center rounded-full bg-accent/15 text-[10px] text-accent">
                        ✓
                      </span>
                    ) : active ? (
                      <span className="spinner size-4" />
                    ) : (
                      <span className="size-2 rounded-full bg-border" />
                    )}
                  </span>
                  <span className={s.done ? "" : "text-muted"}>{s.label}</span>
                </li>
              );
            })}
          </ol>
          <p className="mt-5 text-sm text-muted">
            {slow
              ? "This is taking longer than usual. You can leave this page: your trial stays in “Your trials” on this device."
              : "Usually under a minute. You'll be taken to your video as soon as it can be asked."}
          </p>
        </>
      )}
    </div>
  );
}

// Trials started on this device (links only; the sessions themselves live on the server until they expire).
function readTrials(raw: string | null): Trial[] {
  try {
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((t: Trial) => Date.parse(t.expiresAt) > Date.now()) : [];
  } catch {
    return [];
  }
}

function remember(trial: Trial) {
  try {
    const list = readTrials(localStorage.getItem(KEY)).filter((t) => t.id !== trial.id);
    localStorage.setItem(KEY, JSON.stringify([trial, ...list].slice(0, 5)));
    window.dispatchEvent(new Event(KEY));
  } catch {
    // Storage blocked: the trial still works, it just isn't listed here.
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(KEY, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(KEY, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function YourTrials() {
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(KEY);
      } catch {
        return null;
      }
    },
    () => null,
  );
  const trials = readTrials(raw);
  if (trials.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 text-sm">
      <h2 className="font-semibold">Your trials</h2>
      <ul className="mt-2 divide-y divide-border">
        {trials.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-3 py-2">
            <Link href={`/watch/${t.id}`} className="min-w-0 truncate hover:text-accent">
              {t.title}
            </Link>
            <span className="shrink-0 text-xs text-muted">
              deleted {new Date(t.expiresAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Fact({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
      <span>{children}</span>
    </li>
  );
}
