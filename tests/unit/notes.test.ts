import { describe, expect, it } from "vitest";

import { buildNotes, hasContent, notesFilename, notesToMarkdown } from "@/lib/notes";
import type { StudyPack } from "@/lib/study-pack-schema";

const lecture = { id: "11111111-1111-4111-8111-111111111111", title: "Gradient Descent: Basics", speaker: "Prof. Rao", durationS: 754 };
const baseUrl = "https://pravaha.test";
const m = (segmentId: number, startS: number) => ({ segmentId, startS, endS: startS + 10 });

const pack: StudyPack = {
  summary: ["Gradient descent minimises a loss.", "Learning rate sets the step."],
  concepts: [
    { ...m(3, 120.4), name: "Learning rate" },
    { ...m(1, 15), name: "Loss function" },
  ],
  quiz: [{ ...m(2, 61.9), question: "What does the learning rate control?", options: ["Step size", "Depth", "Width", "Bias"], correctIndex: 0, explanation: "It scales each update." }],
  highlights: [],
};
const segments = [
  { startS: 0, chapterTitle: "Intro" },
  { startS: 20, chapterTitle: "Intro" },
  { startS: 60, chapterTitle: "Update rule" },
  { startS: 130, chapterTitle: null },
];

describe("buildNotes", () => {
  const notes = buildNotes({ lecture, segments, pack, baseUrl });

  it("links every point to its second in the session", () => {
    expect(notes.watchUrl).toBe(`${baseUrl}/watch/${lecture.id}?t=0`);
    expect(notes.concepts.map((c) => [c.name, c.label, c.url])).toEqual([
      ["Loss function", "0:15", `${baseUrl}/watch/${lecture.id}?t=15`],
      ["Learning rate", "2:00", `${baseUrl}/watch/${lecture.id}?t=120`],
    ]);
    expect(notes.quiz[0]).toMatchObject({ answer: "Step size", label: "1:01" });
  });

  it("builds chapters from consecutive segments with the same title", () => {
    expect(notes.chapters.map((c) => [c.title, c.label])).toEqual([["Intro", "0:00"], ["Update rule", "1:00"]]);
  });

  it("still makes a useful sheet from chapters alone when there is no Study Pack", () => {
    const bare = buildNotes({ lecture, segments, pack: null, baseUrl });
    expect(bare.summary).toEqual([]);
    expect(hasContent(bare)).toBe(true);
    expect(hasContent(buildNotes({ lecture, segments: [], pack: null, baseUrl }))).toBe(false);
  });
});

describe("notesToMarkdown", () => {
  const md = notesToMarkdown(buildNotes({ lecture, segments, pack, baseUrl }));

  it("writes headings, timestamp links and the quiz answers", () => {
    expect(md).toContain("# Gradient Descent: Basics");
    expect(md).toContain("Prof. Rao · 12:34 · [Watch the session](https://pravaha.test/watch/");
    expect(md).toContain("- **Learning rate** · [2:00](https://pravaha.test/watch/11111111-1111-4111-8111-111111111111?t=120)");
    expect(md).toContain("## Chapters");
    expect(md).toContain("1. What does the learning rate control?");
    expect(md).toContain("   - **Answer:** Step size");
  });

  it("leaves out sections that are empty", () => {
    const md2 = notesToMarkdown(buildNotes({ lecture, segments: [], pack: { ...pack, quiz: [] }, baseUrl }));
    expect(md2).not.toContain("## Chapters");
    expect(md2).not.toContain("## Check yourself");
    expect(md2).toContain("## In short");
  });
});

describe("notesFilename", () => {
  it("makes a safe .md name", () => {
    expect(notesFilename("Gradient Descent: Basics!")).toBe("gradient-descent-basics.md");
    expect(notesFilename("???")).toBe("study-notes.md");
  });
});
