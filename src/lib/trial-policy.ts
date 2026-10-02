import type { Lecture } from "@/lib/lectures";

// "Try it with your own video" (/try): anyone can upload one short clip and ask it questions, without the
// organizer passcode. Every limit below protects the Cloudinary and AI budget:
// - Cloudinary keeps only the first TRIAL_SECONDS (incoming transformation on the trial preset),
// - a trial is unlisted (never in the library, search or Ask across the library) and deleted after TRIAL_TTL_H,
// - TRIALS_PER_IP_PER_DAY per network and TRIALS_PER_DAY (env) in total.
export const TRIAL_SECONDS = 60;
export const TRIAL_TTL_H = 24;
export const TRIAL_MAX_BYTES = 50_000_000;
export const TRIALS_PER_IP_PER_DAY = 2;
// An upload must start soon after its trial is created; after this the signature endpoint refuses it.
export const TRIAL_UPLOAD_WINDOW_MIN = 30;

// A trial may be uploaded to only while it is new and still waiting for its video.
export function trialAcceptsUpload(lecture: Lecture, nowMs = Date.now()): boolean {
  return (
    lecture.trialExpiresAt !== null &&
    lecture.status === "processing" &&
    nowMs - Date.parse(lecture.createdAt) < TRIAL_UPLOAD_WINDOW_MIN * 60_000
  );
}

// Time until a trial is deleted, in whole hours (at least 1), for "deleted in about N hours".
export function hoursLeft(expiresAt: string, nowMs = Date.now()): number {
  return Math.max(1, Math.ceil((Date.parse(expiresAt) - nowMs) / 3600_000));
}
