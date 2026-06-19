import { describe, expect, it } from "vitest";
import {
  assertCnrTripleSeparationV0,
  CNR_AXIS_V0,
  CNR_MODE_V0,
  getCausalNavigationRuntimeDescriptorV0
} from "../causalNavigationRuntimeV0.js";

describe("causalNavigationRuntimeV0", () => {
  it("exposes four-axis CNR descriptor", () => {
    const d = getCausalNavigationRuntimeDescriptorV0();
    expect(d.acronym).toBe("CNR");
    expect(d.axes.length).toBe(4);
    expect(d.axes.map((a) => a.axis)).toContain(CNR_AXIS_V0.TRAVERSAL);
    expect(d.tripleSeparation.rule).toContain("perception");
  });

  it("CNR-01 passes when perception interaction execution are separated", () => {
    const result = assertCnrTripleSeparationV0({
      cognitiveBinding: {
        push: { uiEvents: [{ executionClass: "suggest" }] }
      },
      cognitiveAction: {
        exploration: { executionClass: "read_only", causallyInert: true },
        cubeStateCommit: false
      },
      commit: null
    });
    expect(result.ok).toBe(true);
  });

  it("CNR-01 fails when CAL attempts execution leak", () => {
    const result = assertCnrTripleSeparationV0({
      cognitiveAction: {
        exploration: { executionClass: "mutate_l1", causallyInert: true },
        cubeStateCommit: true
      },
      commit: { ok: true }
    });
    expect(result.ok).toBe(false);
  });

  it("maps modes to modules", () => {
    expect(CNR_MODE_V0.PERCEPTION).toBe("perception");
    expect(CNR_MODE_V0.INTERACTION).toBe("interaction");
    expect(CNR_MODE_V0.EXECUTION).toBe("execution");
  });
});
