import { describe, expect, it, beforeEach } from "vitest";
import {
  evaluateGoLearningAgreementGateV0,
  resetGoLearningAgreementGateForTestV0,
  getGoLearningAgreementGateSnapshotV0
} from "../goLearningAgreementGateV0.js";
import {
  enqueueGoLearningBatchSampleV0,
  flushGoLearningBatchV0,
  resetGoLearningBatchForTestV0,
  getGoLearningBatchSnapshotV0
} from "../goLearningBatchV0.js";

describe("goLearningAgreementGateV0", () => {
  beforeEach(() => {
    resetGoLearningAgreementGateForTestV0();
  });

  it("accepts high-confidence eval", () => {
    const gate = evaluateGoLearningAgreementGateV0({ confidence: 0.8, sourceCount: 1 });
    expect(gate.learningEligible).toBe(true);
    expect(getGoLearningAgreementGateSnapshotV0().accepted).toBe(1);
  });

  it("rejects low-confidence eval", () => {
    const gate = evaluateGoLearningAgreementGateV0({ confidence: 0.2, sourceCount: 1 });
    expect(gate.learningEligible).toBe(false);
  });
});

describe("goLearningBatchV0", () => {
  beforeEach(() => {
    resetGoLearningBatchForTestV0();
    resetGoLearningAgreementGateForTestV0();
  });

  it("attaches spacetime envelope on enqueue", () => {
    const gate = evaluateGoLearningAgreementGateV0({ confidence: 0.9, sourceCount: 1 });
    const result = enqueueGoLearningBatchSampleV0({ boardHash: "go19:empty", gate });
    expect(result.enqueued).toBe(true);
    expect(getGoLearningBatchSnapshotV0().pending).toBe(1);
  });

  it("flushes batch with spacetime anchors", () => {
    const gate = evaluateGoLearningAgreementGateV0({ confidence: 0.9, sourceCount: 1 });
    enqueueGoLearningBatchSampleV0({ boardHash: "go19:a", gate });
    const flush = flushGoLearningBatchV0("test");
    expect(flush.flushed).toBe(true);
    expect(flush.sampleCount).toBe(1);
    expect(flush.detail.spacetimeAnchors).toContain("go_arena");
  });
});
