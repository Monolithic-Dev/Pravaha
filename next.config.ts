import type { NextConfig } from "next";

// Baseline security headers on every response (docs/SECURITY.md). No full script CSP yet: the Cloudinary
// Video Player loads its own scripts, styles and HLS media from several hosts, so a strict policy needs
// testing against every player feature first. frame-ancestors still blocks clickjacking.
const baseHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // microphone=(self): only Pravaha's own pages may ask for it, which the voice question needs (components/VoiceButton.tsx).
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), payment=(), usb=()" },
];
const policy = (ancestors: string) => `frame-ancestors ${ancestors}; base-uri 'self'; form-action 'self'; object-src 'none'`;

// /embed/* is the one framable route: the Ask box an LMS or course page puts in an iframe (docs/EMBED.md).
// EMBED_FRAME_ANCESTORS narrows it to an institute's own origins; the default allows any HTTPS page.
// Every other route stays unframable (X-Frame-Options can't be relaxed per route, so it skips /embed).
const embedAncestors = process.env.EMBED_FRAME_ANCESTORS?.trim() || "https:";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  async headers() {
    return [
      { source: "/(.*)", headers: baseHeaders },
      {
        source: "/((?!embed(?:/|$)).*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: policy("'none'") },
        ],
      },
      // The service worker must always be re-fetched, so a fix to it reaches every device on the next visit.
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      { source: "/embed/:path*", headers: [{ key: "Content-Security-Policy", value: policy(embedAncestors) }] },
    ];
  },
};

export default nextConfig;
