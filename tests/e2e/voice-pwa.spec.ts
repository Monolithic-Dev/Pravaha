import { expect, test } from "@playwright/test";

// Voice question, installability and the offline page (run against the deployed app, like smoke.spec.ts).

test("a spoken question is asked, in the language chosen", async ({ page }) => {
  // A simulated recogniser: says the question as soon as it is started.
  await page.addInitScript(() => {
    const Fake = class {
      lang = "";
      onresult: ((e: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      start() {
        setTimeout(() => {
          this.onresult?.({ results: [[{ transcript: "what is momentum in gradient descent" }]] });
          setTimeout(() => this.onend?.(), 150);
        }, 300);
      }
      stop() {
        this.onend?.();
      }
    };
    Object.assign(window, { SpeechRecognition: Fake, webkitSpeechRecognition: Fake });
  });
  await page.goto("/");
  await page.getByRole("button", { name: /ask by voice in english/i }).click();
  await expect(page).toHaveURL(/\/search\?q=what\+is\+momentum/);
  await expect(page.getByRole("region", { name: /Answer from your library/i })).toBeVisible({ timeout: 45_000 });

  await page.goto("/");
  await page.getByRole("button", { name: /voice language: english/i }).click();
  await expect(page.getByRole("button", { name: /ask by voice in hindi/i })).toBeVisible();
});

test("no voice button where the browser has no speech recognition", async ({ page }) => {
  await page.addInitScript(() => {
    Reflect.deleteProperty(window, "SpeechRecognition");
    Reflect.deleteProperty(window, "webkitSpeechRecognition");
  });
  await page.goto("/");
  await expect(page.getByRole("searchbox", { name: /Ask or search the library/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /ask by voice/i })).toHaveCount(0);
});

test("the app is installable: manifest, icons, and a service worker that only serves the offline page", async ({ page, request }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest).toMatchObject({ short_name: "Pravaha", display: "standalone", start_url: "/" });
  for (const icon of manifest.icons as { src: string; type: string }[]) {
    const res = await request.get(icon.src);
    expect(res.status(), icon.src).toBe(200);
    expect(res.headers()["content-type"]).toContain("image/png");
  }
  const sw = await request.get("/sw.js");
  expect(sw.status()).toBe(200);
  expect(sw.headers()["cache-control"]).toContain("no-cache");
  expect(await sw.text()).toContain('mode !== "navigate"');

  await page.goto("/offline");
  await expect(page.getByRole("heading", { name: /You're offline/i })).toBeVisible();
});

test("the microphone is allowed for Pravaha's own pages", async ({ request }) => {
  const res = await request.get("/");
  expect(res.headers()["permissions-policy"]).toContain("microphone=(self)");
});
