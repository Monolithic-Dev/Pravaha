import "server-only";

import { cld } from "@/lib/cloudinary";
import { query } from "@/lib/db";
import { env } from "@/lib/env";
import { createLecture, type Lecture } from "@/lib/lectures";
import { log } from "@/lib/log";
import { hashIp } from "@/lib/rate-limit";
import { TRIAL_TTL_H, TRIALS_PER_IP_PER_DAY } from "@/lib/trial-policy";

// Trial sessions (/try): creation within the limits in src/lib/trial-policy.ts, and deletion after expiry.

export type TrialStart =
  { ok: true; lecture: Lecture; uploadPreset: string } | { ok: false; reason: "disabled" | "ip_limit" | "daily_limit" };

export async function startTrial(ip: string, title: string): Promise<TrialStart> {
  const perDay = env().TRIALS_PER_DAY;
  if (perDay === 0) return { ok: false, reason: "disabled" };

  const ipHash = hashIp(ip);
  const [counts] = await query<{ per_ip: string; total: string }>(
    `SELECT count(*) FILTER (WHERE trial_ip_hash = $1) AS per_ip, count(*) AS total
       FROM lectures
      WHERE trial_expires_at IS NOT NULL AND created_at > now() - interval '1 day'`,
    [ipHash],
  );
  if (Number(counts?.total) >= perDay) return { ok: false, reason: "daily_limit" };
  if (Number(counts?.per_ip) >= TRIALS_PER_IP_PER_DAY) return { ok: false, reason: "ip_limit" };

  const lecture = await createLecture({
    title,
    trial: { expiresAt: new Date(Date.now() + TRIAL_TTL_H * 3600_000), ipHash },
  });
  log("trial.created", { lectureId: lecture.id });
  return { ok: true, lecture, uploadPreset: env().CLOUDINARY_TRIAL_PRESET };
}

// Deletes expired trials: the Cloudinary video (its transcript and chapter files go with it) and the row
// (segments, Study Pack and Moment events cascade). Best-effort and idempotent; runs after trial requests.
export async function purgeExpiredTrials(limit = 20): Promise<number> {
  const expired = await query<{ id: string; public_id: string }>(
    `SELECT id, public_id FROM lectures WHERE trial_expires_at < now() ORDER BY trial_expires_at LIMIT $1`,
    [limit],
  );
  let purged = 0;
  for (const trial of expired) {
    try {
      await cld().uploader.destroy(trial.public_id, { resource_type: "video", invalidate: true });
      await cld()
        .api.delete_resources([`${trial.public_id}.transcript`, `${trial.public_id}-chapters.vtt`], { resource_type: "raw" })
        .catch(() => {});
      await query(`DELETE FROM lectures WHERE id = $1`, [trial.id]);
      purged++;
    } catch (error) {
      log("trial.purge_failed", {
        lectureId: trial.id,
        error: error instanceof Error ? error.message.slice(0, 120) : String(error),
      });
    }
  }
  if (purged) log("trial.purged", { count: purged });
  return purged;
}
