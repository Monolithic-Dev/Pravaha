"use client";

import { toggleSavedMoment, useSavedMoments, type SavedMoment } from "@/lib/saved";

// Bookmark a moment into the learner's Saved page (this device only).
export function SaveButton({ moment }: { moment: Omit<SavedMoment, "savedAt"> }) {
  const saved = useSavedMoments().some((m) => m.segmentId === moment.segmentId);
  return (
    <button
      type="button"
      onClick={() => toggleSavedMoment(moment)}
      aria-pressed={saved}
      aria-label={saved ? "Remove from Saved" : "Save this moment"}
      title={saved ? "Remove from Saved" : "Save this moment"}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
        saved ? "border-accent bg-accent/10 text-accent" : "border-border hover:border-accent"
      }`}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
        <path d="M6 3h12v18l-6-4-6 4z" />
      </svg>
      {saved ? "Saved" : "Save"}
    </button>
  );
}
