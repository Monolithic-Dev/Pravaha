import type { Metadata } from "next";

import { AskAnswer } from "@/components/AskAnswer";
import { MomentButton } from "@/components/MomentButton";
import { ResultCard } from "@/components/ResultCard";
import { SaveButton } from "@/components/SaveButton";
import { SearchBar } from "@/components/SearchBar";
import { findSegments } from "@/lib/search";

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `${q} — Pravaha` : "Search — Pravaha" };
}

export default async function SearchPage({ searchParams }: Props) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 300);
  const { hits, exact } = q.length >= 2 ? await findSegments(q) : { hits: [], exact: true };

  return (
    <div className="mt-4">
      <SearchBar defaultValue={q} />
      {q.length >= 3 && <AskAnswer key={q} question={q} />}

      <section aria-labelledby="found-heading" className="mt-8">
        <h2 id="found-heading" className="text-sm font-semibold tracking-wide text-muted uppercase">
          Moments found
        </h2>
        {q.length < 2 ? (
          <p className="mt-3 text-muted">Type at least two characters.</p>
        ) : hits.length === 0 ? (
          <p className="mt-3 text-muted">Nothing said matches “{q}” — try different words.</p>
        ) : (
          <>
            {!exact && <p className="mt-3 text-sm text-muted">No single moment has every word, so these are the closest.</p>}
            <ul className="mt-3 space-y-3">
              {hits.map((hit, i) => (
                <li key={hit.segmentId} className="rise" style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
                  <ResultCard hit={hit}>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <MomentButton
                        lectureId={hit.lectureId}
                        publicId={hit.publicId}
                        title={hit.title}
                        startS={hit.startS}
                        endS={hit.endS}
                        durationS={hit.durationS}
                        words={hit.words}
                        segmentId={hit.segmentId}
                      />
                      <SaveButton
                        moment={{
                          segmentId: hit.segmentId,
                          lectureId: hit.lectureId,
                          publicId: hit.publicId,
                          title: hit.title,
                          speaker: hit.speaker,
                          startS: hit.startS,
                          endS: hit.endS,
                          text: hit.text,
                        }}
                      />
                    </div>
                  </ResultCard>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
