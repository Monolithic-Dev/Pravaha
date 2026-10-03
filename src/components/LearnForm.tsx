"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { LearningPathView } from "@/components/LearningPathView";
import type { LearningPath } from "@/lib/paths";

type State = { kind: "idle" } | { kind: "loading" } | { kind: "done"; path: LearningPath } | { kind: "empty" } | { kind: "error"; message: string };

const EXAMPLES = ["Optimizers for training neural networks", "Why models overfit and how to stop it", "Choosing a learning rate"];

export function LearnForm({ initialTopic }: { initialTopic: string }) {
  const router = useRouter();
  const [topic, setTopic] = useState(initialTopic);
  const [state, setState] = useState<State>({ kind: "idle" });

  async function build(value: string) {
    const t = value.trim();
    if (t.length < 3) return;
    setState({ kind: "loading" });
    router.replace(`/learn?topic=${encodeURIComponent(t)}`, { scroll: false });
    try {
      const res = await fetch("/api/paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: t }),
      });
      if (res.status === 429) return setState({ kind: "error", message: "You've built a lot of courses — try again in a few minutes." });
      if (!res.ok) return setState({ kind: "error", message: "Couldn't build a course right now — try again in a moment." });
      const body = (await res.json()) as { status: "built"; path: LearningPath } | { status: "not_found" };
      setState(body.status === "built" ? { kind: "done", path: body.path } : { kind: "empty" });
      if (body.status === "built" && body.path.id) router.replace(`/p/${body.path.id}`, { scroll: false });
    } catch {
      setState({ kind: "error", message: "Couldn't reach Pravaha. Check your connection." });
    }
  }

  useEffect(() => {
    // A /learn?topic=… link (e.g. "Turn this into a lesson" under an answer) builds straight away.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (initialTopic) void build(initialTopic);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void build(topic);
        }}
        className="relative mt-6"
      >
        <label htmlFor="topic" className="sr-only">
          Topic to learn
        </label>
        <input
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          minLength={3}
          maxLength={200}
          required
          placeholder="What do you want to learn? e.g. optimizers for neural networks"
          className="h-14 w-full rounded-2xl border border-border bg-surface pr-36 pl-5 text-base shadow-sm placeholder:text-muted"
        />
        <button disabled={state.kind === "loading"} className="absolute top-2 right-2 h-10 rounded-xl bg-accent px-5 font-medium text-accent-fg disabled:opacity-60">
          {state.kind === "loading" ? "Building…" : "Build course"}
        </button>
      </form>
      {state.kind === "idle" && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Try:</span>
          {EXAMPLES.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                setTopic(e);
                void build(e);
              }}
              className="rounded-full border border-border bg-surface px-3 py-1 hover:border-accent"
            >
              {e}
            </button>
          ))}
        </div>
      )}
      {state.kind === "loading" && (
        <div className="mt-6 rounded-3xl border border-border bg-surface p-6" aria-live="polite">
          <p className="text-sm text-muted">Finding moments across every lecture, ordering them from basics to advanced, and editing them into one video…</p>
          <div className="mt-4 skeleton aspect-video rounded-2xl" />
          <div className="mt-4 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" />
            ))}
          </div>
        </div>
      )}
      {state.kind === "empty" && (
        <p className="mt-6 text-muted">The library doesn&apos;t cover enough of that for a course yet — try a broader topic, or Ask a question instead.</p>
      )}
      {state.kind === "error" && <p className="mt-6 text-muted">{state.message}</p>}
      {state.kind === "done" && <LearningPathView path={state.path} />}
    </>
  );
}
