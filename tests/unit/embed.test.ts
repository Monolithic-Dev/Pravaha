import { describe, expect, it } from "vitest";

import { embedSnippet } from "@/lib/embed";

const ORIGIN = "https://pravaha.example";
const ID = "3f2b8c1e-0d4a-4c55-9b7e-1a2b3c4d5e6f";

describe("embedSnippet", () => {
  it("embeds the whole library without a session", () => {
    const { src, html } = embedSnippet(ORIGIN, { title: "the library" });
    expect(src).toBe(`${ORIGIN}/embed/ask`);
    expect(html).toBe(
      `<iframe src="${ORIGIN}/embed/ask" title="Ask the library — Pravaha" width="100%" height="640" ` +
        `style="border:0;border-radius:12px" allow="clipboard-write; fullscreen" loading="lazy"></iframe>`,
    );
  });

  it("scopes to one session", () => {
    expect(embedSnippet(ORIGIN, { lectureId: ID, title: "x" }).src).toBe(`${ORIGIN}/embed/ask?session=${ID}`);
  });

  it("escapes a session title so it can't break out of the attribute", () => {
    const { html } = embedSnippet(ORIGIN, { lectureId: ID, title: `"Bias & Variance" <b>` });
    expect(html).toContain('title="Ask &quot;Bias &amp; Variance&quot; &lt;b> — Pravaha"');
    expect(html.match(/"/g)!.length % 2).toBe(0);
  });
});
