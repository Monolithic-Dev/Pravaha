import { NextResponse } from "next/server";
import { z } from "zod";

import { isOrganizer } from "@/lib/auth";
import { cld } from "@/lib/cloudinary";
import { env } from "@/lib/env";
import { apiError, parseJson, unauthorized } from "@/lib/http";
import { getLectureByPublicId } from "@/lib/lectures";
import { log } from "@/lib/log";
import { trialAcceptsUpload } from "@/lib/trial-policy";
import { checkParamsToSign } from "@/lib/upload-policy";

// Contract of next-cloudinary's CldUploadWidget `signatureEndpoint`: { paramsToSign } in, { signature } out.
const Body = z.object({ paramsToSign: z.record(z.string(), z.unknown()) });

// Two callers: organizers (organizer preset, any session they created) and public trials (trial preset, only
// into a fresh trial row). The trial preset trims to 60 s on Cloudinary, so it can't be used for a normal session
// and the organizer preset can't be used for a trial.
export async function POST(request: Request) {
  const parsed = await parseJson(request, Body);
  if ("response" in parsed) return parsed.response;

  const { paramsToSign } = parsed.data;
  const { CLOUDINARY_UPLOAD_PRESET, CLOUDINARY_TRIAL_PRESET } = env();
  const check = checkParamsToSign(paramsToSign, { presets: [CLOUDINARY_UPLOAD_PRESET, CLOUDINARY_TRIAL_PRESET] });
  if (!check.ok) {
    log("upload.sign_rejected", { reason: check.reason });
    return apiError(400, "unsignable", check.reason);
  }

  const lecture = await getLectureByPublicId(check.publicId);
  if (check.preset === CLOUDINARY_TRIAL_PRESET) {
    if (!lecture || !trialAcceptsUpload(lecture)) {
      return apiError(400, "unknown_lecture", "Start a new trial before uploading.");
    }
  } else {
    if (!(await isOrganizer())) return unauthorized();
    if (!lecture || lecture.status !== "processing" || lecture.trialExpiresAt) {
      return apiError(400, "unknown_lecture", "Create the session before uploading.");
    }
  }

  const signature = cld().utils.api_sign_request(paramsToSign, env().CLOUDINARY_API_SECRET);
  log("upload.signed", { lectureId: lecture.id });
  return NextResponse.json({ signature });
}
