import "server-only";
import { cache } from "react";

import { groupConcepts, type ConceptGroup } from "@/lib/concept-map";
import { query } from "@/lib/db";
import { momentsBySegmentIds, retrieveForQuestion, type Hit } from "@/lib/search";

export const COMPARE_MAX = 5; // an Answer/Compare Reel holds 5 clips (media.ts REEL_MAX_CLIPS)

// Every concept the published library's Study Packs name, grouped across sessions.
export const listConcepts = cache(async (): Promise<ConceptGroup[]> => {
  const rows = await query<{ lecture_id: string; name: string; segment_id: string }>(
    `SELECT sp.lecture_id, c->>'name' AS name, c->>'segmentId' AS segment_id
       FROM study_packs sp
       JOIN lectures l ON l.id = sp.lecture_id,
            jsonb_array_elements(sp.pack->'concepts') AS c
      WHERE l.status = 'ready' AND l.visibility = 'public' AND l.trial_expires_at IS NULL
      ORDER BY l.created_at, sp.lecture_id`,
  );
  return groupConcepts(rows.map((r) => ({ lectureId: r.lecture_id, segmentId: Number(r.segment_id), name: r.name })));
});

export type ConceptMoment = Hit & { related: boolean };
export type ConceptView = { key: string; name: string; taughtBy: number; moments: ConceptMoment[] };

// One concept: the moments the Study Packs point at, then — for sessions that teach it without naming it
// as a key concept — the closest moment each of them has, so a comparison draws on as many teachers as it can.
export const getConcept = cache(async (key: string): Promise<ConceptView | null> => {
  const group = (await listConcepts()).find((g) => g.key === key);
  if (!group) return null;
  const tagged = await momentsBySegmentIds(group.entries.map((e) => e.segmentId));
  const seen = new Set(tagged.map((m) => m.lectureId));
  const related = (await retrieveForQuestion(group.name, { limit: 12 })).filter((h) => !seen.has(h.lectureId) && seen.add(h.lectureId));
  const moments = [...tagged.map((m) => ({ ...m, related: false })), ...related.map((m) => ({ ...m, related: true }))].slice(0, COMPARE_MAX);
  return { key, name: group.name, taughtBy: group.entries.length, moments };
});
