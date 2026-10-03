import { describe, expect, it } from "vitest";

import { connectionIsSlow, resolveLite } from "@/lib/data-saver";
import { clipUrl, liteUrl, momentUrl, previewUrl, reelUrl, shareCardUrl, thumbUrl } from "@/lib/media";

const words = [
  { w: "hello", s: 1, e: 1.3 },
  { w: "world", s: 1.4, e: 1.8 },
];

describe("liteUrl", () => {
  it("halves a reel's frame and shrinks its labels, every clip and layer alike", () => {
    const reel = reelUrl([
      { publicId: "a/b", startS: 1, endS: 9, label: "1 · A" },
      { publicId: "c/d", startS: 2, endS: 8, label: "2 · B" },
    ])!.url;
    const lite = liteUrl(reel);
    expect(lite).not.toContain("w_1280");
    expect(lite.match(/w_640,h_360,c_fill/g)).toHaveLength(2);
    expect(lite).toContain("arial_20_bold");
    expect(lite).toContain("x_20,y_20");
    expect(lite).toContain("f_auto:video,q_auto:low");
  });

  it("makes a Moment 360 wide with captions in proportion", () => {
    const lite = liteUrl(momentUrl("a/b", 1, 2, { words }));
    expect(lite).toContain("c_fill,ar_9:16,w_360,g_auto");
    expect(lite).not.toContain("arial_46_bold");
    expect(lite).toContain("w_330,c_fit");
    expect(lite).toContain("y_110");
    expect(lite).toContain("q_auto:low");
  });

  it("caps an original-framing clip at 640 wide", () => {
    expect(liteUrl(clipUrl("a/b", 10, 20))).toContain("/c_limit,w_640/f_auto:video,q_auto:low/");
  });

  it("shrinks thumbnails and hover previews", () => {
    expect(liteUrl(thumbUrl("a/b", 5))).toContain("ar_16:9,w_320,g_auto/f_auto,q_auto:low/");
    expect(liteUrl(previewUrl("a/b"))).toContain("ar_16:9,w_320/");
  });

  it("is idempotent and leaves other URLs alone", () => {
    const once = liteUrl(momentUrl("a/b", 1, 2, { words }));
    expect(liteUrl(once)).toBe(once);
    expect(liteUrl("https://example.com/video/upload/q_auto/x.mp4")).toBe("https://example.com/video/upload/q_auto/x.mp4");
    const card = shareCardUrl("a/b", 3, { title: "T" });
    expect(liteUrl(card)).toContain("w_1200,h_630");
  });
});

describe("resolveLite", () => {
  it("lets the stored choice win", () => {
    expect(resolveLite("on", { effectiveType: "4g" })).toBe(true);
    expect(resolveLite("off", { saveData: true })).toBe(false);
  });

  it("follows a slow or Save-Data connection in auto, and stays full quality otherwise", () => {
    expect(resolveLite("auto", { effectiveType: "3g" })).toBe(true);
    expect(resolveLite("auto", { saveData: true, effectiveType: "4g" })).toBe(true);
    expect(resolveLite("auto", { effectiveType: "4g" })).toBe(false);
    expect(resolveLite("auto", undefined)).toBe(false);
    expect(connectionIsSlow({})).toBe(false);
  });
});
