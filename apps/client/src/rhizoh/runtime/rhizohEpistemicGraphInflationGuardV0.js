/**
 * Epistemic graph inflation risk assessor v0 — watch graph/council/stress density.
 * RESEARCH-ONLY
 */

import { getEpistemicMemoryGraphComplianceSummaryV0 } from "./rhizohEpistemicMemoryGraphV0.js";

const NODE_CAP_V0 = 1024;
const EDGE_CAP_V0 = 2048;

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
 * @returns {object}
 */
export function assessEpistemicGraphInflationRiskV0() {
  rollDensityWindowV0();
  const graph = getEpistemicMemoryGraphComplianceSummaryV0();
  const nodeRatio = graph.nodeCount / NODE_CAP_V0;
  const edgeRatio = graph.edgeCount / EDGE_CAP_V0;
  const councilRate = densityWindowV0.councilTriggers / 8;
  const stressRate = densityWindowV0.stressRuns / 4;
  const score = Number(
    Math.min(1, nodeRatio * 0.35 + edgeRatio * 0.25 + councilRate * 0.25 + stressRate * 0.15).toFixed(
      4
    )
  );

  const level = score >= 0.65 ? "high" : score >= 0.35 ? "medium" : "low";

  return Object.freeze({
    schema: "castle.rhizoh.epistemic_graph_inflation_risk.v0",
    level,
    score,
    nodeCount: graph.nodeCount,
    edgeCount: graph.edgeCount,
    councilTriggersPerMinute: densityWindowV0.councilTriggers,
    stressRunsPerMinute: densityWindowV0.stressRuns,
    advisory:
      level === "high"
        ? "Graph inflation risk elevated — throttle council/stress repetition."
        : level === "medium"
          ? "Monitor graph growth and council trigger density."
          : "Within safe observation density."
  });
}

/** @internal vitest */
export function __resetEpistemicGraphInflationGuardForTestV0() {
  densityWindowV0.councilTriggers = 0;
  densityWindowV0.stressRuns = 0;
  densityWindowV0.windowStartMs = Date.now();
}
