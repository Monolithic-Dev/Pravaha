"use client";

import Link from "next/link";

import { ContinueWatchingRow } from "@/components/SavedView";
import { useWatchProgress } from "@/lib/saved";

// Home-page row: the sessions this learner started and didn't finish (this device only). Hidden when empty.
export function ContinueWatching() {
  const progress = useWatchProgress();
  if (progress.length === 0) return null;
  return (
    <section aria-labelledby="continue-heading" className="mb-12">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="continue-heading" className="text-lg font-semibold">
          Continue watching
        </h2>
        <Link href="/saved" className="text-sm text-muted hover:text-fg">
          All saved →
        </Link>
      </div>
      <ContinueWatchingRow items={progress.slice(0, 3)} />
    </section>
  );
}
