import { describe, expect, it } from "vitest";

import { reelUrl } from "@/lib/media";
import { applyQuizResult, weakKey, weakSpotClips, WEAK_SPOT_LIMIT, type WeakSpot } from "@/lib/weak-spots";

const spot = (question: string, at = 1, lectureId = "L1"): WeakSpot => ({
  key: weakKey(lectureId, question),
  lectureId,
  publicId: `pravaha/${lectureId}`,
  title: "Session",
  question,
  answer: "A",
  explanation: "Because.",
  segmentId: at,
  startS: at * 10,
  endS: at * 10 + 8,
  at,
});

describe("applyQuizResult", () => {
  it("adds a wrong answer at the front, newest first", () => {
    const list = applyQuizResult(applyQuizResult([], spot("Q1", 1), false), spot("Q2", 2), false);
    expect(list.map((s) => s.question)).toEqual(["Q2", "Q1"]);
  });

  it("clears a question once it is answered correctly", () => {
    const list = applyQuizResult([spot("Q1"), spot("Q2", 2)], spot("Q1"), true);
    expect(list.map((s) => s.question)).toEqual(["Q2"]);
  });

  it("does not duplicate a question missed again: it moves to the front", () => {
    const list = applyQuizResult([spot("Q1", 1), spot("Q2", 2)], spot("Q2", 3), false);
    expect(list.map((s) => [s.question, s.at])).toEqual([["Q2", 3], ["Q1", 1]]);
  });

  it("keys a question by session and normalised text, so the same text in two sessions stays separate", () => {
    expect(weakKey("L1", " What is X? ")).toBe(weakKey("L1", "what is x?"));
    expect(weakKey("L1", "Q")).not.toBe(weakKey("L2", "Q"));
  });

  it("keeps at most the limit", () => {
    let list: WeakSpot[] = [];
    for (let i = 0; i < WEAK_SPOT_LIMIT + 5; i++) list = applyQuizResult(list, spot(`Q${i}`, i), false);
    expect(list).toHaveLength(WEAK_SPOT_LIMIT);
    expect(list[0]!.question).toBe(`Q${WEAK_SPOT_LIMIT + 4}`);
  });
});

describe("weakSpotClips", () => {
  it("labels each clip with its question and builds a reel across sessions, capped at 5 clips", () => {
    const spots = Array.from({ length: 7 }, (_, i) => spot(`Question ${i + 1}`, i + 1, `L${i % 2}`));
    const clips = weakSpotClips(spots);
    expect(clips[0]!.label).toBe("1 · Question 1");
    const reel = reelUrl(clips)!;
    expect(reel.clips).toBe(5);
    expect(reel.url).toContain("fl_splice");
  });

  it("shortens long questions in the label", () => {
    const [clip] = weakSpotClips([spot("Why does the learning rate need to decrease during training of deep networks?")]);
    expect(clip!.label!.length).toBeLessThanOrEqual(50);
    expect(clip!.label).toMatch(/…$/);
  });
});
