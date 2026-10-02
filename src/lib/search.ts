import "server-only";

import { query } from "@/lib/db";
import { HIT_END, HIT_START, splitHighlights, type SnippetPart } from "@/lib/highlight";
import type { TimedWord } from "@/lib/segments";

export type Hit = {
  segmentId: number;
  lectureId: string;
  publicId: string;
  title: string;
  speaker: string | null;
  startS: number;
  endS: number;
  text: string;
  chapterTitle: string | null;
  durationS: number | null;
  words: TimedWord[];
  snippet: SnippetPart[];
};

type Row = {
  id: string;
  lecture_id: string;
  public_id: string;
  title: string;
  speaker: string | null;
  start_s: number;
  end_s: number;
  text: string;
  chapter_title: string | null;
  duration_s: number | null;
  words: TimedWord[];
  snippet: string;
};

const HEADLINE = `StartSel=${HIT_START}, StopSel=${HIT_END}, MaxWords=28, MinWords=12, ShortWord=2`;

// Scope: a single lecture (any visibility — you have its link) or the public library.
const SCOPE = `(($2::uuid IS NULL AND l.status = 'ready' AND l.visibility = 'public') OR l.id = $2::uuid)`;

function toHit(r: Row): Hit {
  return {
    segmentId: Number(r.id),
    lectureId: r.lecture_id,
    publicId: r.public_id,
    title: r.title,
    speaker: r.speaker,
    startS: r.start_s,
    endS: r.end_s,
    text: r.text,
    chapterTitle: r.chapter_title,
    durationS: r.duration_s,
    words: r.words,
    snippet: splitHighlights(r.snippet),
  };
}

async function run(tsquery: string, q: string, lectureId: string | null, limit: number): Promise<Hit[]> {
  const rows = await query<Row>(
    `SELECT s.id, s.lecture_id, l.public_id, l.title, l.speaker, s.start_s, s.end_s, s.text, s.chapter_title,
            l.duration_s, s.words, ts_headline('english', s.text, q, $4) AS snippet
       FROM segments s
       JOIN lectures l ON l.id = s.lecture_id,
            ${tsquery} AS q
      WHERE s.search_vector @@ q AND ${SCOPE}
      ORDER BY ts_rank_cd(s.search_vector, q) DESC, s.start_s
      LIMIT $3`,
    [q, lectureId, limit, HEADLINE],
  );
  return rows.map(toHit);
}

// "quoted phrase", -exclusion or OR: the learner is using search syntax, so take the query literally.
export const usesSearchSyntax = (q: string) => /"|(^|\s)-\S|\bor\b/i.test(q);

const ANY_TERM = `to_tsquery('english', replace(plainto_tsquery('english', $1)::text, '&', '|'))`;

// Find: what the learner typed, as a web-style query ("quoted phrases", -exclusions, AND by default).
// A full question rarely has every word in one sentence, so when nothing matches all of them (and no
// search syntax was used) Find shows the closest moments: any of the words, best-ranked first.
// `exact` says which one the learner is looking at.
export async function findSegments(
  q: string,
  { lectureId = null as string | null, limit = 20 } = {},
): Promise<{ hits: Hit[]; exact: boolean }> {
  const hits = await run(`websearch_to_tsquery('english', $1)`, q, lectureId, limit);
  if (hits.length > 0 || usesSearchSyntax(q)) return { hits, exact: true };
  return { hits: await run(ANY_TERM, q, lectureId, Math.min(limit, 10)), exact: false };
}

// Ask retrieval: questions rarely contain every term verbatim, so OR the stemmed, stop-word-free terms.
export function retrieveForQuestion(q: string, { lectureId = null as string | null, limit = 12 } = {}) {
  return run(ANY_TERM, q, lectureId, limit);
}

// Ask within one session when no keyword matches: questions like "What is this video about?" share no terms
// with the transcript. Moments spread evenly across the session (in order) let the model summarise it.
export async function sessionOverview(lectureId: string, limit = 12): Promise<Hit[]> {
  const rows = await query<Row>(
    `WITH ordered AS (
       SELECT s.*, row_number() OVER (ORDER BY s.start_s) AS rn, count(*) OVER () AS total
         FROM segments s WHERE s.lecture_id = $1::uuid
     )
     SELECT o.id, o.lecture_id, l.public_id, l.title, l.speaker, o.start_s, o.end_s, o.text, o.chapter_title,
            l.duration_s, o.words, array_to_string((string_to_array(o.text, ' '))[1:28], ' ') AS snippet
       FROM ordered o JOIN lectures l ON l.id = o.lecture_id
      WHERE (o.rn - 1) % greatest(1, ceil(o.total::numeric / $2)::int) = 0
      ORDER BY o.start_s
      LIMIT $2`,
    [lectureId, limit],
  );
  return rows.map(toHit);
}
