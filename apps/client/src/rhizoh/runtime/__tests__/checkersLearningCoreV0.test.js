import { describe, expect, it, beforeEach } from "vitest";
import {
  evaluateCheckersLearningAgreementGateV0,
  resetCheckersLearningAgreementGateForTestV0
} from "../checkersLearningAgreementGateV0.js";
import {
  enqueueCheckersLearningBatchSampleV0,
  flushCheckersLearningBatchV0,
  resetCheckersLearningBatchForTestV0
} from "../checkersLearningBatchV0.js";
import { applyCheckersArenaMoveV0, resetCheckersArenaEngineForTestV0 } from "../checkersArenaEngineV0.js";
import { ingestCheckersLearningDemoMoveV0 } from "../checkersLearningDemoIngestV0.js";

describe("checkersLearningCoreV0", () => {
  beforeEach(() => {
    resetCheckersLearningAgreementGateForTestV0();
    resetCheckersLearningBatchForTestV0();
    resetCheckersArenaEngineForTestV0();
  });

  it("accepts high-confidence eval", () => {
    const gate = evaluateCheckersLearningAgreementGateV0({ confidence: 0.8, sourceCount: 1 });
    expect(gate.learningEligible).toBe(true);
  });

  it("flushes batch with spacetime anchors", () => {
    const gate = evaluateCheckersLearningAgreementGateV0({ confidence: 0.9, sourceCount: 1 });
    enqueueCheckersLearningBatchSampleV0({ boardHash: "chk8:empty", gate });
    const flush = flushCheckersLearningBatchV0("test");
    expect(flush.flushed).toBe(true);
    expect(flush.detail.spacetimeAnchors).toContain("checkers_arena");
  });

  it("ingests demo move on 8x8 board", () => {
    const result = ingestCheckersLearningDemoMoveV0({ x: 2, y: 2, confidence: 0.85 });
    expect(result.ok).toBe(true);
    expect(result.spacetime.causalSpaceId).toBe("checkers.causal.space");
    expect(applyCheckersArenaMoveV0({ x: 0, y: 0 }).ok).toBe(true);
  });
});
