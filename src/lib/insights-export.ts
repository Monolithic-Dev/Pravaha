// Insights as CSV, one report per file, for an organizer's spreadsheet or LMS report. Pure, so it is unit-tested.

import { toCsv } from "@/lib/csv";
import { formatTime } from "@/lib/format";
import type { Insights } from "@/lib/insights";

export const INSIGHT_REPORTS = ["gaps", "questions", "moments", "daily", "sessions"] as const;
export type InsightReport = (typeof INSIGHT_REPORTS)[number];

export function insightsCsv(report: InsightReport, insights: Insights, origin: string): string {
  const watch = (lectureId: string, startS = 0) => `${origin}/watch/${lectureId}${startS >= 1 ? `?t=${Math.floor(startS)}` : ""}`;
  switch (report) {
    case "gaps":
      return toCsv(
        ["question", "times_asked", "last_asked"],
        insights.gaps.map((g) => [g.question, g.times, g.lastAsked]),
      );
    case "questions":
      return toCsv(
        ["question", "times_asked", "times_answered", "answered_percent"],
        insights.topQuestions.map((q) => [q.question, q.times, q.answered, Math.round((q.answered / q.times) * 100)]),
      );
    case "moments":
      return toCsv(
        ["session", "at", "start_seconds", "quote", "opens", "shares", "url"],
        insights.topMoments.map((m) => [
          m.title,
          formatTime(m.startS),
          Math.floor(m.startS),
          m.text,
          m.opens,
          m.shares,
          watch(m.lectureId, m.startS),
        ]),
      );
    case "daily":
      return toCsv(
        ["date", "answered", "not_answered"],
        insights.daily.map((d) => [d.day, d.answered, d.unanswered]),
      );
    case "sessions":
      return toCsv(
        ["session", "answers_cited_in", "url"],
        insights.topSessions.map((s) => [s.title, s.answers, watch(s.lectureId)]),
      );
  }
}
