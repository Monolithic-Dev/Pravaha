"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const KEY = "pravaha-theme";

// Runs before first paint (inlined in <head> by the layout) so a saved theme never flashes the other one.
// An embed (/embed/…?theme=dark) follows the theme its host page asks for instead.
export const THEME_INIT_SCRIPT = `try{var t=location.pathname.indexOf("/embed")===0?new URLSearchParams(location.search).get("theme"):null;try{t=t||localStorage.getItem("${KEY}")}catch(e){}if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

function current(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// Light/dark switch. Follows the system until the viewer picks; the pick is remembered on this device only.
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setTheme(current()));
    return () => cancelAnimationFrame(frame);
  }, []);

  function toggle() {
    const next: Theme = current() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Storage blocked (private mode): the choice still applies for this page view.
    }
    setTheme(next);
  }

  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface hover:text-fg"
    >
      {/* Before mount the icon is unknown; render the moon to keep layout stable. */}
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
        </svg>
      )}
    </button>
  );
}
