import { describe, expect, it } from "vitest";

import { assetContext, assetTags, MAX_TAGS } from "@/lib/asset-metadata";

describe("assetTags", () => {
  it("tags the root, the language and each concept, with no commas or spaces", () => {
    const tags = assetTags({ language: "en-US", concepts: ["Overfitting", "Learning Rate Influence"] });
    expect(tags).toEqual(["pravaha", "lang-en-us", "concept-overfitting", "concept-influence-learning-rate"]);
    expect(tags.every((t) => !/[,\s]/.test(t))).toBe(true);
  });

  it("dedupes and caps the tag count", () => {
    const concepts = Array.from({ length: 20 }, (_, i) => `Concept ${i}`);
    expect(assetTags({ language: null, concepts })).toHaveLength(MAX_TAGS);
    expect(assetTags({ language: null, concepts: ["Momentum", "momentum"] })).toEqual(["pravaha", "concept-momentum"]);
  });
});

describe("assetContext", () => {
  it("joins key=value pairs with | and omits empty values", () => {
    expect(assetContext({ title: "Lecture 1", speaker: null, language: "en", concepts: ["A", "B"], moments: 12 })).toBe(
      "title=Lecture 1|language=en|concepts=A, B|moments=12",
    );
  });

  it("escapes the separators inside a value", () => {
    const context = assetContext({ title: "a=b|c", speaker: null, language: null, concepts: [], moments: 1 });
    expect(context).toBe("title=a\\=b\\|c|moments=1");
  });
});
