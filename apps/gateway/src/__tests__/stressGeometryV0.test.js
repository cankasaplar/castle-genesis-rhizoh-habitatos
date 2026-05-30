import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  encodeEntropyVectorV0,
  entropyMagnitudeV0,
  buildExecutionDriftHeatmapV0,
  computeBehavioralConsistencyScoreV0,
  runStressGeometryPhase3V0,
  fingerprintTruthLayerV0,
  fingerprintExecutionLayerV0,
  ENTROPY_AXIS_V0
} from "../ops/stressGeometryV0.js";
import { classifyStressResponseV0 } from "../ops/stressResponseTaxonomyV0.js";
import { verifyConfidenceBoundaryHysteresisV0 } from "../ops/resolutionStabilityEnvelopeV0.js";

describe("stressGeometryV0", () => {
  it("entropy vector has five axes in [0,1]", () => {
    const ev = encodeEntropyVectorV0({ codes: ["prompt_abuse_detected", "cost_hard_limit"] });
    assert.equal(ev.vector.length, 5);
    assert.ok(ev.vector.every((v) => v >= 0 && v <= 1));
    assert.ok(ev.components[ENTROPY_AXIS_V0.ADVERSARIAL_MIX] >= 0);
    assert.ok(ev.magnitude > 0);
  });

  it("execution drift heatmap zero when truth-execution mapping is functional", () => {
    const t1 = classifyStressResponseV0({ code: "cost_hard_limit" });
    const t2 = classifyStressResponseV0({ code: "prompt_abuse_detected" });
    const probes = [
      {
        truthKey: fingerprintTruthLayerV0(t1),
        executionKey: fingerprintExecutionLayerV0(t1)
      },
      {
        truthKey: fingerprintTruthLayerV0(t2),
        executionKey: fingerprintExecutionLayerV0(t2)
      }
    ].map((p, i) => ({ ...p, id: `x${i}`, stable: true, canonical: `c${i}`, entropy: { magnitude: 0 } }));
    const hm = buildExecutionDriftHeatmapV0(probes);
    assert.equal(hm.meanExecutionDrift, 0);
  });

  it("BCS gate passes on full phase3 lattice run", () => {
    const report = runStressGeometryPhase3V0();
    assert.ok(report.behavioralConsistencyScore.bcs >= 0.85);
    assert.equal(report.executionDriftHeatmap.perception.meanExecutionDrift, 0);
    assert.equal(report.phase3Gate, "execution_consistent_under_entropy");
    assert.equal(report.phase3Kind, "controlled_mismatch_measurement_layer");
    assert.equal(report.phase3Outcome, "divergence_instrumentation_under_constrained_execution");
    assert.equal(report.systemIdentity, "bounded_observability_and_execution_system");
    assert.equal(report.phase3Artifact, "modeled_observed_divergence_mapped");
    assert.equal(report.interpretationLayer.notEngineeringSsot, true);
    assert.ok(report.modeledObservedDivergence);
    assert.ok(report.modelCompletenessScore.mcs >= 0.75);
    assert.equal(report.realityResidualSignals.schema, "rhizoh.reality_residual.signal.v0");
    assert.ok(verifyConfidenceBoundaryHysteresisV0().pass);
  });
});
