import { LibraryCard } from "@/components/LibraryCard";
import type { Lecture } from "@/lib/lectures";

export function LibraryGrid({ lectures }: { lectures: Lecture[] }) {
  if (!lectures.length) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-8 text-center text-muted">
        No sessions published yet — Pravaha turns recorded talks into answers you can watch.
      </p>
    );
  }
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {lectures.map((l, i) => (
        <LibraryCard key={l.id} lecture={l} index={i} />
      ))}
    </ul>
  );
}
