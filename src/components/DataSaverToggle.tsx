"use client";

import { setDataSaver, useDataSaver } from "@/lib/data-saver";

// Header switch for data saver (src/lib/data-saver.ts). Starts on by itself for Save-Data and 2G/3G connections.
export function DataSaverToggle() {
  const on = useDataSaver();
  const label = on ? "Data saver is on: smaller videos and images. Turn off" : "Turn on data saver: smaller videos and images";
  return (
    <button
      type="button"
      onClick={() => setDataSaver(!on)}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className={`grid h-9 place-items-center rounded-lg px-2 text-xs font-semibold hover:bg-surface ${on ? "bg-accent/10 text-accent" : "text-muted hover:text-fg"}`}
    >
      <span className="flex items-center gap-1">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14" />
        </svg>
        <span className="hidden sm:inline">{on ? "Lite" : "Data saver"}</span>
      </span>
    </button>
  );
}
