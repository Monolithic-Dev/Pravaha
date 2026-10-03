import type { Metadata } from "next";
import Link from "next/link";

import { listConcepts } from "@/lib/concepts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Concept map — Pravaha",
  description: "Every concept your lectures teach, and how many different teachers explain each one. Hear them back to back.",
};

export default async function ConceptsPage() {
  const concepts = await listConcepts();
  const shared = concepts.filter((c) => c.entries.length > 1);
  const single = concepts.filter((c) => c.entries.length === 1);
  return (
    <div className="mx-auto mt-6 max-w-4xl">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        One idea, <span className="text-accent">every teacher.</span>
      </h1>
      <p className="mt-3 max-w-2xl text-muted">
        Pravaha reads every session and maps the concepts it teaches. Open one to hear the same idea from each lecturer in your
        library, edited by Cloudinary into one video, until one explanation clicks.
      </p>

      {concepts.length === 0 && (
        <p className="mt-8 rounded-2xl border border-border bg-surface p-5 text-sm">
          No concepts yet: they appear once sessions are published with a Study Pack.
        </p>
      )}

      {shared.length > 0 && (
        <section className="mt-8" aria-labelledby="shared">
          <h2 id="shared" className="text-sm font-semibold tracking-wide text-muted uppercase">
            Taught by more than one lecturer
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shared.map((c) => (
              <li key={c.key}>
                <Link
                  href={`/concepts/${c.key}`}
                  className="flex h-full items-center justify-between gap-3 rounded-2xl border border-accent/40 bg-accent/5 p-4 hover:bg-accent/10"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="tabular shrink-0 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-fg">
                    {c.entries.length} sessions
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {single.length > 0 && (
        <section className="mt-8" aria-labelledby="single">
          <h2 id="single" className="text-sm font-semibold tracking-wide text-muted uppercase">
            More concepts
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {single.map((c) => (
              <li key={c.key}>
                <Link href={`/concepts/${c.key}`} className="inline-block rounded-full border border-border bg-surface px-3 py-1.5 text-sm hover:border-accent">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
