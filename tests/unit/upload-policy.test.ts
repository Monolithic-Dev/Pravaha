import { describe, expect, it } from "vitest";

import { checkParamsToSign } from "@/lib/upload-policy";

const NOW = Date.UTC(2026, 9, 1);
const ID = "pravaha/3f2b8c1e-0d4a-4c55-9b7e-1a2b3c4d5e6f";
const base = { public_id: ID, upload_preset: "pravaha_signed", timestamp: NOW / 1000, source: "uw" };
const check = (params: Record<string, unknown>) =>
  checkParamsToSign(params, { presets: ["pravaha_signed", "pravaha_trial"], nowMs: NOW });

describe("checkParamsToSign", () => {
  it("accepts the widget's normal params", () => {
    expect(check(base)).toEqual({ ok: true, publicId: ID, preset: "pravaha_signed" });
  });

  it("accepts the trial preset and reports which preset was used", () => {
    expect(check({ ...base, upload_preset: "pravaha_trial" })).toEqual({ ok: true, publicId: ID, preset: "pravaha_trial" });
  });

  it("rejects params that could change processing (e.g. notification_url, eager)", () => {
    expect(check({ ...base, notification_url: "https://evil.example" }).ok).toBe(false);
    expect(check({ ...base, eager: "c_scale,w_10000" }).ok).toBe(false);
  });

  it("rejects another preset", () => {
    expect(check({ ...base, upload_preset: "unsigned_default" }).ok).toBe(false);
  });

  it("rejects public ids outside the Pravaha lecture namespace", () => {
    for (const public_id of ["other/abc", "pravaha/../x", "pravaha/not-a-uuid", undefined]) {
      expect(check({ ...base, public_id }).ok).toBe(false);
    }
  });

  it("rejects stale timestamps", () => {
    expect(check({ ...base, timestamp: NOW / 1000 - 3600 }).ok).toBe(false);
    expect(check({ ...base, timestamp: undefined }).ok).toBe(false);
  });
});
