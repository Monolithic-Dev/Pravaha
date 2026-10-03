import "server-only";

import { assetContext, assetTags, ROOT_TAG } from "@/lib/asset-metadata";
import { cld } from "@/lib/cloudinary";
import { query } from "@/lib/db";
import type { Lecture } from "@/lib/lectures";
import { log } from "@/lib/log";
import type { StudyPack } from "@/lib/study-pack-schema";

// Tags and contextual metadata on the Cloudinary asset itself: the media library stays organised and
// searchable in Cloudinary even without our database. Best-effort, like every polish step (NFR4).
export async function syncAssetMetadata(lecture: Pick<Lecture, "id" | "publicId" | "title" | "speaker">, pack: StudyPack): Promise<boolean> {
  try {
    const [row] = await query<{ language: string | null; moments: string }>(
      `SELECT language, (SELECT count(*) FROM segments WHERE lecture_id = $1) AS moments FROM lectures WHERE id = $1`,
      [lecture.id],
    );
    const facts = {
      title: lecture.title,
      speaker: lecture.speaker,
      language: row?.language ?? null,
      concepts: pack.concepts.map((c) => c.name),
      moments: Number(row?.moments ?? 0),
    };
    const tags = assetTags(facts);
    const options = { resource_type: "video" as const };
    await cld().uploader.add_tag(tags.join(","), [lecture.publicId], options);
    await cld().uploader.add_context(assetContext(facts), [lecture.publicId], options);
    log("cloudinary.index.synced", { lectureId: lecture.id, tags: tags.length });
    return true;
  } catch (error) {
    log("cloudinary.index.failed", { lectureId: lecture.id, error: error instanceof Error ? error.message.slice(0, 160) : String(error) });
    return false;
  }
}

export type IndexedAsset = { publicId: string; tags: string[]; context: Record<string, string> };

// Cloudinary's Search API over our assets: everything tagged "pravaha", optionally narrowed to one tag.
export async function searchAssets(tag?: string): Promise<IndexedAsset[]> {
  const expression = `resource_type:video AND tags=${ROOT_TAG}${tag ? ` AND tags=${tag}` : ""}`;
  const result = await cld().search.expression(expression).with_field(["tags", "context"]).max_results(50).execute();
  type Resource = { public_id: string; tags?: string[]; context?: Record<string, unknown> };
  return ((result.resources ?? []) as Resource[]).map((r) => ({ publicId: r.public_id, tags: r.tags ?? [], context: contextOf(r.context) }));
}

// Organizer backfill: tag every session that already has a Study Pack.
export async function syncAllAssets(): Promise<{ synced: number; skipped: number }> {
  const rows = await query<{ id: string; public_id: string; title: string; speaker: string | null; pack: StudyPack }>(
    `SELECT l.id, l.public_id, l.title, l.speaker, sp.pack
       FROM study_packs sp JOIN lectures l ON l.id = sp.lecture_id WHERE l.trial_expires_at IS NULL`,
  );
  let synced = 0;
  for (const r of rows) {
    if (await syncAssetMetadata({ id: r.id, publicId: r.public_id, title: r.title, speaker: r.speaker }, r.pack)) synced++;
  }
  return { synced, skipped: rows.length - synced };
}

// The Search API returns contextual metadata flat; the Admin API nests it under "custom".
function contextOf(context: Record<string, unknown> | undefined): Record<string, string> {
  const flat = (context?.custom ?? context ?? {}) as Record<string, unknown>;
  return Object.fromEntries(Object.entries(flat).filter(([, v]) => typeof v === "string")) as Record<string, string>;
}
