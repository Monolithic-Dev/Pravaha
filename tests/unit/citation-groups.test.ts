import { describe, expect, it } from "vitest";

import { citationLabel, groupCitations, type CitationLike } from "@/lib/citation-groups";

const cite = (n: number, lectureId: string, startS: number, endS: number): CitationLike => ({
  n,
  segmentId: n,
  lectureId,
  publicId: `pravaha/${lectureId}`,
  title: lectureId,
  speaker: null,
  startS,
  endS,
  text: `t${n}`,
  chapterTitle: null,
  durationS: 300,
  words: [],
  snippet: [{ text: `t${n}`, hit: false }],
});

describe("groupCitations", () => {
  it("merges back-to-back moments of one session into one card", () => {
    const groups = groupCitations([cite(1, "a", 10, 20), cite(2, "a", 20.5, 30), cite(3, "b", 5, 9), cite(4, "a", 31, 40)]);
    expect(groups.map((g) => [g.ns, g.startS, g.endS])).toEqual([
      [[1, 2, 4], 10, 40],
      [[3], 5, 9],
    ]);
    expect(groups[0]!.text).toBe("t1 t2 t4");
  });

  it("merges regardless of citation order, but keeps distant moments apart", () => {
    const groups = groupCitations([cite(1, "a", 100, 110), cite(2, "a", 10, 20), cite(3, "a", 20, 25)]);
    expect(groups.map((g) => g.ns)).toEqual([[1], [2, 3]]);
  });

  it("never merges past the 60-second clip cap", () => {
    const groups = groupCitations([cite(1, "a", 0, 25), cite(2, "a", 25, 50), cite(3, "a", 50, 75)]);
    expect(groups.map((g) => g.ns)).toEqual([[1, 2], [3]]);
  });
});

describe("citationLabel", () => {
  it("writes runs as ranges and the rest as lists", () => {
    expect(citationLabel([2])).toBe("2");
    expect(citationLabel([1, 2])).toBe("1, 2");
    expect(citationLabel([1, 2, 3])).toBe("1–3");
    expect(citationLabel([1, 3])).toBe("1, 3");
  });
});
