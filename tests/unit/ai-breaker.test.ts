import { describe, expect, it } from "vitest";

import { COOLDOWN_OVERLOAD_MS, COOLDOWN_QUOTA_MS, cooldownFor, createBreaker } from "@/lib/ai-breaker";

describe("cooldownFor", () => {
  it("cools down quota, auth and overload failures", () => {
    expect(cooldownFor(new Error('{"error":{"code":429,"status":"RESOURCE_EXHAUSTED"}}'))).toBe(COOLDOWN_QUOTA_MS);
    expect(cooldownFor(new Error("groq 401: invalid api key"))).toBe(COOLDOWN_QUOTA_MS);
    expect(cooldownFor(new Error('{"error":{"code":503,"message":"high demand","status":"UNAVAILABLE"}}'))).toBe(COOLDOWN_OVERLOAD_MS);
  });

  it("retries timeouts and malformed replies on the next request", () => {
    expect(cooldownFor(new DOMException("The operation was aborted due to timeout", "TimeoutError"))).toBe(0);
    expect(cooldownFor(new SyntaxError("Unexpected token < in JSON"))).toBe(0);
  });
});

describe("createBreaker", () => {
  it("opens for the cooldown, then closes; success closes it early", () => {
    const b = createBreaker();
    const t0 = 1_000_000;
    b.recordFailure("gemini-a", new Error("429 quota"), t0);
    expect(b.isOpen("gemini-a", t0 + 1)).toBe(true);
    expect(b.isOpen("gemini-b", t0 + 1)).toBe(false);
    expect(b.isOpen("gemini-a", t0 + COOLDOWN_QUOTA_MS + 1)).toBe(false);

    b.recordFailure("gemini-a", new Error("503 UNAVAILABLE"), t0);
    b.recordSuccess("gemini-a");
    expect(b.isOpen("gemini-a", t0 + 1)).toBe(false);
  });

  it("doesn't open on a plain timeout", () => {
    const b = createBreaker();
    expect(b.recordFailure("m", new Error("aborted"), 0)).toBe(0);
    expect(b.isOpen("m", 1)).toBe(false);
  });
});
