import { describe, expect, it } from "vitest";

import type { Lecture } from "@/lib/lectures";
import { hoursLeft, trialAcceptsUpload } from "@/lib/trial-policy";

const NOW = Date.UTC(2026, 9, 2, 12);
const trial: Lecture = {
  id: "3f2b8c1e-0d4a-4c55-9b7e-1a2b3c4d5e6f",
  publicId: "pravaha/3f2b8c1e-0d4a-4c55-9b7e-1a2b3c4d5e6f",
  title: "My video",
  speaker: null,
  status: "processing",
  visibility: "unlisted",
  durationS: null,
  createdAt: new Date(NOW - 5 * 60_000).toISOString(),
  trialExpiresAt: new Date(NOW + 24 * 3600_000).toISOString(),
};

describe("trialAcceptsUpload", () => {
  it("accepts a fresh trial that is waiting for its video", () => {
    expect(trialAcceptsUpload(trial, NOW)).toBe(true);
  });

  it("refuses organizer sessions, so the trial preset can't upload into them", () => {
    expect(trialAcceptsUpload({ ...trial, trialExpiresAt: null }, NOW)).toBe(false);
  });

  it("refuses a second upload once the trial has its video", () => {
    expect(trialAcceptsUpload({ ...trial, status: "ready" }, NOW)).toBe(false);
  });

  it("refuses trials created more than 30 minutes ago", () => {
    expect(trialAcceptsUpload({ ...trial, createdAt: new Date(NOW - 31 * 60_000).toISOString() }, NOW)).toBe(false);
  });
});

describe("hoursLeft", () => {
  it("rounds up to whole hours and never says less than one", () => {
    expect(hoursLeft(new Date(NOW + 23.2 * 3600_000).toISOString(), NOW)).toBe(24);
    expect(hoursLeft(new Date(NOW + 60_000).toISOString(), NOW)).toBe(1);
    expect(hoursLeft(new Date(NOW - 60_000).toISOString(), NOW)).toBe(1);
  });
});
