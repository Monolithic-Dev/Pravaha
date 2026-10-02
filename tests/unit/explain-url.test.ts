import { describe, expect, it } from "vitest";

import { explainUrl, summarizeParams } from "@/lib/explain-url";
import { momentUrl, playerUrls, reelUrl, thumbUrl } from "@/lib/media";

const ID = "pravaha/3f2b8c1e-0d4a-4c55-9b7e-1a2b3c4d5e6f";
const meanings = (url: string) => explainUrl(url)!.steps.flatMap((s) => s.params.map((p) => p.meaning));

describe("explainUrl", () => {
  it("splits a thumbnail into its steps and the asset", () => {
    const e = explainUrl(thumbUrl(ID, 12, "demo"))!;
    expect(e.resource).toBe("video");
    expect(e.steps.map((s) => s.raw)).toEqual(["so_12,c_fill,ar_16:9,w_640,g_auto", "f_auto,q_auto"]);
    expect(e.asset).toBe(`${ID}.jpg`);
  });

  it("explains every parameter of a Moment, including its caption text", () => {
    const url = momentUrl(ID, 10, 14, { cloud: "demo", words: [{ w: "Learning, rate", s: 10, e: 11 }] });
    const all = meanings(url);
    expect(all).not.toContain(null);
    expect(all).toContain("aspect ratio 9 : 16 (vertical, for Reels and Shorts)");
    expect(all.some((m) => m?.startsWith("text layer “Learning, rate”"))).toBe(true);
  });

  it("explains an Answer Reel's splice across sessions", () => {
    const reel = reelUrl(
      [
        { publicId: ID, startS: 5, endS: 10, label: "Dr. Rao" },
        { publicId: "pravaha/other", startS: 20, endS: 25 },
      ],
      "demo",
    )!;
    const all = meanings(reel.url);
    expect(all).toContain("joins the next clip onto the end of this one");
    expect(all).toContain("another video (pravaha/other) as a layer");
  });

  it("handles the player's stream, data and raw URLs, with or without a version", () => {
    const urls = playerUrls(ID, "demo");
    expect(explainUrl(urls.stream)!.steps.map((s) => s.raw)).toEqual(["q_auto", "sp_hd_lean"]);
    expect(explainUrl(urls.transcript)).toEqual({ resource: "raw", steps: [], asset: `${ID}.transcript` });
    expect(explainUrl(`https://res.cloudinary.com/demo/video/upload/q_auto/v123/${ID}.m3u8?_s=vp`)!.asset).toBe(`${ID}.m3u8`);
  });

  it("returns null for anything that isn't a Cloudinary delivery URL", () => {
    expect(explainUrl("https://example.com/video/upload/x.mp4")).toBeNull();
  });
});

describe("summarizeParams", () => {
  it("counts a Moment's repeated caption layers instead of listing each one", () => {
    const words = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine"].map((w, i) => ({
      w,
      s: 10 + i * 0.5,
      e: 10.4 + i * 0.5,
    }));
    const summary = summarizeParams(explainUrl(momentUrl(ID, 10, 14, { cloud: "demo", words }))!);
    const textLayers = summary.find((p) => p.meaning.startsWith("text layer"))!;
    expect(textLayers.count).toBe(3);
    expect(summary.filter((p) => p.meaning.startsWith("text layer"))).toHaveLength(1);
    expect(summary.length).toBeLessThan(20);
  });
});
