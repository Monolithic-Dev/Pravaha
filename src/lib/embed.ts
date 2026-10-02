// The iframe an organizer pastes into an LMS (docs/EMBED.md). Pure, so it is unit-tested.

const attr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export function embedSnippet(origin: string, { lectureId, title }: { lectureId?: string; title: string }) {
  const src = `${origin}/embed/ask${lectureId ? `?session=${encodeURIComponent(lectureId)}` : ""}`;
  const html =
    `<iframe src="${attr(src)}" title="${attr(`Ask ${title} — Pravaha`)}" width="100%" height="640" ` +
    `style="border:0;border-radius:12px" allow="clipboard-write; fullscreen" loading="lazy"></iframe>`;
  return { src, html };
}
