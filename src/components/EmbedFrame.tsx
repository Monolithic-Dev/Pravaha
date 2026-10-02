"use client";

import { useEffect, useRef } from "react";

export const EMBED_HEIGHT_MESSAGE = "pravaha:height";

// Wraps /embed pages. Inside an iframe, a link to the rest of Pravaha (a Watch page, a shared answer) opens
// in a new tab instead of replacing the embed, and the page posts its height so a host page can size the
// frame to fit (docs/EMBED.md). Opened directly, it behaves like any other page.
export function EmbedFrame({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.parent === window) return;
    const post = () => {
      const height = Math.ceil(el.getBoundingClientRect().bottom + window.scrollY) + 24;
      window.parent.postMessage({ type: EMBED_HEIGHT_MESSAGE, height }, "*");
    };
    const observer = new ResizeObserver(post);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function onClickCapture(e: React.MouseEvent) {
    if (window.parent === window || e.defaultPrevented) return;
    const link = (e.target as Element).closest("a[href]");
    if (!(link instanceof HTMLAnchorElement) || link.target) return;
    const url = new URL(link.href);
    if (url.origin === location.origin && url.pathname === location.pathname) return; // in-page jumps (#cite-1)
    e.preventDefault();
    e.stopPropagation();
    window.open(url, "_blank", "noopener");
  }

  return (
    <div ref={ref} onClickCapture={onClickCapture}>
      {children}
    </div>
  );
}
