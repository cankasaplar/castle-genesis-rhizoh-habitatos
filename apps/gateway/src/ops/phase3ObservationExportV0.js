/**
 * Phase 3 observation export — operability + dynamics + Phase 3D (NO execution authority).
 * @see docs/ops/PHASE3_CONTROL_OBSERVATION_FIREWALL_V1.0.md
 */
import {
  computeUsefulnessProxyV0,
  computeContainmentExecutionRatioV0,
  computeUnderSensitivityRiskV0,
  computeOperabilityBalanceMetricsV0,
  suggestPhase31FeedbackLoopPlanV0,
  buildOperabilityPhaseSpaceMapV0,
  computeOperabilityPhaseCoordinatesV0,
  classifyOperabilityPhaseRegionV0,
  OPERATIONAL_BASELINE_IDS_V0
} from "./phase3OperabilityBalanceV0.js";
import { computeOverGatingMetricsV0 } from "./phase3ControlledDivergenceRuntimeV0.js";
import { buildPhase3DAttractorIntelligenceV0 } from "./phase3DAttractorIntelligenceV0.js";
import { FIREWALL_MANIFEST_V0 } from "./phase3ControlObservationFirewallV0.js";
import { attachShadowLearningContractV0 } from "./phase3DShadowLearningBoundaryV0.js";
import { buildProposalQueueV0, validateProposalQueueV0 } from "./phase3DProposalQueueV0.js";
import { attachAuthorityPerceptionContractV0 } from "./authorityPerceptionFailureModesV0.js";

export const PHASE3_OBSERVATION_EXPORT_SCHEMA_V0 = "rhizoh.phase3.observation_export.v0";

/**
 * @param {{
 *   atMs: string,
 *   outcomeRecords: import("./phase3OperabilityBalanceV0.js").CycleOutcomeRecord[],
 *   scenarioResults: { id: string, mode?: string, divergence?: number, expectedToGate?: boolean }[],
 *   overGatingOperational: ReturnType<import("./phase3ControlledDivergenceRuntimeV0.js").computeOverGatingMetricsV0>,
 *   overGatingDrill: ReturnType<import("./phase3ControlledDivergenceRuntimeV0.js").computeOverGatingMetricsV0>,
 * }} input
 */
export function buildPhase3ObservationExportV0(input) {
  const { atMs, outcomeRecords, scenarioResults, overGatingOperational, overGatingDrill } =
    input;

  const rollingOperationalTrajectory = buildRollingOperationalPhaseTrajectoryV0(
    outcomeRecords,
    atMs
  );

  const usefulness = computeUsefulnessProxyV0(outcomeRecords);
  const underSensitivity = computeUnderSensitivityRiskV0(outcomeRecords);
  const cer = computeContainmentExecutionRatioV0(overGatingOperational.rates);
  const operabilityBalance = computeOperabilityBalanceMetricsV0({
    overGating: overGatingOperational,
    usefulness,
    underSensitivity,
    containmentExecutionRatio: cer
  });
  const phase31Plan = suggestPhase31FeedbackLoopPlanV0(operabilityBalance);
  const operabilityPhaseSpaceMap = buildOperabilityPhaseSpaceMapV0({
    aggregate: {
      overGating: overGatingOperational,
      usefulness,
      underSensitivity,
      operabilityBalance
    },
    scenarioRecords: outcomeRecords
  });

  const phase3DAttractorIntelligence = buildPhase3DAttractorIntelligenceV0({
    trajectory: operabilityPhaseSpaceMap.trajectory,
    rollingTrajectory: rollingOperationalTrajectory,
    phaseSpaceMap: operabilityPhaseSpaceMap,
    scenarioContext: scenarioResults
  });

  const proposalQueue = buildProposalQueueV0({
    atMs,
    exportRef: `observation@${atMs}`,
    operabilityBalance,
    phase31Plan,
    phase3D: phase3DAttractorIntelligence
  });
  const proposalQueueValidation = validateProposalQueueV0(proposalQueue);

  const base = {
    schema: PHASE3_OBSERVATION_EXPORT_SCHEMA_V0,
    role: "observation_only",
    feedsExecution: false,
    firewall: FIREWALL_MANIFEST_V0,
    atMs,
    usefulnessProxy: usefulness,
    underSensitivityRisk: underSensitivity,
    containmentExecutionRatio: cer,
    operabilityBalance,
    operabilityPhaseSpaceMap,
    operabilityPhaseTrajectories: Object.freeze({
      executionOrder: operabilityPhaseSpaceMap.trajectory,
      rollingOperational: rollingOperationalTrajectory
    }),
    behaviorDynamics: Object.freeze({
      primary: operabilityPhaseSpaceMap.trajectory.dynamics.classification,
      rollingOperational: rollingOperationalTrajectory.dynamics?.classification,
      analysisKind: "system_behavior_dynamics"
    }),
    phase3DAttractorIntelligence,
    phase31FeedbackLoopPlan: phase31Plan,
    phase3dObservationGate: phase3DAttractorIntelligence.phase3dGate,
    proposalQueue,
    proposalQueueValidation,
    note: "phase3d_observation_gate_does_not_affect_phase3_execution_gate"
  };

  return Object.freeze(
    attachAuthorityPerceptionContractV0(attachShadowLearningContractV0(base))
  );
}

