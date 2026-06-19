import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetContinuityKernelForTestV0,
  ensureContinuityKernelDevToolsV0,
  transitionContinuityStateV0,
  CONTINUITY_STATE_V0
} from "../rhizohContinuityKernelV0.js";

describe("rhizohContinuityKernelV0", () => {
  beforeEach(() => {
    __resetContinuityKernelForTestV0();
    delete window.__rhizoh?.continuityKernel;
  });

  it("publishes rebuildCausalGraph on continuityKernel registry", () => {
    ensureContinuityKernelDevToolsV0();
    expect(typeof window.__rhizoh.continuityKernel.rebuildCausalGraph).toBe("function");

    transitionContinuityStateV0(CONTINUITY_STATE_V0.THINKING, { source: "test" });
    expect(typeof window.__rhizoh.continuityKernel.rebuildCausalGraph).toBe("function");
    expect(window.__rhizoh.continuityKernel.state).toBe(CONTINUITY_STATE_V0.THINKING);
  });
});
