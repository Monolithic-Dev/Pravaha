import { NextResponse } from "next/server";

import { apiError } from "@/lib/http";
import { notesFilename, notesToMarkdown } from "@/lib/notes";
import { loadNotes } from "@/lib/notes-data";

export const dynamic = "force-dynamic";

// A session's study notes: JSON by default, or `?format=md` for Markdown (`&download=1` as a file).
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const loaded = await loadNotes((await params).id);
  if (!loaded) return apiError(404, "not_found", "No study notes for this session.");
  const { searchParams } = new URL(request.url);
  if (searchParams.get("format") !== "md") return NextResponse.json(loaded.notes);

  const headers: Record<string, string> = { "Content-Type": "text/markdown; charset=utf-8" };
  if (searchParams.get("download")) headers["Content-Disposition"] = `attachment; filename="${notesFilename(loaded.notes.title)}"`;
  return new NextResponse(notesToMarkdown(loaded.notes), { headers });
}
