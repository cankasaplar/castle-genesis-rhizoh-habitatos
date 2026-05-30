import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  extractSimRealDivergenceV0,
  resolveExecutionModeFromReportV0
} from "../ops/simRealDivergenceSignaturesV0.js";
import { analyzeLoadTestReportV0 } from "../ops/loadTestAnalysisEngineV0.js";
import { FAILURE_MODE_ID_V0 } from "../ops/failureModeClassificationV0.js";

describe("simRealDivergenceSignaturesV0", () => {
  it("detects coordination_sim from rollout snapshot", () => {
    const mode = resolveExecutionModeFromReportV0({
      phases: {
        stress: {
          postSnapshot: {
            rollout: { ledgerMode: "coordination_sim", coordinationSim: true }
          }
        }
      }
    });
    assert.equal(mode, "coordination_sim");
  });

  it("extracts divergence signatures with validation layer deferred", () => {
    const report = {
      phases: {
        spike: {
          postSnapshot: { rollout: { coordinationSim: true, activeTurns: 2, limit: 200 } },
          result: {
            metrics: {
              successRate: 0.94,
              avgQueueDepth: 40,
              queueDepthMax: 48,
              rolloutCoherenceErrorRate: 0,
              gclRolloutSyncDriftRate: 0
            }
          }
        }
      }
    };
    const analysis = analyzeLoadTestReportV0(report);
    const div = extractSimRealDivergenceV0(report, analysis);
    assert.equal(div.executionMode, "coordination_sim");
    assert.equal(div.validationLayer.status, "deferred");
    assert.ok(div.signatures.some((s) => s.id === "redis_coordination_lag"));
  });
});

describe("loadTestAnalysisEngine v1 intelligence", () => {
  it("caps redis lag confidence in sim mode", () => {
    const analysis = analyzeLoadTestReportV0({
      phases: {
        chaos: {
          postSnapshot: { rollout: { coordinationSim: true, ledgerMode: "coordination_sim" } },
          chaos: { redisLatencyMs: 200 },
          result: {
            metrics: {
              successRate: 0.95,
              avgQueueDepth: 5,
              queueDepthMax: 10,
              rolloutCoherenceErrorRate: 0.9,
              durationMin: 2
            }
          }
        }
      }
    });
    assert.equal(analysis.executionMode, "coordination_sim");
    const lag = analysis.slices[0].classification.modes.find(
      (m) => m.id === FAILURE_MODE_ID_V0.REDIS_COORDINATION_LAG
    );
    assert.ok(lag);
    assert.ok(lag.confidence <= 0.3);
    assert.ok(analysis.systemHealthIntelligence);
  });
});
