import "server-only";
import { randomBytes } from "node:crypto";
import { cache } from "react";

import { query } from "@/lib/db";
import { log } from "@/lib/log";
import { CACHE_TTL_HOURS, questionKey } from "@/lib/question-key";

// Unguessable, URL-safe, 10 characters (60 bits): links are shareable but not enumerable.
const newId = () => randomBytes(8).toString("base64url").slice(0, 10);

export type StoredAnswer = { id: string; question: string; result: unknown; createdAt: string };

// Best-effort: an answer that can't be stored is still shown, just without a share link.
// `lectureId` is the session an Ask was scoped to (null = whole library), so reuse never crosses scopes.
export async function saveAnswer(question: string, result: unknown, lectureId: string | null = null): Promise<string | null> {
  const id = newId();
  try {
    await query(`INSERT INTO answers (id, question, result, question_key, lecture_id) VALUES ($1, $2, $3, $4, $5)`, [
      id,
      question.slice(0, 300),
      JSON.stringify(result),
      questionKey(question),
      lectureId,
    ]);
    return id;
  } catch (error) {
    log("answers.save_failed", { error: error instanceof Error ? error.message.slice(0, 120) : String(error) });
    return null;
  }
}

// cache(): generateMetadata and the page share one query per request.
export const getAnswer = cache(async (id: string): Promise<StoredAnswer | null> => {
  if (!/^[A-Za-z0-9_-]{10}$/.test(id)) return null;
  const [row] = await query<{ id: string; question: string; result: unknown; created_at: Date }>(
    `SELECT id, question, result, created_at FROM answers WHERE id = $1`,
    [id],
  );
  return row ? { id: row.id, question: row.question, result: row.result, createdAt: row.created_at.toISOString() } : null;
});

export async function recordFeedback(id: string, helpful: boolean): Promise<boolean> {
  const column = helpful ? "helpful" : "unhelpful";
  const rows = await query(`UPDATE answers SET ${column} = ${column} + 1 WHERE id = $1 RETURNING id`, [id]);
  return rows.length > 0;
}

// Answer reuse: the stored answer for the same question in the same scope, if it is recent AND no session has
// been added, published or changed since (a changed library could make the old citations wrong). Best-effort:
// any failure just means "no cached answer" and the question is answered normally.
export async function findCachedAnswer(question: string, lectureId: string | null): Promise<{ id: string; result: Record<string, unknown> } | null> {
  const key = questionKey(question);
  if (!key) return null;
  try {
    const [row] = await query<{ id: string; result: Record<string, unknown> }>(
      `SELECT id, result FROM answers
        WHERE question_key = $1 AND lecture_id IS NOT DISTINCT FROM $2::uuid
          AND created_at > now() - make_interval(hours => $3)
          AND created_at >= (SELECT coalesce(max(updated_at), 'epoch'::timestamptz) FROM lectures)
        ORDER BY created_at DESC LIMIT 1`,
      [key, lectureId, CACHE_TTL_HOURS],
    );
    return row ?? null;
  } catch (error) {
    log("answers.cache_failed", { error: error instanceof Error ? error.message.slice(0, 120) : String(error) });
    return null;
  }
}
