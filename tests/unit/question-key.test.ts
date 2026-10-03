import { describe, expect, it } from "vitest";

import { fixPunctuation } from "@/lib/language";
import { questionKey } from "@/lib/question-key";

describe("questionKey", () => {
  it("treats case, spacing and a trailing question mark as the same question", () => {
    const k = questionKey("What is momentum in gradient descent?");
    expect(questionKey("what is momentum in gradient descent")).toBe(k);
    expect(questionKey("  What  is MOMENTUM in gradient descent ?? ")).toBe(k);
    expect(questionKey("What is momentum in gradient descent!")).toBe(k);
  });

  it("keeps different questions apart", () => {
    expect(questionKey("What is momentum?")).not.toBe(questionKey("What is RMSProp?"));
    expect(questionKey("learning rate too high")).not.toBe(questionKey("learning rate too low"));
  });

  it("strips the Devanagari danda and normalises compatibility characters", () => {
    expect(questionKey("ओवरफिटिंग क्या है?")).toBe("ओवरफिटिंग क्या है");
    expect(questionKey("ओवरफिटिंग क्या है।")).toBe("ओवरफिटिंग क्या है");
    expect(questionKey("Ｏｖｅｒｆｉｔｔｉｎｇ？")).toBe("overfitting");
  });

  it("returns an empty key for punctuation only", () => {
    expect(questionKey(" ?? ")).toBe("");
  });
});

describe("fixPunctuation", () => {
  it("replaces the CJK full stop with the danda for Hindi, Bengali and Punjabi", () => {
    expect(fixPunctuation("यह उत्तर है。और यह भी。", "Hindi (Devanagari script)")).toBe("यह उत्तर है।और यह भी।");
    expect(fixPunctuation("a。", "Bengali")).toBe("a।");
    expect(fixPunctuation("a。", "Punjabi (Gurmukhi script)")).toBe("a।");
  });

  it("uses a plain full stop for other languages, and leaves clean text and English alone", () => {
    expect(fixPunctuation("a。", "Tamil")).toBe("a.");
    expect(fixPunctuation("Already fine.", "Tamil")).toBe("Already fine.");
    expect(fixPunctuation("a。", null)).toBe("a。");
  });
});
