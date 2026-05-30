import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildOperabilityPhaseTrajectoryV0 } from "../ops/phase3OperabilityBalanceV0.js";
import {
  buildPhase3DAttractorIntelligenceV0,
  ATTRACTOR_CATALOG_V0,
  PHASE3D_KIND_V0
} from "../ops/phase3DAttractorIntelligenceV0.js";
import { runPhase3ExecutionSpecHarnessV0 } from "../ops/phase3HarnessExportV0.js";

describe("phase3DAttractorIntelligenceV0", () => {
  it("detects attractors and stressor exits from synthetic trajectory", () => {
    const trajectory = buildOperabilityPhaseTrajectoryV0({
      seriesId: "test",
      timeline: [
        {
          t: 0,
          record: {
            id: "NORMAL_baseline",
            cycleOk: true,
            mode: "NORMAL",
            executionAllowed: true,
            sideEffects: true,
            projectionSchemaPass: true
          }
        },
        {
          t: 1,
          record: {
            id: "F3_divergence_explosion",
            cycleOk: true,
            mode: "FREEZE",
            executionAllowed: false,
            sideEffects: false,
            projectionSchemaPass: true,
            expectedToGate: true
          }
        },
        {
          t: 2,
          record: {
            id: "NORMAL_baseline",
            cycleOk: true,
            mode: "NORMAL",
            executionAllowed: true,
            sideEffects: true,
            projectionSchemaPass: true
          }
        }
      ]
    });

    const intel = buildPhase3DAttractorIntelligenceV0({
      trajectory,
      scenarioContext: [
        { id: "NORMAL_baseline", mode: "NORMAL", divergence: 0.02 },
        { id: "F3_divergence_explosion", mode: "FREEZE", divergence: 0.08, expectedToGate: true }
      ]
    });

    assert.equal(intel.kind, PHASE3D_KIND_V0);
    assert.ok(intel.attractors.length >= 2);
    assert.ok(intel.stressorExitAnalysis.exitCount >= 1);
    assert.equal(intel.stressorExitAnalysis.primaryEjector, "F3_divergence_explosion");
    assert.ok(ATTRACTOR_CATALOG_V0.optimal);
    assert.ok(intel.primaryAttractor.attractorId);
  });

  it("harness export includes phase3d observation gate ready", () => {
    const h = runPhase3ExecutionSpecHarnessV0();
    assert.equal(h.phase3dObservationGate, "phase3d_attractor_layer_ready");
    const intel = h.phase3Observation.phase3DAttractorIntelligence;
    assert.ok(intel.primaryAttractor);
    assert.ok(intel.stabilityAnalysis.whySystemStays.length >= 1);
    const ejectors = intel.stressorExitAnalysis.stressorImpactRank;
    assert.ok(ejectors.length >= 1);
  });

  it("perturbation sensitivity map has influence, fragility, and transition field", () => {
    const h = runPhase3ExecutionSpecHarnessV0();
    const ps = h.phase3Observation.phase3DAttractorIntelligence.perturbationSensitivityMap;
    assert.equal(ps.schema, "rhizoh.phase3d.perturbation_sensitivity_map.v0");
    assert.ok(ps.inputAttractorInfluence.matrix.length >= 1);
    assert.ok(ps.basinBoundaryFragility.length >= 1);
    assert.ok(ps.transitionProbabilityField.marginalTransitions.length >= 1);
    assert.ok(ps.summary.dominantPerturbation);
    const f3 = ps.inputAttractorInfluence.byInput.find((x) => x.inputId.includes("F3"));
    assert.ok(f3?.primaryTarget === "kilitli" || f3?.primaryTarget === "optimal");
  });
});
