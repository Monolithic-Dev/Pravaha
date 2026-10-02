// The public base URL for absolute links (metadata, robots, sitemap). Read directly rather than via env(),
// which requires every server secret and so can't run at build time.
export function publicBaseUrl(): string {
  const url = process.env.APP_URL;
  return url && URL.canParse(url) ? url.replace(/\/$/, "") : "http://localhost:3000";
}
