"use client";

import { useState } from "react";

import { explainUrl, summarizeParams } from "@/lib/explain-url";
import type { HoodItem } from "@/lib/hood-items";

// Step colours cycle (theme tokens, so they follow the light/dark toggle) to keep each URL component apart.
const STEP_COLORS = ["text-accent", "text-processing", "text-fg", "text-ready"];

// "Cloudinary under the hood": every piece of media on this page is a Cloudinary URL. This lists them, with
// each transformation explained, so anyone can see (and open) exactly what Cloudinary does.
export function UnderTheHood({ items, title = "Cloudinary under the hood" }: { items: HoodItem[]; title?: string }) {
  return (
    <details className="group mt-6 rounded-2xl border border-border bg-surface">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
        <span
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/10 font-mono text-xs font-bold text-accent"
          aria-hidden
        >
          {"</>"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{title}</span>
          <span className="block text-sm text-muted">
            {items.length} Cloudinary URLs make this page. No render servers: each one is generated on request and cached.
          </span>
        </span>
        <span aria-hidden className="text-muted transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <ul className="divide-y divide-border border-t border-border">
        {items.map((item) => (
          <HoodRow key={item.title} item={item} />
        ))}
      </ul>
    </details>
  );
}

function HoodRow({ item }: { item: HoodItem }) {
  const [copied, setCopied] = useState(false);
  const [full, setFull] = useState(false);
  const explained = explainUrl(item.url);
  const params = explained ? summarizeParams(explained) : [];
  // Long URLs (a Moment has a layer per caption card) show their first and last steps until expanded.
  const steps = explained?.steps ?? [];
  const hidden = full || steps.length <= MAX_STEPS ? 0 : steps.length - (HEAD_STEPS + TAIL_STEPS);
  const shown = hidden ? [...steps.slice(0, HEAD_STEPS), null, ...steps.slice(-TAIL_STEPS)] : steps;

  async function copy() {
    await navigator.clipboard?.writeText(item.url).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {},
    );
  }

  return (
    <li className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{item.title}</p>
          <p className="text-sm text-muted">{item.what}</p>
        </div>
        <div className="flex shrink-0 gap-1 text-sm">
          <button type="button" onClick={copy} className="rounded-lg px-2.5 py-1 text-muted hover:bg-bg hover:text-fg">
            {copied ? "Copied" : "Copy URL"}
          </button>
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg px-2.5 py-1 text-muted hover:bg-bg hover:text-fg"
          >
            Open ↗
          </a>
        </div>
      </div>
      <p className="mt-2 font-mono text-xs leading-relaxed break-all">
        <span className="text-muted">…/{explained?.resource ?? "video"}/upload/</span>
        {shown.map((step, i) =>
          step ? (
            <span key={i}>
              <span className={STEP_COLORS[i % STEP_COLORS.length]}>{shorten(step.raw)}</span>
              <span className="text-muted">/</span>
            </span>
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => setFull(true)}
              className="mx-0.5 rounded bg-bg px-1.5 text-muted hover:text-fg"
            >
              … {hidden} more steps (show all) …
            </button>
          ),
        )}
        <span className="text-muted">{explained?.asset ?? item.url}</span>
      </p>
      {params.length > 0 && (
        <dl className="mt-2 grid gap-x-3 gap-y-1 text-xs sm:grid-cols-[auto_1fr]">
          {params.map((p) => (
            <div key={p.raw} className="contents">
              <dt className="font-mono text-muted">{shorten(p.raw, 28)}</dt>
              <dd>
                {p.meaning}
                {p.count > 1 && <span className="text-muted"> · and {p.count - 1} more like it</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  );
}

const MAX_STEPS = 8;
const HEAD_STEPS = 4;
const TAIL_STEPS = 2;

// Text layers carry URL-encoded captions; keep the display readable.
function shorten(text: string, max = 60) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
