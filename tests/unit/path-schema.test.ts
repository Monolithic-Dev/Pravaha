import { describe, expect, it } from "vitest";

import { MAX_STEPS, stepLabel, validatePath, type RawPath } from "@/lib/path-schema";

const candidates = [1, 2, 3, 4, 5, 6, 7].map((segmentId) => ({ segmentId, lectureId: `L${segmentId % 3}` }));
const step = (segment_id: number, title = `Step ${segment_id}`) => ({ title, why: `Why ${segment_id}`, segment_id });

describe("validatePath", () => {
  it("keeps the model's order and numbers steps from 1", () => {
    const path = validatePath({ title: " Optimizers 101 ", steps: [step(4), step(1), step(6)] }, candidates)!;
    expect(path.title).toBe("Optimizers 101");
    expect(path.steps.map((s) => [s.n, s.segmentId, s.stepTitle])).toEqual([
      [1, 4, "Step 4"],
      [2, 1, "Step 1"],
      [3, 6, "Step 6"],
    ]);
  });

  it("drops steps that point at moments it wasn't given, repeats and untitled steps", () => {
    const raw: RawPath = { title: "T", steps: [step(2), step(99), step(2), step(3, "  "), step(5), step(7)] };
    expect(validatePath(raw, candidates)!.steps.map((s) => s.segmentId)).toEqual([2, 5, 7]);
  });

  it("caps the course at the reel's clip limit", () => {
    const raw: RawPath = { title: "T", steps: [1, 2, 3, 4, 5, 6, 7].map((id) => step(id)) };
    expect(validatePath(raw, candidates)!.steps).toHaveLength(MAX_STEPS);
  });

  it("returns null rather than padding a course with fewer than 3 real steps", () => {
    expect(validatePath({ title: "T", steps: [step(1), step(42), step(43)] }, candidates)).toBeNull();
  });

  it("labels reel steps", () => {
    expect(stepLabel(2, "Momentum")).toBe("2 · Momentum");
  });
});
