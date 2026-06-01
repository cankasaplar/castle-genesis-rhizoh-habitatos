import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildContinuityEntryCompressionPlanV0,
  CEC_PHASE_SEQUENCE_V0,
  continuityEntryCompressionTotalMsV0,
  maybeStartContinuityEntryCompressionV0,
  shouldUseContinuityEntryCompressionV0
} from "../continuityEntryCompressionV0.js";
import { resetMemoryAnchorSessionV0 } from "../memoryAnchorSystemV0.js";
import {
  resetExpressiveRealityTransitionSessionV0,
  RTL_SESSION_COMPLETE_KEY_V0
} from "../expressiveRealityTransitionV0.js";

describe("continuityEntryCompressionV0", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_RHIZOH_SURFACE_CREATIVE", "1");
    vi.stubEnv("VITE_RHIZOH_RTL_FULL_CEREMONY", "");
    vi.stubEnv("VITE_RHIZOH_VISIBLE_ENTRY_PIPELINE", "1");
    resetExpressiveRealityTransitionSessionV0();
    resetMemoryAnchorSessionV0();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetExpressiveRealityTransitionSessionV0();
    resetMemoryAnchorSessionV0();
  });

  it("shouldUse only when visible pipeline env is set", () => {
    expect(shouldUseContinuityEntryCompressionV0()).toBe(true);
    vi.stubEnv("VITE_RHIZOH_VISIBLE_ENTRY_PIPELINE", "");
    expect(shouldUseContinuityEntryCompressionV0()).toBe(false);
    vi.stubEnv("VITE_RHIZOH_VISIBLE_ENTRY_PIPELINE", "1");
  });

  it("builds exactly three compression phases under 1.2s", () => {
    const plan = buildContinuityEntryCompressionPlanV0({});
    expect(plan.phases.length).toBe(3);
    expect(plan.phases.map((p) => p.id)).toEqual([...CEC_PHASE_SEQUENCE_V0]);
    expect(continuityEntryCompressionTotalMsV0(plan)).toBeLessThanOrEqual(1200);
    expect(plan.phases.every((p) => p.variant === "compression")).toBe(true);
  });

  it("maybeStart completes and marks session", async () => {
    const phases = [];
    const started = maybeStartContinuityEntryCompressionV0(
      {},
      {
        onPhase: (p) => phases.push(p.id),
        onComplete: () => {}
      }
    );
    expect(started.started).toBe(true);
    await new Promise((r) => setTimeout(r, 1100));
    expect(phases.length).toBeGreaterThanOrEqual(3);
    expect(sessionStorage.getItem(RTL_SESSION_COMPLETE_KEY_V0)).toBe("1");
  });
});
