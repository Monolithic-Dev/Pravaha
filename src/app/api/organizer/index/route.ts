import { NextResponse } from "next/server";

import { isOrganizer } from "@/lib/auth";
import { searchAssets, syncAllAssets } from "@/lib/cloudinary-index";
import { unauthorized } from "@/lib/http";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Organizer: write tags and contextual metadata onto every session's Cloudinary asset, then read them back
// with Cloudinary's Search API, which proves the round trip.
export async function POST() {
  if (!(await isOrganizer())) return unauthorized();
  const result = await syncAllAssets();
  return NextResponse.json({ ...result, assets: await searchAssets() });
}

export async function GET() {
  if (!(await isOrganizer())) return unauthorized();
  return NextResponse.json({ assets: await searchAssets() });
}
