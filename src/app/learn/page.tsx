import type { Metadata } from "next";

import { LearnForm } from "@/components/LearnForm";

export const metadata: Metadata = {
  title: "Learn a topic — Pravaha",
  description: "Turn any topic into a short course built from moments across your lecture library, edited into one video.",
};

type Props = { searchParams: Promise<{ topic?: string }> };

export default async function LearnPage({ searchParams }: Props) {
  const topic = ((await searchParams).topic ?? "").trim().slice(0, 200);
  return (
    <div className="mx-auto mt-6 max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Learn a topic, <span className="text-accent">taught by your own lecturers.</span>
      </h1>
      <p className="mt-3 max-w-2xl text-muted">
        Pravaha picks the moments across every lecture that teach it, orders them from basics to advanced, and Cloudinary
        edits them into one short course video. Every step is a real moment you can open.
      </p>
      <LearnForm initialTopic={topic} />
    </div>
  );
}
