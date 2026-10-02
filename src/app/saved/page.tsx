import type { Metadata } from "next";

import { SavedView } from "@/components/SavedView";

export const metadata: Metadata = { title: "Saved — Pravaha", robots: { index: false } };

export default function SavedPage() {
  return (
    <div className="mt-6">
      <h1 className="rise text-2xl font-semibold tracking-tight sm:text-3xl">Saved</h1>
      <p className="rise mt-1 text-muted" style={{ animationDelay: "60ms" }}>
        Your moments, questions and sessions in progress.
      </p>
      <div className="mt-8">
        <SavedView />
      </div>
    </div>
  );
}
