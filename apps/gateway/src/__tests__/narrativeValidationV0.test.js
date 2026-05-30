import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  decomposeNarrativeConfidenceV0,
  injectNarrativeUncertaintyV0,
  monitorNarrativeRawDivergenceV0,
  validateNarrativeV0,
  UNCERTAINTY_TAG_V0,
  DIVERGENCE_FLAG_V0
} from "../ops/narrativeValidationV0.js";
import {
  compressToSystemStateV0,
  interpretSystemStateV0,
  SYSTEM_RISK_V0
} from "../ops/unifiedStateNarrativeV0.js";
import { FAILURE_MODE_ID_V0 } from "../ops/failureModeClassificationV0.js";

describe("narrativeValidationV0", () => {
  const signalsProjection = {
    source: "live_ops",
    gcl: { health: { ok: true, mode: "dev_memory" } },
    rollout: { limit: 200, activeTurns: 0, zsetPressure: "ok", health: { ok: true } },
    lifecycle: { purged: 0 },
    coordination: { sim: true },
    derived: { rolloutUtilization: 0 },
    loadTest: {
      available: true,
      dominantFailureMode: FAILURE_MODE_ID_V0.SOFT_SATURATION,
      analysis: {
        dominantFailureMode: FAILURE_MODE_ID_V0.SOFT_SATURATION,
        executionMode: "coordination_sim",
        sliceCount: 7,
        analyzedAt: "2026-05-25T00:00:00.000Z"
      }
    }
  };

  it("decomposes confidence with source agreement", () => {
    const state = compressToSystemStateV0(signalsProjection);
    const decomp = decomposeNarrativeConfidenceV0(signalsProjection, state);
    assert.ok(decomp.sources.gcl);
    assert.ok(decomp.sources.loadTest);
    assert.ok(decomp.agreement.totalSources >= 3);
    assert.ok(decomp.composite.trustworthy <= decomp.composite.headlineConfidence);
  });

  it("injects projection_bias uncertainty", () => {
    const state = compressToSystemStateV0(signalsProjection);
    const decomp = decomposeNarrativeConfidenceV0(signalsProjection, state);
    const unc = injectNarrativeUncertaintyV0(signalsProjection, state, decomp);
    assert.ok(unc.tags.some((t) => t.id === UNCERTAINTY_TAG_V0.PROJECTION_BIAS));
  });

  it("flags narrative_metrics_mismatch when story saturates but live idle", () => {
    const state = compressToSystemStateV0(signalsProjection);
    const interp = interpretSystemStateV0(state, signalsProjection);
    const div = monitorNarrativeRawDivergenceV0(signalsProjection, state, interp);
    assert.equal(div.validated, false);
    assert.ok(
      div.flags.some((f) => f.id === DIVERGENCE_FLAG_V0.NARRATIVE_METRICS_MISMATCH)
    );
    assert.equal(div.antiOvertrust.metricsRightStoryWrong, true);
  });

  it("validateNarrativeV0 lowers adjusted confidence under divergence", () => {
    const state = compressToSystemStateV0(signalsProjection);
    const interp = interpretSystemStateV0(state, signalsProjection);
    const v = validateNarrativeV0(signalsProjection, state, interp);
    assert.ok(v.adjustedConfidence <= state.confidence);
    assert.equal(v.trustPosture, "narrative_hypothesis_only");
  });
});
