import "server-only";
import { cache } from "react";

import { query } from "@/lib/db";
import type { TimedWord } from "@/lib/segments";
import { pickSuggestions, type PackLike } from "@/lib/suggestions";

export type LectureStatus = "processing" | "ready" | "transcript_failed";
export type Visibility = "unlisted" | "public";

export type Lecture = {
  id: string;
  publicId: string;
  title: string;
  speaker: string | null;
  status: LectureStatus;
  visibility: Visibility;
  durationS: number | null;
  createdAt: string;
  // Set only on public trial sessions (/try), which are deleted at this time (src/lib/trials.ts).
  trialExpiresAt: string | null;
};

type Row = {
  id: string;
  public_id: string;
  title: string;
  speaker: string | null;
  status: LectureStatus;
  visibility: Visibility;
  duration_s: number | null;
  created_at: Date;
  trial_expires_at: Date | null;
};

const COLUMNS = "id, public_id, title, speaker, status, visibility, duration_s, created_at, trial_expires_at";

const toLecture = (r: Row): Lecture => ({
  id: r.id,
  publicId: r.public_id,
  title: r.title,
  speaker: r.speaker,
  status: r.status,
  visibility: r.visibility,
  durationS: r.duration_s,
  createdAt: r.created_at.toISOString(),
  trialExpiresAt: r.trial_expires_at?.toISOString() ?? null,
});

export async function createLecture(input: {
  title: string;
  speaker?: string;
  trial?: { expiresAt: Date; ipHash: string };
}): Promise<Lecture> {
  const id = crypto.randomUUID();
  const rows = await query<Row>(
    `INSERT INTO lectures (id, public_id, title, speaker, rights_confirmed_at, trial_expires_at, trial_ip_hash)
     VALUES ($1, $2, $3, $4, now(), $5, $6) RETURNING ${COLUMNS}`,
    [id, `pravaha/${id}`, input.title, input.speaker || null, input.trial?.expiresAt ?? null, input.trial?.ipHash ?? null],
  );
  return toLecture(rows[0]!);
}

// The library (public) or, for organizers, every session. Trials never appear in either.
export async function listLectures({ includeAll }: { includeAll: boolean }): Promise<Lecture[]> {
  const where = includeAll ? "WHERE trial_expires_at IS NULL" : "WHERE status = 'ready' AND visibility = 'public'";
  const rows = await query<Row>(`SELECT ${COLUMNS} FROM lectures ${where} ORDER BY created_at DESC LIMIT 200`);
  return rows.map(toLecture);
}

// What the pipeline produced for each session, for the Studio: indexed moments, chapters and the Study Pack.
export type StudioSession = Lecture & { moments: number; chapters: number; hasStudyPack: boolean };

export async function listStudioSessions({ includeAll }: { includeAll: boolean }): Promise<StudioSession[]> {
  const where = includeAll ? "WHERE l.trial_expires_at IS NULL" : "WHERE l.status = 'ready' AND l.visibility = 'public'";
  const rows = await query<Row & { moments: string; chapters: string; has_pack: boolean }>(
    `SELECT ${COLUMNS.split(", ").map((c) => `l.${c}`).join(", ")},
            (SELECT count(*) FROM segments s WHERE s.lecture_id = l.id) AS moments,
            (SELECT count(DISTINCT chapter_title) FROM segments s WHERE s.lecture_id = l.id) AS chapters,
            EXISTS (SELECT 1 FROM study_packs sp WHERE sp.lecture_id = l.id) AS has_pack
       FROM lectures l ${where}
      ORDER BY l.created_at DESC LIMIT 200`,
  );
  return rows.map((r) => ({ ...toLecture(r), moments: Number(r.moments), chapters: Number(r.chapters), hasStudyPack: r.has_pack }));
}

export async function getLecture(id: string): Promise<Lecture | null> {
  const rows = await query<Row>(`SELECT ${COLUMNS} FROM lectures WHERE id = $1`, [id]);
  return rows[0] ? toLecture(rows[0]) : null;
}

