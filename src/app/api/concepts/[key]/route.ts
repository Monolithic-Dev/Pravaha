import { NextResponse } from "next/server";

import { getConcept } from "@/lib/concepts";
import { apiError } from "@/lib/http";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ key: string }> };

// One concept and the moments, across sessions, that explain it.
export async function GET(_request: Request, { params }: Props) {
  const { key } = await params;
  const concept = /^[a-z0-9-]{1,80}$/.test(key) ? await getConcept(key) : null;
  if (!concept) return apiError(404, "not_found", "No such concept.");
  return NextResponse.json({
    key: concept.key,
    name: concept.name,
    moments: concept.moments.map((m) => ({
      lectureId: m.lectureId,
      title: m.title,
      speaker: m.speaker,
      startS: m.startS,
      endS: m.endS,
      text: m.text,
      related: m.related,
    })),
  });
}
