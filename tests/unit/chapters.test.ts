import { describe, expect, it } from "vitest";

import { chaptersFromSegments, parseChaptersVtt } from "@/lib/chapters";

describe("parseChaptersVtt", () => {
  it("parses cues with and without hours, CRLF and cue ids", () => {
    const vtt = [
      "WEBVTT",
      "",
      "1",
      "00:00:00.000 --> 00:01:30.500",
      "Introduction",
      "",
      "01:30.500 --> 1:02:03.000",
      "Gradient descent",
      "explained",
    ].join("\r\n");
    expect(parseChaptersVtt(vtt)).toEqual([
      { startS: 0, endS: 90.5, title: "Introduction" },
      { startS: 90.5, endS: 3723, title: "Gradient descent explained" },
    ]);
  });

  it("skips cues without a title or with non-positive length", () => {
    const vtt = "WEBVTT\n\n00:00.000 --> 00:10.000\n\n00:10.000 --> 00:05.000\nBackwards";
    expect(parseChaptersVtt(vtt)).toEqual([]);
  });

  it("returns nothing for junk", () => {
    expect(parseChaptersVtt("<html>404</html>")).toEqual([]);
  });
});

describe("chaptersFromSegments", () => {
  it("groups consecutive segments by chapter title", () => {
    const seg = (startS: number, chapterTitle: string | null) => ({ startS, endS: startS + 10, chapterTitle });
    expect(chaptersFromSegments([seg(0, "Intro"), seg(10, "Intro"), seg(20, "Momentum"), seg(30, null), seg(40, "Momentum")])).toEqual([
      { startS: 0, endS: 20, title: "Intro" },
      { startS: 20, endS: 50, title: "Momentum" },
    ]);
  });

  it("is empty when the session has no chapters", () => {
    expect(chaptersFromSegments([{ startS: 0, endS: 5, chapterTitle: null }])).toEqual([]);
  });
});
