"use client";

import { usePathname } from "next/navigation";

// The site header, footer and "/" shortcut. /embed pages leave them out: they sit in an iframe inside an
// LMS or course page, where only the Ask box belongs.
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return usePathname().startsWith("/embed") ? null : children;
}
