import "server-only";
import { randomBytes } from "node:crypto";
import { cache } from "react";

import { query } from "@/lib/db";
import { log } from "@/lib/log";

// Unguessable, URL-safe, 10 characters (60 bits): links are shareable but not enumerable.
const newId = () => randomBytes(8).toString("base64url").slice(0, 10);

export type StoredAnswer = { id: string; question: string; result: unknown; createdAt: string };

// Best-effort: an answer that can't be stored is still shown, just without a share link.
export async function saveAnswer(question: string, result: unknown): Promise<string | null> {
  const id = newId();
  try {
    await query(`INSERT INTO answers (id, question, result) VALUES ($1, $2, $3)`, [id, question.slice(0, 300), JSON.stringify(result)]);
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
