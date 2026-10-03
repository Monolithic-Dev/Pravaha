import { expect, test } from "@playwright/test";

// Smoke test against the DEPLOYED app (docs/TESTING.md). Set these to content your demo library covers.
const PHRASE = process.env.SMOKE_PHRASE ?? "gradient descent";
const QUESTION = process.env.SMOKE_QUESTION ?? "What happens if the learning rate is too high?";

test("home renders the Ask bar and library", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Ask your recordings/i })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: /Ask or search the library/i })).toBeVisible();
});

test("Find lands on the exact second", async ({ page }) => {
  await page.goto(`/search?q=${encodeURIComponent(PHRASE)}`);
  const found = page.getByRole("region", { name: /Moments found/i });
  const link = found.locator('a[href^="/watch/"]').first();
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  expect(href).toMatch(/^\/watch\/[0-9a-f-]{36}\?t=\d+$/);
  await page.goto(href!);
  await expect(page.locator("video").first()).toBeAttached();
});

test("Ask answers with at least one playable citation", async ({ page }) => {
  await page.goto(`/search?q=${encodeURIComponent(QUESTION)}`);
  const answer = page.getByRole("region", { name: /Answer from your library/i });
  await expect(answer.getByRole("button", { name: "Source 1" }).first()).toBeVisible({ timeout: 30_000 });
  await expect(answer.getByRole("link", { name: "Open full session" }).first()).toBeVisible();
});

test("Ask refuses questions the library doesn't cover", async ({ page }) => {
  await page.goto(`/search?q=${encodeURIComponent("Who won the IPL in 2024?")}`);
  await expect(page.getByText(/isn.t covered in this library/i)).toBeVisible({ timeout: 30_000 });
});

test("organizer API rejects anonymous uploads", async ({ request }) => {
  // Well-formed organizer-preset params (the route validates the shape first and answers 400 to malformed ones),
  // from someone with no organizer cookie: it must refuse to sign.
  const res = await request.post("/api/upload-signature", {
    data: {
      paramsToSign: {
        timestamp: Math.floor(Date.now() / 1000),
        upload_preset: "pravaha_signed",
        public_id: "pravaha/6f1c2a52-8d4b-4c7e-9f21-0a5b3c1d2e4f",
        source: "uw",
      },
    },
  });
  expect(res.status()).toBe(401);
});

test("webhook rejects unsigned notifications", async ({ request }) => {
  const res = await request.post("/api/webhooks/cloudinary", { data: { public_id: "pravaha/x" } });
  expect(res.status()).toBe(401);
});
