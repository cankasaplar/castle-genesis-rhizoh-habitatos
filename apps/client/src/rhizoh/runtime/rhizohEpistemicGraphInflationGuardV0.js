/**
 * Epistemic graph inflation guard v2 — soft cap, dampening, council load balancing.
 * RESEARCH-ONLY
 */

import { getEpistemicMemoryGraphComplianceSummaryV0 } from "./rhizohEpistemicMemoryGraphV0.js";

export const EPISTEMIC_GRAPH_INFLATION_GUARD_SCHEMA_V2 =
  "castle.rhizoh.epistemic_graph_inflation_risk.v2";

const NODE_HARD_CAP_V0 = 1024;
const EDGE_HARD_CAP_V0 = 2048;
const NODE_SOFT_CAP_V2 = 256;
const EDGE_SOFT_CAP_V2 = 512;

const COUNCIL_COOLDOWN_LOW_MS_V2 = 60_000;
const COUNCIL_COOLDOWN_MEDIUM_MS_V2 = 120_000;
const COUNCIL_COOLDOWN_HIGH_MS_V2 = 300_000;

const COUNCIL_TRIGGERS_SOFT_CAP_V2 = 8;
const STRESS_RUNS_SOFT_CAP_V2 = 4;

/** @type {{ councilTriggers: number, stressRuns: number, windowStartMs: number }} */
const densityWindowV0 = {
  councilTriggers: 0,
  stressRuns: 0,
  windowStartMs: Date.now()
};

const DENSITY_WINDOW_MS_V0 = 60_000;

function rollDensityWindowV0() {
  const now = Date.now();
  if (now - densityWindowV0.windowStartMs > DENSITY_WINDOW_MS_V0) {
    densityWindowV0.councilTriggers = 0;
    densityWindowV0.stressRuns = 0;
    densityWindowV0.windowStartMs = now;
  }
}

export function recordCouncilTriggerForInflationGuardV0() {
  rollDensityWindowV0();
  densityWindowV0.councilTriggers += 1;
}

export function recordStressRunForInflationGuardV0() {
  rollDensityWindowV0();
  densityWindowV0.stressRuns += 1;
}

/**
 * @param {string} level
 */
export function resolveCouncilCooldownMsV2(level = "low") {
  if (level === "high") return COUNCIL_COOLDOWN_HIGH_MS_V2;
  if (level === "medium") return COUNCIL_COOLDOWN_MEDIUM_MS_V2;
  return COUNCIL_COOLDOWN_LOW_MS_V2;
}

/**
 * @param {number} rawScore
 * @param {{ level?: string, score?: number }} inflation
 */
export function dampenAnomalyScoreV2(rawScore, inflation = {}) {
  const raw = Number(rawScore) || 0;
  const level = inflation.level || "low";
  if (level === "low") return Number(raw.toFixed(4));
  const factor = 1 - (Number(inflation.score) || 0) * 0.35;
  return Number(Math.max(0, Math.min(1, raw * factor)).toFixed(4));
}

/**
 * @returns {object}
 */
export function assessEpistemicGraphInflationRiskV0() {
  rollDensityWindowV0();
  const graph = getEpistemicMemoryGraphComplianceSummaryV0();
  const nodeRatio = graph.nodeCount / NODE_HARD_CAP_V0;
  const edgeRatio = graph.edgeCount / EDGE_HARD_CAP_V0;
  const councilRate = densityWindowV0.councilTriggers / COUNCIL_TRIGGERS_SOFT_CAP_V2;
  const stressRate = densityWindowV0.stressRuns / STRESS_RUNS_SOFT_CAP_V2;
  const score = Number(
    Math.min(1, nodeRatio * 0.35 + edgeRatio * 0.25 + councilRate * 0.25 + stressRate * 0.15).toFixed(
      4
    )
  );

  const level = score >= 0.65 ? "high" : score >= 0.35 ? "medium" : "low";
  const softCapBreached =
    graph.nodeCount >= NODE_SOFT_CAP_V2 ||
    graph.edgeCount >= EDGE_SOFT_CAP_V2 ||
    densityWindowV0.councilTriggers >= COUNCIL_TRIGGERS_SOFT_CAP_V2 ||
    densityWindowV0.stressRuns >= STRESS_RUNS_SOFT_CAP_V2;

  const recommendedCooldownMs = resolveCouncilCooldownMsV2(level);
  const shouldRunLifecyclePass = softCapBreached || level !== "low";

  return Object.freeze({
    schema: EPISTEMIC_GRAPH_INFLATION_GUARD_SCHEMA_V2,
    version: 2,
    level,
    score,
    nodeCount: graph.nodeCount,
    edgeCount: graph.edgeCount,
    nodeSoftCap: NODE_SOFT_CAP_V2,
    edgeSoftCap: EDGE_SOFT_CAP_V2,
    softCapBreached,
    shouldRunLifecyclePass,
    recommendedCooldownMs,
    councilTriggersPerMinute: densityWindowV0.councilTriggers,
    stressRunsPerMinute: densityWindowV0.stressRuns,
    councilLoadBalance: Object.freeze({
      cooldownMs: recommendedCooldownMs,
      triggersSoftCap: COUNCIL_TRIGGERS_SOFT_CAP_V2,
      throttled: densityWindowV0.councilTriggers >= COUNCIL_TRIGGERS_SOFT_CAP_V2
    }),
    advisory:
      level === "high"
        ? "Graph inflation elevated — lifecycle pass, extended council cooldown, anomaly dampening active."
        : level === "medium"
          ? "Soft cap watch — run lifecycle pass; monitor council density."
          : "Within safe observation density."
  });
}

/**
 * @param {number} rawScore
 */
export function assessDampenedAnomalyScoreV2(rawScore) {
  const inflation = assessEpistemicGraphInflationRiskV0();
  return Object.freeze({
    raw: Number(rawScore) || 0,
    dampened: dampenAnomalyScoreV2(rawScore, inflation),
    dampeningActive: inflation.level !== "low",
    inflationLevel: inflation.level
  });
}

/** @internal vitest */
export function __resetEpistemicGraphInflationGuardForTestV0() {
  densityWindowV0.councilTriggers = 0;
  densityWindowV0.stressRuns = 0;
  densityWindowV0.windowStartMs = Date.now();
}
