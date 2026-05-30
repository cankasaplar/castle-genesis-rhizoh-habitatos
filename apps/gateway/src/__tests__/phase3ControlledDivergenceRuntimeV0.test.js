import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  runPhase3ControlLoopCycleV0,
  runPhase3ExecutionControlHarnessV0,
  resetPhase3RuntimeForTestV0,
  evaluateDivergenceGateV0,
  evaluateExecutionSafetyGateV0,
  computeDivergenceVectorV0,
  computeOverGatingMetricsV0,
  observePhase3V0,
  modelProjectionPhase3V0,
  PHASE3_MODE_V0,
  DIVERGENCE_BAND_V0
} from "../ops/phase3ControlledDivergenceRuntimeV0.js";
import {
  validateModeledProjectionDimensionsV0,
  REQUIRED_MODELED_DIMENSIONS_V0
} from "../ops/phase3ProjectionSchemaV0.js";
import {
  computeUsefulnessProxyV0,
  computeUnderSensitivityRiskV0,
  computeOperabilityBalanceMetricsV0,
  computeContainmentExecutionRatioV0,
  buildOperabilityPhaseSpaceMapV0,
  buildOperabilityPhaseTrajectoryV0,
  classifyOperabilityPhaseRegionV0,
  computeOperabilityPhaseCoordinatesV0,
  OPERABILITY_PHASE_REGION_V0,
  TRAJECTORY_DYNAMICS_CLASS_V0
} from "../ops/phase3OperabilityBalanceV0.js";

