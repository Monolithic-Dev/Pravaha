import { describe, expect, it } from "vitest";

import { MAX_SOURCES, mergeHits, needsUnderstanding, searchStringFor } from "@/lib/query-plan";

describe("needsUnderstanding", () => {
  it("rewrites questions in another script, and English ones that keyword search found little for", () => {
    expect(needsUnderstanding("ओवरफिटिंग क्या है?", 0)).toBe(true);
    expect(needsUnderstanding("ஓவர்ஃபிட்டிங் என்றால் என்ன?", 9)).toBe(true);
    expect(needsUnderstanding("What is the bias-variance trade-off?", 0)).toBe(true);
    expect(needsUnderstanding("What is the bias-variance trade-off?", 2)).toBe(true);
    expect(needsUnderstanding("Why does momentum help?", 5)).toBe(false);
  });
});

describe("mergeHits", () => {
  const h = (segmentId: number) => ({ segmentId });

  it("keeps keyword hits first, adds new expansion hits, drops duplicates", () => {
    expect(mergeHits([h(3), h(1)], [h(1), h(7), h(3), h(9)]).map((x) => x.segmentId)).toEqual([3, 1, 7, 9]);
  });

  it("caps the number of sources", () => {
    const many = Array.from({ length: 30 }, (_, i) => h(i));
    expect(mergeHits(many.slice(0, 5), many.slice(5))).toHaveLength(MAX_SOURCES);
  });
});

describe("searchStringFor", () => {
  it("splits hyphenated phrases so Postgres matches the words separately, de-duplicated", () => {
    expect(searchStringFor("What is the bias-variance trade-off?", ["underfitting", "Model complexity", "trade-off"])).toBe(
      "what is the bias variance trade off underfitting model complexity",
    );
  });
});
