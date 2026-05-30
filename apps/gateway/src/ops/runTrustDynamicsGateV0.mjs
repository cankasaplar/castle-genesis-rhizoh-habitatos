#!/usr/bin/env node
/**
 * CI gate — trust dynamics model must resolve fork when divergence is present.
 */
import { buildUnifiedStateNarrativeV0 } from "./unifiedStateNarrativeV0.js";
import { TRUST_DYNAMICS_FORK_V0 } from "./trustDecayModelV0.js";

const narrative = await buildUnifiedStateNarrativeV0({
  tenantId: "org-trust-dynamics-gate-ci"
});

const td = narrative.culturalRisk?.trustDynamics;
if (!td?.schema) {
  console.error("TRUST_DYNAMICS_GATE_FAIL: missing culturalRisk.trustDynamics");
  process.exit(1);
}

const axesOk = td.axes && typeof td.axes.exposureRepetition === "number";
const forkOk = Object.values(TRUST_DYNAMICS_FORK_V0).includes(td.fork);

const payload = {
  gate: "rhizoh.trust_dynamics_gate.v0",
  ranAt: new Date().toISOString(),
  fork: td.fork,
  trustDecayScore: td.scores.trustDecay,
  mythologyScore: td.scores.mythology,
  divergenceVisible: td.axes.divergenceVisible,
  axesOk,
  forkOk,
  passed: axesOk && forkOk
};

console.log(JSON.stringify(payload, null, 2));
process.exit(payload.passed ? 0 : 1);