describe("phase3ControlledDivergenceRuntimeV0", () => {
  beforeEach(() => resetPhase3RuntimeForTestV0());

  it("core loop is non-reentrant", () => {
    resetPhase3RuntimeForTestV0();
    const input = { code: "phased_rollout_capacity" };
    const a = runPhase3ControlLoopCycleV0(input, { cycleSeq: 0 });
    assert.equal(a.ok, true);
  });

  it("G2 divergence bands map to modes", () => {
    assert.equal(evaluateDivergenceGateV0({ scalar: 0.1, band: DIVERGENCE_BAND_V0.LOW }).mode, PHASE3_MODE_V0.NORMAL);
    assert.equal(evaluateDivergenceGateV0({ scalar: 0.5, band: DIVERGENCE_BAND_V0.MID }).mode, PHASE3_MODE_V0.THROTTLED);
    assert.equal(evaluateDivergenceGateV0({ scalar: 0.75, band: DIVERGENCE_BAND_V0.HIGH }).mode, PHASE3_MODE_V0.CONTAINED);
    assert.equal(evaluateDivergenceGateV0({ scalar: 0.95, band: DIVERGENCE_BAND_V0.CRITICAL }).mode, PHASE3_MODE_V0.ROLLBACK);
  });

  it("F1 telemetry missing → contained or freeze path", () => {
    const c = runPhase3ControlLoopCycleV0({
      telemetryMissing: true,
      timestampMs: Date.now() - 999999
    });
    assert.equal(c.ok, true);
    assert.ok([PHASE3_MODE_V0.CONTAINED, PHASE3_MODE_V0.FREEZE].includes(c.state.mode));
  });

  it("control harness passes all scenarios without observation inputs", () => {
    const h = runPhase3ExecutionControlHarnessV0();
    assert.equal(h.phase3ExecutionGate, "phase3_runtime_spec_pass");
    assert.equal(h.role, "control_only");
    assert.ok(h.walChainLength >= 1);
    const normal = h.scenarios.find((s) => s.id === "NORMAL_baseline");
    assert.equal(normal.mode, PHASE3_MODE_V0.NORMAL);
    assert.equal(h.underSensitivityRisk.underSensitive, false);
    assert.ok(!("phase3DAttractorIntelligence" in h));
    assert.ok(!("operabilityBalance" in h));
  });

  it("phase space map classifies blind vs locked from derived coords", () => {
    const blind = computeOperabilityPhaseCoordinatesV0({
      usefulnessScore: 0.8,
      inertnessScore: 0.1,
      missedGatingRate: 0.6,
      underSensitive: true
    });
    assert.equal(classifyOperabilityPhaseRegionV0(blind).region, OPERABILITY_PHASE_REGION_V0.BLIND);
    const locked = computeOperabilityPhaseCoordinatesV0({
      usefulnessScore: 0.3,
      inertnessScore: 0.7,
      missedGatingRate: 0,
      overGating: true
    });
    assert.equal(classifyOperabilityPhaseRegionV0(locked).region, OPERABILITY_PHASE_REGION_V0.LOCKED);
    const map = buildOperabilityPhaseSpaceMapV0({
      aggregate: {
        overGating: { inertnessScore: 0.2, overGating: false },
        usefulness: { usefulnessScore: 0.7 },
        underSensitivity: { missedGatingRate: 0, underSensitive: false },
        operabilityBalance: { balance: "balanced" }
      },
      scenarioRecords: [{ id: "t", cycleOk: true, mode: "NORMAL", executionAllowed: true, sideEffects: true, projectionSchemaPass: true }]
    });
    assert.equal(map.space.noNewPrimitives, true);
    assert.ok(map.lattice.cellCount >= 1);
  });

  it("phase trajectory captures region transitions and dynamics class", () => {
    const traj = buildOperabilityPhaseTrajectoryV0({
      seriesId: "test",
      timeline: [
        {
          t: 0,
          record: {
            id: "a",
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
            id: "b",
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
            id: "c",
            cycleOk: true,
            mode: "NORMAL",
            executionAllowed: true,
            sideEffects: true,
            projectionSchemaPass: true
          }
        }
      ]
    });
    assert.equal(traj.notDebuggingSnapshot, true);
    assert.ok(traj.dynamics.pathLength > 0);
    assert.ok(traj.dynamics.regionTransitionCount >= 1);
    assert.ok(
      [
        TRAJECTORY_DYNAMICS_CLASS_V0.LOCK_RECOVERY,
        TRAJECTORY_DYNAMICS_CLASS_V0.STRESS_DEFLECTION,
        TRAJECTORY_DYNAMICS_CLASS_V0.STABLE_ATTRACTOR,
        TRAJECTORY_DYNAMICS_CLASS_V0.OSCILLATORY,
        TRAJECTORY_DYNAMICS_CLASS_V0.MIXED
      ].includes(traj.dynamics.classification)
    );
  });

  it("usefulness proxy and under-sensitivity are distinct from over-gating", () => {
    const usefulness = computeUsefulnessProxyV0([
      { cycleOk: true, sideEffects: true, projectionSchemaPass: true },
      { cycleOk: true, sideEffects: true, projectionSchemaPass: true }
    ]);
    assert.ok(usefulness.usefulnessScore > 0.5);
    const under = computeUnderSensitivityRiskV0([
      { id: "F5_execution_leakage", expectedToGate: true, executionAllowed: true }
    ]);
    assert.equal(under.underSensitive, true);
    const cer = computeContainmentExecutionRatioV0({
      containment: 0.1,
      executionAllowed: 0.9
    });
    assert.equal(cer.interpretation, "execution_heavy_low_lock");
  });

  it("G4 rejects unknown key dimension (schema boundary)", () => {
    const bad = validateModeledProjectionDimensionsV0({
      stressClass: "overload",
      responseAction: "degrade",
      stressConfidence: 0.9,
      actionConfidence: 0.9,
      mysteryDimension: 1
    });
    assert.equal(bad.pass, false);
    assert.ok(bad.unknown.includes("mysteryDimension"));
  });

  it("G4 passes with required dimensions only", () => {
    const modeled = modelProjectionPhase3V0({ code: "phased_rollout_capacity" });
    const g4 = evaluateExecutionSafetyGateV0({
      observed: observePhase3V0({ code: "phased_rollout_capacity" }),
      modeled,
      divergence: { scalar: 0.1, band: "LOW", components: {} },
      stability: 1,
      entropy: 0.5,
      mode: PHASE3_MODE_V0.NORMAL,
      cycleSeq: 0
    });
    assert.equal(g4.pass, true);
    assert.equal(modeled.dimensionSchema, "rhizoh.phase3.modeled_projection.v0.1");
    assert.equal(REQUIRED_MODELED_DIMENSIONS_V0.length, 4);
  });

  it("over-gating metrics flag inertness on operational cycles", () => {
    const m = computeOverGatingMetricsV0([
      { mode: PHASE3_MODE_V0.NORMAL, executionAllowed: true },
      { mode: PHASE3_MODE_V0.NORMAL, executionAllowed: true }
    ]);
    assert.equal(m.overGating, false);
    const bad = computeOverGatingMetricsV0([
      { mode: PHASE3_MODE_V0.CONTAINED, executionAllowed: false },
      { mode: PHASE3_MODE_V0.CONTAINED, executionAllowed: false },
      { mode: PHASE3_MODE_V0.ROLLBACK, executionAllowed: false }
    ]);
    assert.equal(bad.overGating, true);
  });

  it("divergence compute is bounded 0-1", () => {
    const obs = observePhase3V0({ code: "cost_hard_limit" });
    const mod = modelProjectionPhase3V0({ code: "phased_rollout_capacity" });
    const d = computeDivergenceVectorV0(obs, mod);
    assert.ok(d.scalar >= 0 && d.scalar <= 1);
  });
});
