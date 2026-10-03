import { expect, test } from "@playwright/test";

// A 360 px phone: every control in the header must be on screen, and no page may scroll sideways.
// (At 360 px the old single-row header needed ~560 px, which pushed Studio, data saver and the theme switch off-screen.)
test.use({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true });

const PAGES = ["/", "/concepts", "/learn", "/saved", "/studio", "/try", "/judges", "/privacy"];

for (const path of PAGES) {
  test(`${path} fits a 360 px phone`, async ({ page }) => {
    await page.goto(path);
    const nav = page.getByRole("navigation", { name: "Main" });
    for (const name of [/Studio/, /Data saver|data saver/, /theme/i]) {
      const el = nav.getByRole(/Studio/.test(String(name)) ? "link" : "button", { name }).first();
      await expect(el).toBeVisible();
      const box = (await el.boundingBox())!;
      expect(box.x + box.width, `${name} is on screen`).toBeLessThanOrEqual(361);
    }
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(361);
  });
}
