import { describe, expect, it } from "vitest";
import {
  wireAcademyLearningUnionV0,
  ACADEMY_LEARNING_UNION_WIRE_SCHEMA_V0,
  startAcademyLearningUnionBootWireV0,
  resetAcademyLearningUnionWireForTestV0
} from "../academyLearningUnionWireV0.js";

describe("academyLearningUnionWireV0", () => {
  it("wires go and checkers tubes and returns union snapshot", async () => {
    const out = await wireAcademyLearningUnionV0({ demoMove: true });
    expect(out.schema).toBe(ACADEMY_LEARNING_UNION_WIRE_SCHEMA_V0);
    expect(out.ok).toBe(true);
    expect(out.interpretationOnly).toBe(true);
    expect(out.union.schema).toContain("academy_learning_union");
    expect(out.wires.go?.ok).toBe(true);
    expect(out.wires.checkers?.ok).toBe(true);
  });

  it("boot wire schedules once", async () => {
    resetAcademyLearningUnionWireForTestV0();
    startAcademyLearningUnionBootWireV0({ delayMs: 10 });
    startAcademyLearningUnionBootWireV0({ delayMs: 10 });
    await new Promise((r) => setTimeout(r, 40));
    const union = window.__rhizoh?.lastAcademyLearningUnionWire?.union;
    expect(union?.disciplines?.go?.movesSeen).toBeGreaterThan(0);
    expect(union?.disciplines?.checkers?.movesSeen).toBeGreaterThan(0);
  });
});
