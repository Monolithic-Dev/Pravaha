import type { MetadataRoute } from "next";

// Makes Pravaha installable: "Add to Home screen" on a phone opens it full-screen like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pravaha: ask your recordings, watch the answer",
    short_name: "Pravaha",
    description: "Ask your lecture recordings a question and watch the answer: a clip of the moment it was said.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafaf7",
    theme_color: "#0f766e",
    categories: ["education"],
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/maskable-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Ask a question", url: "/", description: "Ask your recordings" },
      { name: "Learn a topic", url: "/learn", description: "A short course from your lectures" },
      { name: "Saved", url: "/saved", description: "Weak spots and saved moments" },
    ],
  };
}
