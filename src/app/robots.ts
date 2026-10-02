import type { MetadataRoute } from "next";

import { publicBaseUrl } from "@/lib/site";

// Learner pages are public; organizer tools and the API are not for crawlers. Shared answers and Moments
// carry their own noindex (they are reached by link).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/studio", "/saved"] },
    sitemap: `${publicBaseUrl()}/sitemap.xml`,
  };
}
