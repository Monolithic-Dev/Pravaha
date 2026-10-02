import { after, NextResponse } from "next/server";
import { z } from "zod";

import { apiError, parseJson } from "@/lib/http";
import { log } from "@/lib/log";
import { clientIp } from "@/lib/rate-limit";
import { purgeExpiredTrials, startTrial } from "@/lib/trials";

const Body = z.object({
  title: z.string().trim().min(1).max(140),
  // Same rule as organizer uploads (FR9): the uploader confirms they may use this recording.
  rightsConfirmed: z.literal(true),
});

const REFUSED = {
  disabled: [503, "trials_disabled", "Trial uploads are switched off on this deployment."],
  ip_limit: [429, "trial_limit", "You've used today's trial uploads. Try again tomorrow, or explore the library."],
  daily_limit: [429, "trials_full", "Today's trial uploads are used up. Try again tomorrow, or explore the library."],
} as const;

// Starts a public trial session (src/lib/trials.ts); the browser then uploads with the returned preset.
export async function POST(request: Request) {
  const parsed = await parseJson(request, Body);
  if ("response" in parsed) return parsed.response;

  const trial = await startTrial(clientIp(request), parsed.data.title);
  after(() => purgeExpiredTrials().catch(() => {}));
  if (!trial.ok) {
    log("trial.refused", { reason: trial.reason });
    const [status, code, message] = REFUSED[trial.reason];
    return apiError(status, code, message);
  }
  return NextResponse.json({ lecture: trial.lecture, uploadPreset: trial.uploadPreset }, { status: 201 });
}
