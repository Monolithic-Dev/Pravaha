import "server-only";

import { env } from "@/lib/env";
import { SUBTITLE_LANGUAGES, type SubtitleLanguage } from "@/lib/language";

// Translated subtitle tracks that actually exist for a session. Cloudinary writes
// raw/upload/{public_id}.{lang}.transcript when the upload preset asks for a translation (needs the
// Google Translation add-on); sessions uploaded before that have none, and the player must not offer a
// track that 404s. Checked with a cached HEAD so the Watch page stays fast.
export async function translatedSubtitles(publicId: string): Promise<SubtitleLanguage[]> {
  const cloud = env().NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const checks = await Promise.all(
    SUBTITLE_LANGUAGES.map(async (lang) => {
      try {
        const res = await fetch(`https://res.cloudinary.com/${cloud}/raw/upload/${publicId}.${lang.code}.transcript`, {
          method: "HEAD",
          next: { revalidate: 600 },
          signal: AbortSignal.timeout(2_000),
        });
        return res.ok ? lang : null;
      } catch {
        return null;
      }
    }),
  );
  return checks.filter((lang) => lang !== null);
}
