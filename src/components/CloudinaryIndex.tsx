"use client";

import { useState } from "react";

type Asset = { publicId: string; tags: string[]; context: Record<string, string> };

// Organizer tool: writes each session's concepts, language and speaker onto its Cloudinary asset as tags and
// contextual metadata, then reads them back through Cloudinary's Search API (tags=pravaha).
export function CloudinaryIndex() {
  const [state, setState] = useState<"idle" | "working" | "failed">("idle");
  const [assets, setAssets] = useState<Asset[] | null>(null);

  async function sync() {
    setState("working");
    const res = await fetch("/api/organizer/index", { method: "POST", headers: { "Content-Type": "application/json" } });
    if (!res.ok) return setState("failed");
    setAssets(((await res.json()) as { assets: Asset[] }).assets);
    setState("idle");
  }

  return (
    <section className="mt-6 rounded-2xl border border-border bg-surface p-4" aria-labelledby="cld-index">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="cld-index" className="font-semibold">
            Cloudinary asset index
          </h2>
          <p className="text-sm text-muted">Tag every session in Cloudinary with its concepts and details, then query them with the Search API.</p>
        </div>
        <button
          type="button"
          onClick={sync}
          disabled={state === "working"}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg hover:opacity-90 disabled:opacity-60"
        >
          {state === "working" ? "Syncing…" : assets ? "Sync again" : "Sync tags"}
        </button>
      </div>
      {state === "failed" && <p role="alert" className="mt-3 text-sm text-failed">Couldn&apos;t sync. Check that you&apos;re signed in as an organizer.</p>}
      {assets && (
        <>
          <p className="mt-3 text-sm" aria-live="polite">
            Cloudinary&apos;s Search API found <strong>{assets.length}</strong> tagged {assets.length === 1 ? "asset" : "assets"}.
          </p>
          <ul className="mt-2 space-y-2">
            {assets.map((a) => (
              <li key={a.publicId} className="rounded-xl border border-border bg-bg p-3 text-sm">
                <p className="font-medium">{a.context.title ?? a.publicId}</p>
                <p className="mt-1 flex flex-wrap gap-1.5">
                  {a.tags.map((t) => (
                    <span key={t} className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                      {t}
                    </span>
                  ))}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
