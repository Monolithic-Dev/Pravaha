"use client";

import { useState } from "react";

import { embedSnippet } from "@/lib/embed";

// The iframe snippet an organizer pastes into Moodle, Canvas, Google Sites or any course page (docs/EMBED.md).
// Rendered only after a click, so reading window.location here never differs from the server render.
export function EmbedCode({ lectureId, title }: { lectureId?: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const { src, html } = embedSnippet(window.location.origin, { lectureId, title });

  async function copy() {
    await navigator.clipboard?.writeText(html).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {},
    );
  }

  return (
    <div className="rise mt-3 rounded-xl border border-border bg-bg p-4">
      <p className="text-sm font-medium">{lectureId ? "Embed “Ask this session”" : "Embed “Ask the library”"}</p>
      <p className="mt-1 text-sm text-muted">
        Paste into Moodle, Canvas, Google Sites or any page that accepts HTML. Learners ask without an account, and every answer
        plays the moment it came from.
      </p>
      <label className="sr-only" htmlFor={`embed-${lectureId ?? "library"}`}>
        Embed code
      </label>
      <textarea
        id={`embed-${lectureId ?? "library"}`}
        readOnly
        value={html}
        rows={4}
        onFocus={(e) => e.currentTarget.select()}
        className="mt-3 w-full resize-none rounded-lg border border-border bg-surface p-3 font-mono text-xs break-all text-fg"
      />
      <div className="mt-2 flex gap-2 text-sm">
        <button
          type="button"
          onClick={copy}
          className="rounded-lg bg-accent px-3 py-1.5 font-medium text-accent-fg hover:brightness-110"
        >
          {copied ? "Copied ✓" : "Copy code"}
        </button>
        <a href={src} target="_blank" rel="noopener" className="rounded-lg border border-border px-3 py-1.5 hover:border-accent">
          Preview
        </a>
      </div>
    </div>
  );
}
