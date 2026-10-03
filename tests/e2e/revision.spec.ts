import { expect, test } from "@playwright/test";

// Weak spots and study notes against the deployed app (like smoke.spec.ts).

async function firstSessionPath(page: import("@playwright/test").Page) {
  await page.goto("/");
  const href = await page.locator('a[href^="/watch/"]').first().getAttribute("href");
  expect(href).toMatch(/^\/watch\/[0-9a-f-]{36}/);
  return href!.split("?")[0]!;
}

test("a wrong quiz answer becomes a weak spot with a revision reel, and clears when dismissed", async ({ page }) => {
  await page.goto(await firstSessionPath(page));
  await page.getByRole("tab", { name: /study/i }).click();
  const first = page.locator("ol > li").filter({ hasText: "1." }).first();
  // Try each option until one is marked incorrect (the correct one can't be known from the page).
  for (let i = 0; i < 4; i++) {
    const q = page.locator("ol > li").filter({ hasText: "1." }).first();
    await q.locator("button").nth(i).click();
    if (await q.getByText("Not quite").count()) break;
    await page.reload();
    await page.getByRole("tab", { name: /study/i }).click();
  }
  await expect(first.getByText("Not quite")).toBeVisible();

  await page.goto("/saved");
  await expect(page.getByRole("heading", { name: /Weak spots/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /weak-spot reel/i })).toBeVisible();
  await page.getByRole("button", { name: /got this/i }).first().click();
  await expect(page.getByText(/collect here/)).toBeVisible();
});

test("study notes list timestamps that link back into the session, and download as Markdown", async ({ page, request }) => {
  const watch = await firstSessionPath(page);
  const id = watch.replace("/watch/", "");
  await page.goto(`/notes/${id}`);
  await expect(page.getByRole("button", { name: /Copy as Markdown/ })).toBeVisible();
  await expect(page.locator('a[href*="?t="]').first()).toBeVisible();

  const md = await request.get(`/api/lectures/${id}/notes?format=md&download=1`);
  expect(md.status()).toBe(200);
  expect(md.headers()["content-type"]).toContain("text/markdown");
  expect(md.headers()["content-disposition"]).toContain(".md");
  expect(await md.text()).toMatch(/^# .+\n/);
});
