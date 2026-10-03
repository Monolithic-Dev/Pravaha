import { describe, expect, it } from "vitest";

import { isVoiceLang, recognitionCtor, transcriptOf, VOICE_LANGS, voiceErrorMessage } from "@/lib/voice";

const result = (transcript: string) => [{ transcript }];

describe("transcriptOf", () => {
  it("joins every result so far and tidies whitespace", () => {
    expect(transcriptOf([result("what is  "), result("momentum")])).toBe("what is momentum");
    expect(transcriptOf([result("  overfitting   क्या है ")])).toBe("overfitting क्या है");
  });

  it("is empty before anything is heard", () => {
    expect(transcriptOf([])).toBe("");
    expect(transcriptOf([[]])).toBe("");
  });
});

describe("recognitionCtor", () => {
  class Fake {}
  it("finds the standard or the webkit-prefixed constructor, or none", () => {
    expect(recognitionCtor({ SpeechRecognition: Fake })).toBe(Fake);
    expect(recognitionCtor({ webkitSpeechRecognition: Fake })).toBe(Fake);
    expect(recognitionCtor({})).toBeNull();
  });
});

describe("voice languages and errors", () => {
  it("offers English (India) and Hindi", () => {
    expect(VOICE_LANGS.map((l) => l.code)).toEqual(["en-IN", "hi-IN"]);
    expect(isVoiceLang("hi-IN")).toBe(true);
    expect(isVoiceLang("fr-FR")).toBe(false);
    expect(isVoiceLang(null)).toBe(false);
  });

  it("explains each failure in plain words, and stays quiet when the learner stopped it", () => {
    expect(voiceErrorMessage("not-allowed")).toMatch(/blocked/i);
    expect(voiceErrorMessage("no-speech")).toMatch(/didn't hear/i);
    expect(voiceErrorMessage("audio-capture")).toMatch(/no microphone/i);
    expect(voiceErrorMessage("network")).toMatch(/internet/i);
    expect(voiceErrorMessage("anything-else")).toMatch(/didn't work/i);
    expect(voiceErrorMessage("aborted")).toBeNull();
  });
});
