import "server-only";
import { cache } from "react";
import { z } from "zod";

import { getLecture, getSegments, type Lecture } from "@/lib/lectures";
import { buildNotes, hasContent, type Notes } from "@/lib/notes";
import { publicBaseUrl } from "@/lib/site";
import { getStudyPack } from "@/lib/study-packs";

// Notes for a ready session (any visibility: like its Watch page, the unguessable id is the access), or null
// when it isn't ready or there is nothing to put on the sheet.
export const loadNotes = cache(async (id: string): Promise<{ lecture: Lecture; notes: Notes } | null> => {
  if (!z.uuid().safeParse(id).success) return null;
  const lecture = await getLecture(id);
  if (!lecture || lecture.status !== "ready") return null;
  const [segments, pack] = await Promise.all([getSegments(lecture.id), getStudyPack(lecture.id)]);
  const notes = buildNotes({ lecture, segments, pack, baseUrl: publicBaseUrl() });
  return hasContent(notes) ? { lecture, notes } : null;
});
