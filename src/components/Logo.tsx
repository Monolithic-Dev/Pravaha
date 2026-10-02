// The Pravaha mark: two flowing lines (प्रवाह, "flow") over a play triangle. Same drawing as app/icon.svg.
export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="16" fill="var(--accent)" />
      <path d="M12 26c6.7 0 6.7-6 13.3-6S32 26 38.7 26 45.3 20 52 20" fill="none" stroke="#99f6e4" strokeWidth="5" strokeLinecap="round" />
      <path d="M12 38c6.7 0 6.7-6 13.3-6S32 38 38.7 38 45.3 32 52 32" fill="none" stroke="var(--accent-fg)" strokeWidth="5" strokeLinecap="round" />
      <path d="M27 44.5v9.5l8.5-4.75z" fill="var(--accent-fg)" />
    </svg>
  );
}
