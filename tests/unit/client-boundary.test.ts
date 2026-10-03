import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// A React hook called from a Server Component crashes the page at request time, and neither the type checker
// nor the linter notices (the /search page broke in production this way when a hook was added to a component
// that had no "use client"). This guard fails the build instead: every file that calls a hook must be a client file.
const HOOK_CALL = /\buse(State|Effect|LayoutEffect|Ref|Memo|Callback|Reducer|SyncExternalStore|Router|Pathname|SearchParams|LiteUrl|DataSaver|SavedMoments|RecentQuestions|WatchProgress|WeakSpots)\s*\(/;

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    return e.isDirectory() ? files(path) : /\.(ts|tsx)$/.test(e.name) ? [path] : [];
  });
}

const code = (source: string) =>
  source
    .split("\n")
    .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
    .join("\n");

describe("client boundary", () => {
  const all = files(join(process.cwd(), "src"));

  it("finds the source files", () => {
    expect(all.length).toBeGreaterThan(50);
  });

  it("marks every file that calls a hook with \"use client\"", () => {
    const offenders = all.filter((path) => {
      const source = readFileSync(path, "utf8");
      return HOOK_CALL.test(code(source)) && !/^\s*(["'])use client\1/.test(source);
    });
    expect(offenders.map((p) => p.replace(process.cwd(), ""))).toEqual([]);
  });
});
