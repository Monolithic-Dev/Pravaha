import { expect, test } from "@playwright/test";

// The public status page and its JSON twin (run against the deployed app, like smoke.spec.ts).

test("the status page shows a verdict, the database, Cloudinary credits and the AI models", async ({ page }) => {
  await page.goto("/status");
  await expect(page.getByRole("heading", { name: "Status", exact: true })).toBeVisible();
  await expect(page.getByRole("status")).toContainText(/operational|degraded|outage/i);
  await expect(page.getByRole("heading", { name: "Database" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cloudinary credits" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "AI models" })).toBeVisible();
});

test("/api/status is secret-free JSON an uptime monitor can watch", async ({ request }) => {
  const res = await request.get("/api/status");
  expect([200, 503]).toContain(res.status());
  const body = await res.json();
  expect(["operational", "degraded", "outage"]).toContain(body.level);
  expect(typeof body.database.ok).toBe("boolean");
  expect(body.cloudinary === null || typeof body.cloudinary.pct === "number").toBe(true);
  const text = JSON.stringify(body);
  expect(text).not.toMatch(/api[_-]?key|secret|postgres:\/\/|gsk_|AIza/i);
});
