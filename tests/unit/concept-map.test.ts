import { describe, expect, it } from "vitest";

import { conceptKey, groupConcepts } from "@/lib/concept-map";

const entry = (lectureId: string, name: string, segmentId = 1) => ({ lectureId, name, segmentId });

describe("conceptKey", () => {
  it("ignores case, punctuation, plurals, stop words and word order", () => {
    expect(conceptKey("Overfitting")).toBe("overfitting");
    expect(conceptKey(" overfitting. ")).toBe("overfitting");
    expect(conceptKey("Learning Rates")).toBe(conceptKey("rate of learning"));
    expect(conceptKey("The Bias–Variance Trade-off")).toBe("bias-off-trade-variance");
  });

  it("keeps short words and double-s words intact", () => {
    expect(conceptKey("Bias")).toBe("bias");
    expect(conceptKey("Class")).toBe("class");
  });

  it("returns an empty key for names with no Latin letters", () => {
    expect(conceptKey("ओवरफिटिंग")).toBe("");
  });
});

describe("groupConcepts", () => {
  it("merges the same concept across sessions and puts the most-taught first", () => {
    const groups = groupConcepts([
      entry("A", "Underfitting"),
      entry("A", "Overfitting"),
      entry("B", "overfitting"),
      entry("C", "Overfitting"),
    ]);
    expect(groups.map((g) => [g.name, g.entries.length])).toEqual([
      ["Overfitting", 3],
      ["Underfitting", 1],
    ]);
  });

  it("counts a session once per concept, even if it names it twice", () => {
    const [group] = groupConcepts([entry("A", "Momentum", 1), entry("A", "momentum", 2)]);
    expect(group!.entries).toEqual([entry("A", "Momentum", 1)]);
  });

  it("uses the most common spelling as the display name", () => {
    const [group] = groupConcepts([entry("A", "Gradient descent"), entry("B", "Gradient Descent"), entry("C", "Gradient Descent")]);
    expect(group!.name).toBe("Gradient Descent");
  });

  it("drops concepts that cannot be keyed", () => {
    expect(groupConcepts([entry("A", "???")])).toEqual([]);
  });
});
