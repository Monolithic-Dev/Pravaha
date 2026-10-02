import "server-only";

import { parseChaptersVtt, type Chapter } from "@/lib/chapters";
import { query, transaction } from "@/lib/db";
import { env } from "@/lib/env";
import type { Lecture } from "@/lib/lectures";
import { log } from "@/lib/log";
import { previewUrl, trackingWarmupUrl } from "@/lib/media";
import { buildSegments, TranscriptFile, transcriptLanguage } from "@/lib/segments";

// Built from our own cloud name + the public_id in our DB — never from a URL in the webhook payload (no SSRF).
const rawUrl = (file: string) =>
  `https://res.cloudinary.com/${env().NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/upload/${file}`;

async function fetchChapters(publicId: string): Promise<Chapter[]> {
  // Verified in Phase 01: auto_chaptering writes raw/upload/{public_id}-chapters.vtt. Titles are optional polish.
  const res = await fetch(rawUrl(`${publicId}-chapters.vtt`), { cache: "no-store" });
  return res.ok ? parseChaptersVtt(await res.text()) : [];
}

export async function ingestTranscript(lecture: Lecture): Promise<number> {
  const started = Date.now();
  const res = await fetch(rawUrl(`${lecture.publicId}.transcript`), { cache: "no-store" });
  if (!res.ok) throw new Error(`transcript fetch failed: ${res.status}`);

  const lines = TranscriptFile.parse(await res.json());
  const segments = buildSegments(lines, await fetchChapters(lecture.publicId));
  const durationS = segments.at(-1)?.endS ?? null;

  // Delete-then-insert in one transaction: a retried webhook produces the same rows, never duplicates.
  await transaction(async (client) => {
    await client.query("DELETE FROM segments WHERE lecture_id = $1", [lecture.id]);
    if (segments.length) {
      await client.query(
        `INSERT INTO segments (lecture_id, start_s, end_s, text, chapter_title, words)
         SELECT $1, s, e, t, c, w::jsonb FROM unnest($2::real[], $3::real[], $4::text[], $5::text[], $6::text[]) AS u(s, e, t, c, w)`,
        [
          lecture.id,
          segments.map((s) => s.startS),
          segments.map((s) => s.endS),
          segments.map((s) => s.text),
          segments.map((s) => s.chapterTitle),
          segments.map((s) => JSON.stringify(s.words)),
        ],
      );
    }
    await client.query(
      `UPDATE lectures SET status = 'ready', duration_s = coalesce(duration_s, $2), language = $3, updated_at = now() WHERE id = $1`,
      [lecture.id, durationS, transcriptLanguage(lines)],
    );
  });

  log("ingest.done", { lectureId: lecture.id, segments: segments.length, ms: Date.now() - started });
  await warmTrackingCrop(lecture);
  await warmPreview(lecture);
  return segments.length;
}

// Kick off Cloudinary's g_auto tracking analysis now (it answers 423 until done), so the first
// learner to share a Moment doesn't wait for it. Best-effort: never fails ingest.
async function warmTrackingCrop(lecture: Lecture): Promise<void> {
  try {
    const res = await fetch(trackingWarmupUrl(lecture.publicId), { method: "HEAD", signal: AbortSignal.timeout(5000) });
    log("moment.warmup", { lectureId: lecture.id, status: res.status });
  } catch {
    log("moment.warmup", { lectureId: lecture.id, status: "timeout" });
  }
}

// Generates the library card's AI hover preview now, so the first learner to hover doesn't wait for it.
// Best-effort, like the tracking warm-up.
async function warmPreview(lecture: Lecture): Promise<void> {
  try {
    const res = await fetch(previewUrl(lecture.publicId), { method: "HEAD", signal: AbortSignal.timeout(5000) });
    log("preview.warmup", { lectureId: lecture.id, status: res.status });
  } catch {
    log("preview.warmup", { lectureId: lecture.id, status: "timeout" });
  }
}

export async function markTranscriptFailed(lecture: Lecture): Promise<void> {
  await query(`UPDATE lectures SET status = 'transcript_failed', updated_at = now() WHERE id = $1`, [lecture.id]);
  log("ingest.failed", { lectureId: lecture.id, reason: "transcription_failed" });
}

export async function setDuration(lecture: Lecture, durationS: number): Promise<void> {
  await query(`UPDATE lectures SET duration_s = $2, updated_at = now() WHERE id = $1`, [lecture.id, durationS]);
}
