import { describe, expect, it } from "vitest";

import { pickSuggestions } from "@/lib/suggestions";

const quiz = (...questions: string[]) => questions.map((question) => ({ question }));

describe("pickSuggestions", () => {
  it("takes one open question per session before a second from any session", () => {
    const packs = [
      { quiz: quiz("What is overfitting?", "Why use a validation set?") },
      { quiz: quiz("How does learning rate decay work?") },
    ];
    expect(pickSuggestions(packs, 2)).toEqual(["What is overfitting?", "How does learning rate decay work?"]);
  });

  it("skips quiz-only phrasing and questions too long for a chip", () => {
    const packs = [
      {
        quiz: quiz(
          "Which of the following is true?",
          "What does the speaker say about momentum?",
          "What is the main reason gradient descent can oscillate around a minimum in narrow valleys?",
          "Why does RMSProp decay old gradients?",
        ),
      },
    ];
    expect(pickSuggestions(packs)).toEqual(["Why does RMSProp decay old gradients?"]);
  });

  it("falls back to concepts, round-robin, without duplicates", () => {
    const packs = [
      { quiz: quiz("What is overfitting?"), concepts: [{ name: "Overfitting Definition" }, { name: "Early stopping" }] },
      { concepts: [{ name: "The learning rate" }] },
    ];
    expect(pickSuggestions(packs)).toEqual(["What is overfitting?", "What is learning rate?", "What is Early stopping?"]);
  });

  it("returns nothing for an empty library", () => {
    expect(pickSuggestions([])).toEqual([]);
  });
});
