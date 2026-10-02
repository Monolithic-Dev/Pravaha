"use client";

import { useEffect } from "react";

// "/" or Ctrl/⌘K focuses the Ask bar from anywhere on the page, unless the user is already typing.
export function SearchShortcut() {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing = target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "");
      const isSlash = e.key === "/" && !typing;
      const isCmdK = e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey);
      if (!isSlash && !isCmdK) return;
      const input = document.getElementById("q") as HTMLInputElement | null;
      if (!input) return;
      e.preventDefault();
      input.focus();
      input.select();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return null;
}
