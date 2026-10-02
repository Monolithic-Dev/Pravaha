"use client";

import { useState } from "react";

import { AskAnswer } from "@/components/AskAnswer";

// "Ask this session": the same grounded Ask as the home page, scoped to one recording. Follow-up
// questions stay in this session. Suggestions come from the session's Study Pack when it has one.
export function AskSession({ lectureId, suggestions = [] }: { lectureId: string; suggestions?: string[] }) {
  const [draft, setDraft] = useState("");
  const [question, setQuestion] = useState<string | null>(null);

  function ask(q: string) {
    const trimmed = q.trim();
    if (trimmed.length < 3) return;
    setDraft(trimmed);
    setQuestion(trimmed);
  }

  return (
    <section aria-labelledby="ask-session-heading" className="mt-6">
      <h2 id="ask-session-heading" className="text-lg font-semibold">
        Ask this session
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(draft);
        }}
        className="relative mt-3"
      >
        <label htmlFor="ask-session" className="sr-only">
          Ask a question about this session
        </label>
        <input
          id="ask-session"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          minLength={3}
          maxLength={300}
          required
          placeholder="What does it say about…?"
          className="h-12 w-full rounded-xl border border-border bg-surface pr-24 pl-4 placeholder:text-muted focus:border-accent focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_15%,transparent)] focus:outline-none"
        />
        <button className="absolute top-1.5 right-1.5 h-9 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg transition-transform hover:brightness-110 active:scale-95">
          Ask
        </button>
      </form>
      {suggestions.length > 0 && !question && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Try:</span>
          {suggestions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => ask(q)}
              className="lift rounded-full border border-border bg-surface px-3 py-1 hover:border-accent"
            >
              {q}
            </button>
          ))}
        </div>
      )}
      {question && <AskAnswer key={question} question={question} lectureId={lectureId} onFollowUp={ask} />}
    </section>
  );
}
