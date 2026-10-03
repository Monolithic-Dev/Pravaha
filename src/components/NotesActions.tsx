"use client";

import { useState } from "react";

// Copy as Markdown, download the .md file, or print / save as PDF. Hidden when printing.
export function NotesActions({ markdown, downloadHref }: { markdown: string; downloadHref: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the download button still works.
    }
  }

  const btn = "rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:border-accent";
  return (
    <div className="mt-4 flex flex-wrap gap-2 print:hidden">
      <button type="button" onClick={copy} className={btn} aria-live="polite">
        {copied ? "Copied" : "Copy as Markdown"}
      </button>
      <a href={downloadHref} download className={btn}>
        Download .md
      </a>
      <button type="button" onClick={() => window.print()} className={btn}>
        Print / Save as PDF
      </button>
    </div>
  );
}
