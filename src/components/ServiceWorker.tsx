"use client";

import { useEffect } from "react";

// Registers the offline-page service worker (public/sw.js). Production only, so development never serves a
// cached shell, and any failure is ignored: the app works the same without it.
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);
  return null;
}
