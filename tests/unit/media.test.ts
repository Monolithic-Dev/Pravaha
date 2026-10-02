import { describe, expect, it } from "vitest";

import {
  captionChunks,
  clipUrl,
  encodeLayerText,
  MOMENT_MAX_S,
  momentUrl,
  momentWindow,
  previewUrl,
  reelUrl,
  shareCardUrl,
  thumbUrl,
  trackingWarmupUrl,
} from "@/lib/media";

const ID = "pravaha/3f2b8c1e-0d4a-4c55-9b7e-1a2b3c4d5e6f";
const CLOUD = "demo";
const V = "https://res.cloudinary.com/demo/video/upload";
const words = [
  { w: "Regularization", s: 28.0, e: 28.8 },
  { w: "adds", s: 28.9, e: 29.1 },
  { w: "a", s: 29.2, e: 29.3 },
  { w: "penalty", s: 29.4, e: 29.6 },
  { w: "for", s: 30.0, e: 30.2 },
  { w: "large", s: 30.3, e: 30.5 },
  { w: "weights,", s: 30.6, e: 30.9 },
];

describe("momentWindow", () => {
  it("pads both sides by 1.5 s", () => {
    expect(momentWindow(754.2, 764.9)).toEqual({ start: 752.7, end: 766.4 });
  });

  it("never starts before 0 or ends after the video", () => {
    expect(momentWindow(0.5, 4, 5)).toEqual({ start: 0, end: 5 });
  });

  it("caps clips at 60 s", () => {
    const { start, end } = momentWindow(100, 400);
    expect(end - start).toBe(MOMENT_MAX_S);
  });

  it("always yields a positive window", () => {
    const { start, end } = momentWindow(10, 10, 9);
    expect(end).toBeGreaterThan(start);
  });
});

describe("captionChunks", () => {
  it("groups ≤4 words per card, timed relative to the clip start", () => {
    const cards = captionChunks(words, 26.5, 32.4);
    expect(cards.map((c) => c.text)).toEqual(["Regularization adds a penalty", "for large weights,"]);
    expect(cards[0]!.from).toBe(1.5); // 28.0 − 26.5
    expect(cards[1]!.from).toBe(3.5); // 30.0 − 26.5
    expect(cards[0]!.to).toBeLessThanOrEqual(cards[1]!.from);
    expect(cards[1]!.to).toBeGreaterThan(4.3); // last word ends at 30.9 → 4.4, plus a short hold
  });

  it("drops words outside the clip and never overlaps cards", () => {
    const cards = captionChunks(words, 29.0, 30.1);
    expect(cards.map((c) => c.text).join(" ")).not.toContain("Regularization");
    for (let i = 1; i < cards.length; i++) expect(cards[i]!.from).toBeGreaterThanOrEqual(cards[i - 1]!.to);
  });

  it("returns nothing without words", () => {
    expect(captionChunks([], 0, 10)).toEqual([]);
  });
});

describe("encodeLayerText", () => {
  it("double-escapes commas, slashes and percent signs for Cloudinary text layers", () => {
    expect(encodeLayerText("weights, 20/50%")).toBe("weights%252C%2020%252F50%2525");
  });
});

describe("Cloudinary URLs (compositions verified on real output in Phase 01)", () => {
  it("builds the vertical Moment: trim, g_auto crop in its own component, timed captions", () => {
    const [a, b] = captionChunks(words, 26.5, 32.4);
    const style = "co_white,b_rgb:000000b3,w_660,c_fit";
    expect(momentUrl(ID, 28, 30.9, { cloud: CLOUD, words })).toBe(
      `${V}/so_26.5,eo_32.4/c_fill,ar_9:16,w_720,g_auto/` +
        `l_text:arial_46_bold:Regularization%20adds%20a%20penalty,${style}/fl_layer_apply,g_south,y_220,so_${a!.from},eo_${a!.to}/` +
        `l_text:arial_46_bold:for%20large%20weights%252C,${style}/fl_layer_apply,g_south,y_220,so_${b!.from},eo_${b!.to}/` +
        `f_auto:video,q_auto/${ID}.mp4`,
    );
  });

  it("works without word timings (no captions)", () => {
    expect(momentUrl(ID, 10, 20, { cloud: CLOUD })).toBe(
      `${V}/so_8.5,eo_21.5/c_fill,ar_9:16,w_720,g_auto/f_auto:video,q_auto/${ID}.mp4`,
    );
  });

  it("builds the 16:9 clip, g_auto thumbnail and tracking warm-up", () => {
    expect(clipUrl(ID, 10, 20, CLOUD)).toBe(`${V}/so_8.5,eo_21.5/f_auto:video,q_auto/${ID}.mp4`);
    expect(thumbUrl(ID, 12.345, CLOUD)).toBe(`${V}/so_12.3,c_fill,ar_16:9,w_640,g_auto/f_auto,q_auto/${ID}.jpg`);
    expect(trackingWarmupUrl(ID, CLOUD)).toBe(`${V}/so_0,eo_1/c_fill,ar_9:16,w_90,g_auto/q_auto/${ID}.mp4`);
  });
});

