import { describe, expect, it } from "vitest";

import { toCsv } from "@/lib/csv";
import type { Insights } from "@/lib/insights";
import { insightsCsv } from "@/lib/insights-export";

describe("toCsv", () => {
  it("writes a header and CRLF rows", () => {
    expect(
      toCsv(
        ["a", "b"],
        [
          ["x", 1],
          [null, 2],
        ],
      ),
    ).toBe("a,b\r\nx,1\r\n,2\r\n");
  });

  it("quotes commas, quotes and line breaks", () => {
    expect(toCsv(["q"], [['Bias, "variance"'], ["two\nlines"]])).toBe('q\r\n"Bias, ""variance"""\r\n"two\nlines"\r\n');
  });

  it("neutralises cells a spreadsheet would run as a formula", () => {
    const rows = ['=HYPERLINK("x")', "+1", "-cmd", "@SUM(A1)", "\tx"].map((q) => [q]);
    const lines = toCsv(["q"], rows).trim().split("\r\n").slice(1);
    // The first is also quoted, for its own quotes.
    expect(lines).toEqual([`"'=HYPERLINK(""x"")"`, "'+1", "'-cmd", "'@SUM(A1)", "'\tx"]);
  });

  it("leaves numbers alone, negative ones too", () => {
    expect(toCsv(["n"], [[-3]])).toBe("n\r\n-3\r\n");
  });
});

const insights: Insights = {
  gaps: [{ question: "What is a GAN?", times: 3, lastAsked: "2026-10-02T10:00:00.000Z" }],
  topQuestions: [{ question: "What is dropout?", times: 4, answered: 3 }],
  topMoments: [
    { segmentId: 7, lectureId: "L1", title: "Overfitting", startS: 75.6, text: "Dropout, in short", opens: 5, shares: 2 },
  ],
  totals: { questions: 7, answeredRate: 3 / 7, shares: 2 },
  daily: [{ day: "2026-10-02", answered: 3, unanswered: 1 }],
  topSessions: [{ lectureId: "L1", title: "Overfitting", answers: 3 }],
  feedback: null,
};

describe("insightsCsv", () => {
  const csv = (report: Parameters<typeof insightsCsv>[0]) => insightsCsv(report, insights, "https://p.example").split("\r\n");

  it("exports each report with its own columns", () => {
    expect(csv("gaps").slice(0, 2)).toEqual(["question,times_asked,last_asked", "What is a GAN?,3,2026-10-02T10:00:00.000Z"]);
    expect(csv("questions")[1]).toBe("What is dropout?,4,3,75");
    expect(csv("daily")[1]).toBe("2026-10-02,3,1");
  });

  it("links Moments and sessions back to the recording", () => {
    expect(csv("moments")[1]).toBe('Overfitting,1:15,75,"Dropout, in short",5,2,https://p.example/watch/L1?t=75');
    expect(csv("sessions")[1]).toBe("Overfitting,3,https://p.example/watch/L1");
  });
});
