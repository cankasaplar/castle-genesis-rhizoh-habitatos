import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { analyzeLoadTestReportV0 } from "../ops/loadTestAnalysisEngineV0.js";
import { FAILURE_MODE_ID_V0 } from "../ops/failureModeClassificationV0.js";

describe("loadTestAnalysisEngineV0", () => {
  it("detects soft saturation when success high and queue grows", () => {
    const analysis = analyzeLoadTestReportV0({
      scenarioId: "stress",
      result: {
        metrics: {
          successRate: 0.97,
          avgQueueDepth: 40,
          queueDepthMax: 48,
          capacityViolationsPerMin: 0,
          rolloutCoherenceErrorRate: 0,
          gclRolloutSyncDriftRate: 0,
          durationMin: 2
        }
      },
      postSnapshot: { rollout: { activeTurns: 2, trackedLeases: 2, limit: 200, leaseTtlMs: 120000 } }
    });
    assert.equal(analysis.dominantFailureMode, FAILURE_MODE_ID_V0.SOFT_SATURATION);
  });

  it("detects lifecycle recovery after reconcile", () => {
    const analysis = analyzeLoadTestReportV0({
      scenarioId: "chaos",
      result: { metrics: { successRate: 0.94, avgQueueDepth: 5, queueDepthMax: 10, durationMin: 1 } },
      lifecycleReconcile: { purged: 12, activeTurns: 0 },
      postSnapshot: { rollout: { activeTurns: 0, trackedLeases: 0, limit: 200 } }
    });
    const ids = analysis.slices[0].classification.modes.map((m) => m.id);
    assert.ok(ids.includes(FAILURE_MODE_ID_V0.LIFECYCLE_RECOVERED));
  });
});
