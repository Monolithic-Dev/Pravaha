// "Try it with your own video" (/try): a second signed upload preset for public trial uploads.
// Same AI work and webhook as the organizer preset, plus an incoming transformation that keeps only the
// first 60 seconds, so Cloudinary itself enforces the trial length (and its credit cost) whatever is uploaded.
// Idempotent. Usage: pnpm preset:trial
import "./env.mjs";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const source = process.env.CLOUDINARY_UPLOAD_PRESET ?? "pravaha_signed";
const name = process.env.CLOUDINARY_TRIAL_PRESET ?? "pravaha_trial";
// The organizer preset already points at this deployment's webhook; the trial preset reuses it.
const { notification_url } = (await cloudinary.api.upload_preset(source)).settings;

const settings = {
  unsigned: false,
  allowed_formats: "mp4,mov,webm,mkv,m4v",
  auto_transcription: true,
  auto_chaptering: true,
  transformation: [{ end_offset: 60 }],
  ...(notification_url ? { notification_url } : {}),
};
try {
  await cloudinary.api.upload_preset(name);
  await cloudinary.api.update_upload_preset(name, settings);
  console.log(`updated preset ${name}`);
} catch {
  await cloudinary.api.create_upload_preset({ name, ...settings });
  console.log(`created preset ${name}`);
}
const after = (await cloudinary.api.upload_preset(name)).settings;
console.log(JSON.stringify({ ...after, notification_url: after.notification_url ? "set" : null }));