function buildRollingOperationalPhaseTrajectoryV0(outcomeRecords, harnessAtMs) {
  const timeline = [];

  for (let i = 0; i < outcomeRecords.length; i++) {
    const prefix = outcomeRecords.slice(0, i + 1);
    const opRecords = prefix.filter((r) => OPERATIONAL_BASELINE_IDS_V0.includes(r.id || ""));
    if (!opRecords.length) continue;

    const opCycles = opRecords.map((r) => ({
      mode: r.mode,
      executionAllowed: r.executionAllowed
    }));
    const overGating = computeOverGatingMetricsV0(opCycles);
    const usefulness = computeUsefulnessProxyV0(prefix);
    const underSensitivity = computeUnderSensitivityRiskV0(prefix);

    timeline.push({
      t: timeline.length,
      atMs: harnessAtMs,
      scenarioId: outcomeRecords[i].id,
      record: {
        usefulnessScore: usefulness.usefulnessScore,
        inertnessScore: overGating.inertnessScore,
        missedGatingRate: underSensitivity.missedGatingRate,
        overGating: overGating.overGating,
        underSensitive: underSensitivity.underSensitive,
        id: `rolling@${outcomeRecords[i].id}`
      }
    });
  }

  const samples = [];
  for (let idx = 0; idx < timeline.length; idx++) {
    const item = timeline[idx];
    const coords = computeOperabilityPhaseCoordinatesV0(item.record);
    const region = classifyOperabilityPhaseRegionV0(coords);
    const prev = samples[idx - 1];
    const displacement = prev
      ? Number(
          Math.sqrt(coords.vector.reduce((s, v, j) => s + (v - prev.coords[j]) ** 2, 0)).toFixed(4)
        )
      : 0;
    samples.push(
      Object.freeze({
        t: item.t,
        scenarioId: item.scenarioId,
        coords: coords.vector,
        region: region.region,
        labelTr: region.labelTr,
        distanceToOptimal: region.distanceToOptimal,
        displacement,
        regionChanged: prev ? prev.region !== region.region : false
      })
    );
  }

  const pathLength = Number(samples.slice(1).reduce((s, p) => s + p.displacement, 0).toFixed(4));
  const transitions = [];
  for (let i = 1; i < samples.length; i++) {
    if (samples[i].regionChanged) {
      transitions.push(
        Object.freeze({
          at: i,
          from: samples[i - 1].region,
          to: samples[i].region,
          scenarioId: samples[i].scenarioId
        })
      );
    }
  }

  const classification =
    samples.length < 2
      ? "insufficient_window"
      : samples.at(-1).region === "optimal" && pathLength < 0.5
        ? "operational_converged"
        : "operational_evolution";

  return Object.freeze({
    schema: "rhizoh.phase3.operability_phase_trajectory.v0",
    analysisKind: "system_behavior_dynamics",
    seriesId: "phase3_rolling_operational_window",
    clock: "rolling_prefix",
    sampleCount: samples.length,
    samples: Object.freeze(samples),
    dynamics: Object.freeze({
      schema: "rhizoh.phase3.trajectory_dynamics.v0",
      pathLength,
      regionTransitionCount: transitions.length,
      transitions: Object.freeze(transitions),
      classification,
      summary: "operational_metrics_trajectory_not_per_cycle_instant"
    })
  });
}
