import { formatTime } from "@/lib/format";
import type { StudyPack } from "@/lib/study-pack-schema";

// A study sheet for one session, built from what Pravaha already knows: the Study Pack and the AI chapters.
// Every point carries its timestamp and a link that opens the session at that second. No AI call, so it is
// instant and can't contradict the session. Pure, so it is unit-tested.

export type Stamp = { t: number; label: string; url: string };
export type Notes = {
  title: string;
  speaker: string | null;
  durationS: number | null;
  watchUrl: string;
  summary: string[];
  concepts: (Stamp & { name: string })[];
  chapters: (Stamp & { title: string })[];
  quiz: (Stamp & { question: string; answer: string; explanation: string })[];
};

type Input = {
  lecture: { id: string; title: string; speaker: string | null; durationS: number | null };
  segments: { startS: number; chapterTitle: string | null }[];
  pack: StudyPack | null;
  baseUrl: string;
};

export function buildNotes({ lecture, segments, pack, baseUrl }: Input): Notes {
  const url = (t: number) => `${baseUrl}/watch/${lecture.id}?t=${Math.floor(t)}`;
  const stamp = (t: number): Stamp => ({ t, label: formatTime(t), url: url(t) });

  // Chapters are consecutive segments sharing a title; each starts where its first segment does.
  const chapters: Notes["chapters"] = [];
  for (const s of segments) {
    if (s.chapterTitle && chapters.at(-1)?.title !== s.chapterTitle) chapters.push({ ...stamp(s.startS), title: s.chapterTitle });
  }

  return {
    title: lecture.title,
    speaker: lecture.speaker,
    durationS: lecture.durationS,
    watchUrl: url(0),
    summary: pack?.summary ?? [],
    concepts: [...(pack?.concepts ?? [])].sort((a, b) => a.startS - b.startS).map((c) => ({ ...stamp(c.startS), name: c.name })),
    chapters,
    quiz: (pack?.quiz ?? []).map((q) => ({
      ...stamp(q.startS),
      question: q.question,
      answer: q.options[q.correctIndex] ?? "",
      explanation: q.explanation,
    })),
  };
}

export const hasContent = (n: Notes) => n.summary.length + n.concepts.length + n.chapters.length + n.quiz.length > 0;

// Markdown that pastes cleanly into Notion, Obsidian, a GitHub gist or a message to a study group.
export function notesToMarkdown(n: Notes): string {
  const meta = [n.speaker, n.durationS ? formatTime(n.durationS) : null, `[Watch the session](${n.watchUrl})`].filter(Boolean);
  const lines = [`# ${n.title}`, "", meta.join(" · ")];
  const section = (heading: string, body: string[]) => body.length && lines.push("", `## ${heading}`, "", ...body);
  section("In short", n.summary.map((s) => `- ${s}`));
  section("Key concepts", n.concepts.map((c) => `- **${c.name}** · [${c.label}](${c.url})`));
  section("Chapters", n.chapters.map((c) => `- [${c.label}](${c.url}) ${c.title}`));
  section(
    "Check yourself",
    n.quiz.flatMap((q, i) => [`${i + 1}. ${q.question}`, `   - **Answer:** ${q.answer}`, `   - ${q.explanation} ([${q.label}](${q.url}))`]),
  );
  lines.push("", "---", "Made with Pravaha: ask your recordings, watch the answer.");
  return lines.join("\n") + "\n";
}

export const notesFilename = (title: string) =>
  `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "study-notes"}.md`;
