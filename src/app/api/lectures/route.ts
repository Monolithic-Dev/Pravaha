import { NextResponse } from "next/server";
import { z } from "zod";

import { isOrganizer } from "@/lib/auth";
import { env } from "@/lib/env";
import { parseJson, unauthorized } from "@/lib/http";
import { createLecture, listStudioSessions } from "@/lib/lectures";
import { log } from "@/lib/log";

export const dynamic = "force-dynamic";

// Public: the published library. Organizers: every session. Each with what the pipeline produced for it.
export async function GET() {
  const lectures = await listStudioSessions({ includeAll: await isOrganizer() });
  return NextResponse.json(lectures);
}

const Body = z.object({
  title: z.string().trim().min(1).max(140),
  speaker: z.string().trim().max(80).optional(),
  // FR9: the organizer must confirm the right to record and publish before any upload.
  rightsConfirmed: z.literal(true),
});

export async function POST(request: Request) {
  if (!(await isOrganizer())) return unauthorized();
  const parsed = await parseJson(request, Body);
  if ("response" in parsed) return parsed.response;

  const lecture = await createLecture(parsed.data);
  log("lecture.created", { lectureId: lecture.id });
  return NextResponse.json({ lecture, uploadPreset: env().CLOUDINARY_UPLOAD_PRESET }, { status: 201 });
}