export async function getLectureByPublicId(publicId: string): Promise<Lecture | null> {
  const rows = await query<Row>(`SELECT ${COLUMNS} FROM lectures WHERE public_id = $1`, [publicId]);
  return rows[0] ? toLecture(rows[0]) : null;
}

export async function updateLecture(
  id: string,
  patch: { visibility?: Visibility; title?: string; speaker?: string },
): Promise<Lecture | null> {
  const rows = await query<Row>(
    `UPDATE lectures SET
       visibility = coalesce($2, visibility),
       title      = coalesce($3, title),
       speaker    = coalesce($4, speaker),
       updated_at = now()
     WHERE id = $1 RETURNING ${COLUMNS}`,
    [id, patch.visibility ?? null, patch.title ?? null, patch.speaker ?? null],
  );
  return rows[0] ? toLecture(rows[0]) : null;
}

export type SegmentRow = { id: number; startS: number; endS: number; text: string; chapterTitle: string | null; words: TimedWord[] };

export async function getSegments(lectureId: string): Promise<SegmentRow[]> {
  const rows = await query<{ id: string; start_s: number; end_s: number; text: string; chapter_title: string | null; words: TimedWord[] }>(
    `SELECT id, start_s, end_s, text, chapter_title, words FROM segments WHERE lecture_id = $1 ORDER BY start_s`,
    [lectureId],
  );
  return rows.map((r) => ({ id: Number(r.id), startS: r.start_s, endS: r.end_s, text: r.text, chapterTitle: r.chapter_title, words: r.words }));
}

// The library's most-covered chapter topics — used as "try asking" chips on the home page.
export async function popularTopics(limit = 4): Promise<string[]> {
  const rows = await query<{ chapter_title: string }>(
    `SELECT s.chapter_title
       FROM segments s JOIN lectures l ON l.id = s.lecture_id
      WHERE l.status = 'ready' AND l.visibility = 'public' AND s.chapter_title IS NOT NULL
      GROUP BY s.chapter_title
      ORDER BY count(*) DESC, s.chapter_title
      LIMIT $1`,
    [limit],
  );
  return rows.map((r) => r.chapter_title);
}

// Home-page Ask suggestions: real questions from published sessions' Study Packs (src/lib/suggestions.ts),
// newest sessions first. Falls back to the most common chapter titles before any Study Pack exists.
export async function suggestedQuestions(limit = 4): Promise<string[]> {
  const rows = await query<{ pack: PackLike }>(
    `SELECT sp.pack
       FROM study_packs sp JOIN lectures l ON l.id = sp.lecture_id
      WHERE l.status = 'ready' AND l.visibility = 'public'
      ORDER BY l.created_at DESC
      LIMIT 12`,
  );
  const questions = pickSuggestions(rows.map((r) => r.pack), limit);
  return questions.length ? questions : popularTopics(limit);
}

export type Moment = SegmentRow & { lecture: Lecture };

// One segment with its session — the data behind a shared Moment page (/m/[segmentId]).
// Reachable by link whatever the session's visibility, like /watch (you were given the link).
// cache(): generateMetadata and the page share one query per request.
export const getMoment = cache(async (segmentId: number): Promise<Moment | null> => {
  const rows = await query<Row & { segment_id: string; start_s: number; end_s: number; text: string; chapter_title: string | null; words: TimedWord[] }>(
    `SELECT ${COLUMNS.split(", ").map((c) => `l.${c}`).join(", ")},
            s.id AS segment_id, s.start_s, s.end_s, s.text, s.chapter_title, s.words
       FROM segments s JOIN lectures l ON l.id = s.lecture_id
      WHERE s.id = $1`,
    [segmentId],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    id: Number(r.segment_id),
    startS: r.start_s,
    endS: r.end_s,
    text: r.text,
    chapterTitle: r.chapter_title,
    words: r.words,
    lecture: toLecture(r),
  };
});
