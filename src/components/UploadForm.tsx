"use client";

import { CldUploadWidget } from "next-cloudinary";
import { useState } from "react";

type Created = { lectureId: string; publicId: string; uploadPreset: string; title: string };

const FORMATS = ["mp4", "mov", "webm", "mkv", "m4v"];
// Cloudinary's free plan rejects videos over 100 MB; checking in the widget gives a clear error up front.
const MAX_UPLOAD_BYTES = 100_000_000;

export function UploadForm({ onUploaded }: { onUploaded: () => void }) {
  const [title, setTitle] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [rights, setRights] = useState(false);
  const [created, setCreated] = useState<Created | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createSession(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/lectures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, speaker: speaker || undefined, rightsConfirmed: rights }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Couldn't create the session — check the fields and try again.");
      return;
    }
    const { lecture, uploadPreset } = await res.json();
    setCreated({ lectureId: lecture.id, publicId: lecture.publicId, uploadPreset, title: lecture.title });
    onUploaded(); // show the new row (processing) right away
  }

  function reset() {
    setCreated(null);
    setTitle("");
    setSpeaker("");
    setRights(false);
  }

  if (created) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6">
        <p className="text-sm text-muted">Step 2 of 2</p>
        <h2 className="mt-1 text-lg font-semibold">Upload “{created.title}”</h2>
        <p className="mt-1 text-sm text-muted">
          The video goes straight to Cloudinary. Transcription and chapters start automatically. Up to 100 MB:
          export phone recordings at 720p.
        </p>
        <CldUploadWidget
          signatureEndpoint="/api/upload-signature"
          uploadPreset={created.uploadPreset}
          options={{
            publicId: created.publicId,
            resourceType: "video",
            multiple: false,
            maxFiles: 1,
            sources: ["local", "url"],
            clientAllowedFormats: FORMATS,
            maxFileSize: MAX_UPLOAD_BYTES,
          }}
          onSuccess={() => {
            onUploaded();
            reset();
          }}
          onError={() => setError("Upload failed. Check the file is a video under 100 MB, then try again.")}
        >
          {({ open }) => (
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => open()}
                className="rounded-lg bg-accent px-4 py-2.5 font-medium text-accent-fg"
              >
                Choose video
              </button>
              <button type="button" onClick={reset} className="rounded-lg border border-border px-4 py-2.5">
                Cancel
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

  return (
    <form onSubmit={createSession} className="rounded-2xl border border-border bg-surface p-6">
      <p className="text-sm text-muted">Step 1 of 2</p>
      <h2 className="mt-1 text-lg font-semibold">New session</h2>
      <label htmlFor="title" className="mt-5 block text-sm font-medium">
        Title
      </label>
      <input
        id="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={140}
        required
        placeholder="Intro to Machine Learning — Week 3"
        className="mt-1.5 w-full rounded-lg border border-border bg-bg px-3 py-2.5"
      />
      <label htmlFor="speaker" className="mt-4 block text-sm font-medium">
        Speaker <span className="font-normal text-muted">(optional)</span>
      </label>
      <input
        id="speaker"
        value={speaker}
        onChange={(e) => setSpeaker(e.target.value)}
        maxLength={80}
        placeholder="Dr. Rao"
        className="mt-1.5 w-full rounded-lg border border-border bg-bg px-3 py-2.5"
      />
      <label className="mt-5 flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={rights}
          onChange={(e) => setRights(e.target.checked)}
          className="mt-0.5 size-4 accent-[var(--accent)]"
        />
        <span>
          I have the right to record and publish this session, and its speakers agreed. It stays unlisted until I
          publish it.
        </span>
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
        {busy ? "Creating…" : "Continue to upload"}
      </button>
    </form>
  );
}
