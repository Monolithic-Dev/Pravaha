import "server-only";

import { query } from "@/lib/db";
import { log } from "@/lib/log";

export type AskStatus = "answered" | "not_found" | "fallback";

// Best-effort analytics: never block or fail the learner's request.
export async function logAsk(question: string, status: AskStatus, lectureIds: string[]): Promise<void> {
  try {
    await query(`INSERT INTO ask_log (question, status, lecture_ids) VALUES ($1, $2, $3::uuid[])`, [
      question.slice(0, 300),
      status,
      [...new Set(lectureIds)],
    ]);
  } catch (error) {
    log("insights.log_failed", { error: error instanceof Error ? error.message.slice(0, 120) : String(error) });
  }
}

export async function recordMomentEvent(segmentId: number, kind: "open" | "share"): Promise<boolean> {
  const rows = await query(
    `INSERT INTO moment_events (segment_id, kind) SELECT id, $2 FROM segments WHERE id = $1 RETURNING id`,
    [segmentId, kind],
  );
  return rows.length > 0;
}

export type Insights = {
  gaps: { question: string; times: number; lastAsked: string }[];
  topQuestions: { question: string; times: number; answered: number }[];
  topMoments: { segmentId: number; lectureId: string; title: string; startS: number; text: string; opens: number; shares: number }[];
  totals: { questions: number; answeredRate: number; shares: number };
  // 👍/👎 on answers (src/lib/answers.ts); null if the answers table isn't there yet.
  feedback: { helpful: number; unhelpful: number } | null;
};

const WINDOW = `now() - interval '30 days'`;

// The public demo Studio shows real aggregates, but learner-typed text is shown only if it reads like a
// question: no links, e-mail addresses or long digit runs (phone numbers).
const LOOKS_PRIVATE = /https?:|www\.|\S+@\S+|\d{6,}/i;
export function forDemo(insights: Insights): Insights {
  const shown = (q: string) => !LOOKS_PRIVATE.test(q);
  return {
    ...insights,
    gaps: insights.gaps.filter((g) => shown(g.question)),
    topQuestions: insights.topQuestions.filter((q) => shown(q.question)),
  };
}

// Questions are grouped case- and whitespace-insensitively, so "What is dropout?" and "what is  dropout" count together.
// `publishedOnly` (the public demo Studio): Moments only from published sessions, so an unlisted session's
// title and words never show up there.
export async function getInsights({ publishedOnly = false } = {}): Promise<Insights> {
  const momentScope = publishedOnly ? `AND l.status = 'ready' AND l.visibility = 'public'` : "";
  const [gaps, topQuestions, topMoments, totals] = await Promise.all([
    query<{ question: string; times: string; last_asked: Date }>(
      `SELECT min(question) AS question, count(*) AS times, max(created_at) AS last_asked
         FROM ask_log WHERE status = 'not_found' AND created_at > ${WINDOW}
        GROUP BY lower(regexp_replace(trim(question), '\\s+', ' ', 'g'))
        ORDER BY count(*) DESC, max(created_at) DESC LIMIT 10`,
    ),
    query<{ question: string; times: string; answered: string }>(
      `SELECT min(question) AS question, count(*) AS times, count(*) FILTER (WHERE status = 'answered') AS answered
         FROM ask_log WHERE created_at > ${WINDOW}
        GROUP BY lower(regexp_replace(trim(question), '\\s+', ' ', 'g'))
        ORDER BY count(*) DESC LIMIT 10`,
    ),
    query<{ segment_id: string; lecture_id: string; title: string; start_s: number; text: string; opens: string; shares: string }>(
      `SELECT s.id AS segment_id, l.id AS lecture_id, l.title, s.start_s, s.text,
              count(*) FILTER (WHERE e.kind = 'open') AS opens, count(*) FILTER (WHERE e.kind = 'share') AS shares
         FROM moment_events e JOIN segments s ON s.id = e.segment_id JOIN lectures l ON l.id = s.lecture_id
        WHERE e.created_at > ${WINDOW} ${momentScope}
        GROUP BY s.id, l.id
        ORDER BY count(*) FILTER (WHERE e.kind = 'share') DESC, count(*) DESC LIMIT 10`,
    ),
    query<{ questions: string; answered: string; shares: string }>(
      `SELECT (SELECT count(*) FROM ask_log WHERE created_at > ${WINDOW}) AS questions,
              (SELECT count(*) FROM ask_log WHERE created_at > ${WINDOW} AND status = 'answered') AS answered,
              (SELECT count(*) FROM moment_events WHERE created_at > ${WINDOW} AND kind = 'share') AS shares`,
    ),
  ]);
  const t = totals[0]!;
  const feedback = await query<{ helpful: string | null; unhelpful: string | null }>(
    `SELECT sum(helpful) AS helpful, sum(unhelpful) AS unhelpful FROM answers WHERE created_at > ${WINDOW}`,
  ).then(
    ([f]) => ({ helpful: Number(f?.helpful ?? 0), unhelpful: Number(f?.unhelpful ?? 0) }),
    () => null,
  );
  return {
    feedback,
    gaps: gaps.map((g) => ({ question: g.question, times: Number(g.times), lastAsked: g.last_asked.toISOString() })),
    topQuestions: topQuestions.map((q) => ({ question: q.question, times: Number(q.times), answered: Number(q.answered) })),
    topMoments: topMoments.map((m) => ({
      segmentId: Number(m.segment_id),
      lectureId: m.lecture_id,
      title: m.title,
      startS: m.start_s,
      text: m.text,
      opens: Number(m.opens),
      shares: Number(m.shares),
    })),
    totals: {
      questions: Number(t.questions),
      answeredRate: Number(t.questions) ? Number(t.answered) / Number(t.questions) : 0,
      shares: Number(t.shares),
    },
  };
}
