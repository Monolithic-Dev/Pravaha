import { expect, test } from "@playwright/test";

// Data saver (src/lib/data-saver.ts): the header switch makes Cloudinary serve smaller, lower-quality renditions.

test("the data saver switch shrinks Cloudinary thumbnails and remembers the choice", async ({ page }) => {
  await page.goto("/concepts/overfitting");
  const thumb = page.locator('img[src*="res.cloudinary.com"]').first();
  await expect(thumb).toHaveAttribute("src", /w_640/);

  await page.getByRole("button", { name: /turn on data saver/i }).first().click();
  await expect(thumb).toHaveAttribute("src", /w_320.*q_auto:low/);

  await page.reload();
  await expect(page.getByRole("button", { name: /data saver is on/i }).first()).toHaveAttribute("aria-pressed", "true");
});

test("with data saver on, a session streams the lighter ladder", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("pravaha-data-saver", "on"));
  const profiles: string[] = [];
  page.on("request", (r) => {
    const m = r.url().match(/sp_[a-z_]+/);
    if (/\.m3u8/.test(r.url()) && m) profiles.push(m[0]);
  });
  await page.goto("/");
  await page.locator('a[href^="/watch/"]').first().click();
  await expect.poll(() => profiles, { timeout: 20_000 }).toContain("sp_sd");
  expect(profiles).not.toContain("sp_hd_lean");
});
