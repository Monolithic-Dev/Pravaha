import { NextResponse } from "next/server";

import { listConcepts } from "@/lib/concepts";

export const dynamic = "force-dynamic";

// The concept map: every concept the published library teaches and how many sessions explain it.
export async function GET() {
  const concepts = await listConcepts();
  return NextResponse.json(concepts.map((c) => ({ key: c.key, name: c.name, sessions: c.entries.length })));
}
