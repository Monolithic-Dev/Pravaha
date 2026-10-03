import { describe, expect, it } from "vitest";

import { creditLevel, failureKind, overallStatus } from "@/lib/status-level";

const healthy = { database: true, aiConfigured: true, aiOk: 5, aiTotal: 5, credits: "ok" as const };

describe("creditLevel", () => {
  it("warns at 80% and goes critical at 95%", () => {
    expect([0, 79.9, 80, 94.9, 95, 100].map(creditLevel)).toEqual(["ok", "ok", "warn", "warn", "critical", "critical"]);
  });
});

describe("failureKind", () => {
  it("shows a category, never the raw error", () => {
    expect(failureKind('{"error":{"code":429,"message":"quota exceeded"}}')).toBe("quota");
    expect(failureKind("RESOURCE_EXHAUSTED")).toBe("quota");
    expect(failureKind('{"error":{"code":503,"message":"This model is currently experiencing high demand"}}')).toBe("overloaded");
    expect(failureKind("invalid JSON")).toBe("error");
    expect(failureKind(undefined)).toBe("error");
  });
});

describe("overallStatus", () => {
  it("is operational when everything works, and when only some models are down", () => {
    expect(overallStatus(healthy)).toEqual({ level: "operational", reasons: [] });
    expect(overallStatus({ ...healthy, aiOk: 2 }).level).toBe("operational");
    expect(overallStatus({ ...healthy, credits: "warn" }).level).toBe("operational");
  });

  it("is an outage when the database is down", () => {
    expect(overallStatus({ ...healthy, database: false }).level).toBe("outage");
  });

  it("is degraded, with a plain reason, when no AI model answers or credits are nearly gone", () => {
    const noAi = overallStatus({ ...healthy, aiOk: 0 });
    expect(noAi.level).toBe("degraded");
    expect(noAi.reasons[0]).toMatch(/closest|relevant clips/i);
    expect(overallStatus({ ...healthy, credits: "critical" }).reasons[0]).toMatch(/credits/i);
    expect(overallStatus({ ...healthy, aiOk: 0, credits: "critical" }).reasons).toHaveLength(2);
  });

  it("doesn't alarm about AI when none is configured or no probe is available", () => {
    expect(overallStatus({ ...healthy, aiConfigured: false, aiOk: null, aiTotal: 0 }).level).toBe("operational");
    expect(overallStatus({ ...healthy, aiOk: null, aiTotal: 0, credits: null }).level).toBe("operational");
  });
});
