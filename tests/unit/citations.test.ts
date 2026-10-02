import { describe, expect, it } from "vitest";

import { cleanFollowUps, validateAnswer } from "@/lib/citations";

const retrieved = [{ segmentId: 812 }, { segmentId: 813 }, { segmentId: 900 }];

describe("validateAnswer", () => {
  it("renumbers valid citations in reading order", () => {
    const result = validateAnswer(
      { answer: "Regularize the model [S900]. Use early stopping [S812].", cited_segment_ids: [900, 812] },
      retrieved,
    );
    expect(result.status).toBe("answered");
    expect(result.answer).toBe("Regularize the model [1]. Use early stopping [2].");
    expect(result.citations.map((c) => [c.n, c.segmentId])).toEqual([
      [1, 900],
      [2, 812],
    ]);
  });

  it("drops hallucinated ids and their markers", () => {
    const result = validateAnswer(
      { answer: "Dropout helps [S999]. Early stopping too [S813].", cited_segment_ids: [999, 813] },
      retrieved,
    );
    expect(result.answer).toBe("Dropout helps. Early stopping too [1].");
    expect(result.citations.map((c) => c.segmentId)).toEqual([813]);
    expect(result.dropped).toBe(1); // S999, counted once
  });

  it("handles grouped and repeated markers", () => {
    const result = validateAnswer(
      { answer: "Both say so [S812, S813]. Again [S812][S813].", cited_segment_ids: [] },
      retrieved,
    );
    expect(result.answer).toBe("Both say so [1][2]. Again [1][2].");
    expect(result.citations).toHaveLength(2);
  });

  it("keeps listed ids the text forgot to mark", () => {
    const result = validateAnswer({ answer: "Use a validation set.", cited_segment_ids: [813] }, retrieved);
    expect(result.status).toBe("answered");
    expect(result.citations.map((c) => c.segmentId)).toEqual([813]);
  });

  it("refuses when nothing valid survives", () => {
    expect(
      validateAnswer({ answer: "The IPL was won by [S1].", cited_segment_ids: [1, 2] }, retrieved),
    ).toMatchObject({ status: "not_found", answer: null, citations: [] });
    expect(validateAnswer({ answer: "Not covered.", cited_segment_ids: [] }, retrieved).status).toBe("not_found");
  });
});

describe("cleanFollowUps", () => {
  const q = "How do I stop overfitting?";

  it("trims, collapses whitespace and keeps at most three", () => {
    expect(cleanFollowUps(["  What is   dropout? ", "What is L1?", "What is L2?", "What is early stopping?"], q)).toEqual([
      "What is dropout?",
      "What is L1?",
      "What is L2?",
    ]);
  });

  it("drops empties, over-long text, duplicates and the learner's own question", () => {
    const long = `Why ${"really ".repeat(30)}?`;
    expect(cleanFollowUps(["", long, "What is dropout?", "what is DROPOUT", "How do I stop overfitting"], q)).toEqual([
      "What is dropout?",
    ]);
  });

  it("handles a missing list", () => {
    expect(cleanFollowUps(undefined, q)).toEqual([]);
  });
});