describe("reelUrl (Answer Reels, verified on real output)", () => {
  const A = "pravaha/aaaaaaaa-0000-4000-8000-000000000001";
  const B = "pravaha/bbbbbbbb-0000-4000-8000-000000000002";

  it("splices clips from different sessions into one video with timed speaker labels", () => {
    const reel = reelUrl(
      [
        { publicId: A, startS: 26.5, endS: 29.5, label: "Prof. David · Overfitting" },
        { publicId: B, startS: 61.5, endS: 64.5, label: "Dr. Zira" },
      ],
      CLOUD,
    );
    expect(reel).toEqual({
      url:
        `${V}/so_25,eo_31,w_1280,h_720,c_fill/` +
        `l_video:pravaha:bbbbbbbb-0000-4000-8000-000000000002,fl_splice/so_60,eo_66,w_1280,h_720,c_fill/fl_layer_apply/` +
        `l_text:arial_34_bold:Prof.%20David%20%C2%B7%20Overfitting,co_white,b_rgb:0f766ecc/fl_layer_apply,g_north_west,x_40,y_40,so_0,eo_6/` +
        `l_text:arial_34_bold:Dr.%20Zira,co_white,b_rgb:0f766ecc/fl_layer_apply,g_north_west,x_40,y_40,so_6,eo_12/` +
        `f_auto:video,q_auto/${A}.mp4`,
      durationS: 12,
      clips: 2,
    });
  });

  it("caps the reel at 5 clips and 90 seconds", () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ publicId: A, startS: i * 100, endS: i * 100 + 25 }));
    const reel = reelUrl(many, CLOUD)!;
    expect(reel.clips).toBe(3); // 28 s each → the 4th would pass 90 s
    expect(reel.durationS).toBeLessThanOrEqual(90);
  });

  it("returns null with no clips", () => {
    expect(reelUrl([], CLOUD)).toBeNull();
  });
});

describe("shareCardUrl (Open Graph cards, verified on real output)", () => {
  const card = (title: string, subtitle?: string) => shareCardUrl(ID, 11.94, { title, subtitle }, CLOUD);

  it("composes the g_auto frame, edge fade, brand mark, title and subtitle as one 1200×630 image", () => {
    expect(card("Overfitting, explained", "Prof. David · 0:11")).toBe(
      `${V}/so_11.9,c_fill,w_1200,h_630,g_auto/e_gradient_fade:symmetric_pad,y_-0.5,b_black/` +
        `l_text:arial_30_bold:Pravaha,co_white,b_rgb:0f766e/fl_layer_apply,g_north_west,x_60,y_56/` +
        `l_text:arial_60_bold:Overfitting%252C%20explained,co_white,w_1080,c_fit/fl_layer_apply,g_south_west,x_60,y_130/` +
        `l_text:arial_34:Prof.%20David%20%C2%B7%200%3A11,co_rgb:99f6e4/fl_layer_apply,g_south_west,x_60,y_70/` +
        `f_jpg,q_auto/${ID}.jpg`,
    );
  });

  it("omits the subtitle layer when there is none", () => {
    expect(card("Title")).not.toContain("arial_34:");
  });

  it("truncates very long titles so the card never overflows", () => {
    const url = card("x".repeat(200));
    expect(url).toContain(`${"x".repeat(89)}%E2%80%A6,`);
    expect(url).not.toContain("x".repeat(90));
  });
});

describe("previewUrl", () => {
  it("asks Cloudinary for a short AI preview of the whole session, cropped for a card", () => {
    expect(previewUrl("pravaha/abc", "demo")).toBe(
      "https://res.cloudinary.com/demo/video/upload/e_preview:duration_6:max_seg_3:min_seg_dur_1/c_fill,ar_16:9,w_640/f_auto:video,q_auto/pravaha/abc.mp4",
    );
  });
});
