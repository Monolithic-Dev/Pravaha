import { expect, test } from "@playwright/test";

// Smoke tests for the pages a judge is most likely to open (run against the deployed app, like smoke.spec.ts).

test("the judges page maps the brief to Cloudinary capabilities", async ({ page }) => {
  await page.goto("/judges");
  await expect(page.getByRole("heading", { name: /Pravaha, for judges/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Cloudinary capabilities in use/i })).toBeVisible();
});

test("the concept map opens a concept with a compare reel", async ({ page }) => {
  await page.goto("/concepts");
  await page.getByRole("link", { name: /Overfitting/ }).first().click();
  await expect(page.getByRole("heading", { name: "Overfitting" })).toBeVisible();
  await expect(page.getByRole("button", { name: /back to back/i })).toBeVisible();
});

test("Learn explains itself and takes a topic", async ({ page }) => {
  await page.goto("/learn?topic=learning%20rate");
  await expect(page.getByRole("heading", { name: /Learn a topic/i })).toBeVisible();
});
