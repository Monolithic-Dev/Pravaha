import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { CAPABILITIES } from "@/lib/capabilities";

describe("CAPABILITIES (the /judges page)", () => {
  it("points every capability at code that exists", () => {
    for (const c of CAPABILITIES) expect(existsSync(join(process.cwd(), c.code)), `${c.name}: ${c.code}`).toBe(true);
  });

  it("has unique names and complete entries", () => {
    expect(new Set(CAPABILITIES.map((c) => c.name)).size).toBe(CAPABILITIES.length);
    for (const c of CAPABILITIES) expect([c.name, c.does, c.see, c.code].every((s) => s.trim().length > 3)).toBe(true);
  });
});
