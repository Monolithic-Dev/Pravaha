import { describe, expect, it } from "vitest";

import { usesSearchSyntax } from "@/lib/search";

describe("usesSearchSyntax", () => {
  it("treats plain questions as natural language, so Find may fall back to the closest moments", () => {
    for (const q of ["why do we need learning rate decay", "What is the bias-variance trade-off?", "orthogonal vectors"]) {
      expect(usesSearchSyntax(q)).toBe(false);
    }
  });

  it("takes quoted phrases, exclusions and OR literally", () => {
    for (const q of ['"learning rate"', "momentum -nesterov", "-adagrad rmsprop", "dropout or regularization"]) {
      expect(usesSearchSyntax(q)).toBe(true);
    }
  });
});
