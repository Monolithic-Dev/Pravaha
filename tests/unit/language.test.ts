import { describe, expect, it } from "vitest";

import { needsTranslation } from "@/lib/language";

describe("needsTranslation", () => {
  it("translates questions written in another script", () => {
    expect(needsTranslation("ओवरफिटिंग कैसे रोकें?")).toBe(true);
    expect(needsTranslation("overfitting எப்படி தடுப்பது?")).toBe(true);
  });

  it("leaves English, accented Latin and romanised Hindi alone", () => {
    expect(needsTranslation("How do I stop overfitting?")).toBe(false);
    expect(needsTranslation("Qu'est-ce que la régularisation ?")).toBe(false);
    expect(needsTranslation("overfitting kaise roke? (2024)")).toBe(false);
  });
});

describe("answerLanguage", () => {
  it("names the language a question's script implies", async () => {
    const { answerLanguage } = await import("@/lib/language");
    expect(answerLanguage("ओवरफिटिंग क्या है?")).toBe("Hindi (Devanagari script)");
    expect(answerLanguage("ஓவர்ஃபிட்டிங் என்றால் என்ன?")).toBe("Tamil");
    expect(answerLanguage("What is overfitting?")).toBeNull();
    expect(answerLanguage("overfitting kya hai?")).toBeNull(); // Hinglish in Latin script: answer as asked
  });
});
