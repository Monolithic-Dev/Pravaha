import type { MetadataRoute } from "next";

import { listLectures } from "@/lib/lectures";
import { log } from "@/lib/log";
import { publicBaseUrl } from "@/lib/site";

// Rendered per request (not at build time, which has no database): the home and trial pages plus every published session.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicBaseUrl();
  const lectures = await listLectures({ includeAll: false }).catch((error) => {
    log("sitemap.failed", { error: error instanceof Error ? error.message.slice(0, 120) : String(error) });
    return [];
  });
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/try`, changeFrequency: "monthly", priority: 0.6 },
    ...lectures.map((l) => ({ url: `${base}/watch/${l.id}`, lastModified: new Date(l.createdAt), changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
