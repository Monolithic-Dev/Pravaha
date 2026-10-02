// Phase 15: ask Cloudinary to translate every new transcript into Hindi (raw/upload/{public_id}.hi-IN.transcript),
// which the Watch page then offers as a subtitle track (src/lib/subtitles.ts).
// Prerequisite: the Google Translation add-on is enabled on the Cloudinary account (Console → Add-ons).
// Only uploads made after this run get Hindi subtitles. Usage: pnpm preset:hindi
import "./env.mjs";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const name = process.env.CLOUDINARY_UPLOAD_PRESET ?? "pravaha_signed";
const before = (await cloudinary.api.upload_preset(name)).settings;
console.log("before:", JSON.stringify(before.auto_transcription));
// The SDK serializes the object form; update_upload_preset leaves every other preset setting as it is.
await cloudinary.api.update_upload_preset(name, { auto_transcription: { translate: ["hi-IN"] } });
const after = (await cloudinary.api.upload_preset(name)).settings;
console.log("after: ", JSON.stringify(after.auto_transcription));
console.log("unchanged:", JSON.stringify({ auto_chaptering: after.auto_chaptering, notification_url: after.notification_url, unsigned: after.unsigned }));
