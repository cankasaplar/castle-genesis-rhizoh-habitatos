#!/usr/bin/env node
/**
 * CI gate — social propagation tabletop paths must not all be high residual.
 */
import { buildUnifiedStateNarrativeV0 } from "./unifiedStateNarrativeV0.js";
import { runSocialPropagationSimulationV0 } from "./socialPropagationSimulationV0.js";

const maxHighResidual = Number(process.env.CASTLE_PROPAGATION_GATE_MAX_HIGH_RESIDUAL ?? "2");
const minWatermarkSurvivability = Number(
  process.env.CASTLE_PROPAGATION_MIN_WATERMARK_SURVIVABILITY ?? "0.2"
);

const narrative = await buildUnifiedStateNarrativeV0({
  tenantId: "org-propagation-gate-ci",
  tenantIsolationProbe: "PROBE_PROPAGATION_CI"
});

const sim =
  narrative.humanOps?.socialPropagationSimulation ||
  runSocialPropagationSimulationV0(narrative);

const slackPath = sim.paths.find((p) => p.id === "slack_headline_share");
const slackWatermark = slackPath?.watermarkSurvivability?.combinedSurvivability ?? 0;

const slackHigh = slackPath?.residualRisk === "high";

const passed =
  !slackHigh &&
  slackWatermark >= minWatermarkSurvivability &&
  sim.highResidualCount <= maxHighResidual;

const payload = {
  gate: "rhizoh.social_propagation_release_gate.v0",
  ranAt: new Date().toISOString(),
  scenarioCount: sim.scenarioCount,
  highResidualCount: sim.highResidualCount,
  maxAllowedHighResidual: maxHighResidual,
  worstWatermarkSurvivability: sim.aggregate.worstWatermarkSurvivability,
  slackWatermarkSurvivability: slackWatermark,
  minRequiredSlackWatermarkSurvivability: minWatermarkSurvivability,
  dominantDistortionSource: sim.aggregate.dominantDistortionSource,
  slackHighResidual: slackHigh,
  passed
};

console.log(JSON.stringify(payload, null, 2));

if (!passed) {
  console.error("SOCIAL_PROPAGATION_GATE_FAIL");
  for (const p of sim.paths.filter((x) => x.residualRisk === "high")) {
    console.error(`  - ${p.id} risk=${p.pathRiskScore} watermark=${p.watermarkSurvivability.combinedSurvivability}`);
  }
  process.exit(1);
}

process.exit(0);
