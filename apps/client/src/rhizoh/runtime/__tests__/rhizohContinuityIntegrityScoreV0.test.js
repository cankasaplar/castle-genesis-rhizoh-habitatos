import { describe, expect, it, beforeEach } from "vitest";
import {
  CIS_PRODUCT_GATE_THRESHOLD_V0,
  resetContinuityIntegrityScoreForTestV0,
  sampleContinuityIntegrityScoreV0
} from "../rhizohContinuityIntegrityScoreV0.js";
import {
  bootstrapRhizohContinuityFirstPaintV0
} from "../rhizohT0FirstFrameBootstrapV0.js";
import { resetFelFailureExpressionForTestV0 } from "../rhizohPresenceStateEngineV0.js";
import { resetExperienceContinuityForTestV0 } from "../rhizohExperienceContinuityCompilerV0.js";
import { resetTemporalDriftGuardForTestV0 } from "../rhizohTemporalDriftGuardV0.js";

describe("rhizohContinuityIntegrityScoreV0", () => {
  beforeEach(() => {
    resetContinuityIntegrityScoreForTestV0();
    resetFelFailureExpressionForTestV0();
    resetExperienceContinuityForTestV0();
    resetTemporalDriftGuardForTestV0();
    if (typeof window !== "undefined") {
      window.__rhizoh = {};
    }
  });

  it("bootstrap sets continuity first paint", async () => {
    const out = await bootstrapRhizohContinuityFirstPaintV0({
      returningUser: true,
      hasAnchor: true,
      nowMs: 1000
    });
    expect(out.paint.ok).toBe(true);
    expect(out.paint.continuity_line).toBeTruthy();
  });

  it("samples CIS with observe_only and product gate threshold", async () => {
    await bootstrapRhizohContinuityFirstPaintV0({ returningUser: true, hasAnchor: true });
    const cis = sampleContinuityIntegrityScoreV0({
      fieldState: "IDLE",
      voiceReady: false,
      firstPaintOk: true
    });
    expect(cis.observe_only).toBe(true);
    expect(cis.cis01).toBeGreaterThan(0.4);
    expect(cis.product_gate_threshold).toBe(CIS_PRODUCT_GATE_THRESHOLD_V0);
    expect(typeof cis.product_gate_ok).toBe("boolean");
  });
});
