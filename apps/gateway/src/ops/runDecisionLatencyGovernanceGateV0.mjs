#!/usr/bin/env node
import { buildUnifiedStateNarrativeV0 } from "./unifiedStateNarrativeV0.js";

const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-dlgl-gate-ci" });
const dlgl = n.decisionLatencyGovernance;

if (!dlgl?.schema) {
  console.error("DLGL_GATE_FAIL: missing decisionLatencyGovernance");
  process.exit(1);
}

const packetOk = Boolean(dlgl.humanDecisionPacket?.primaryActionId);
const chainOk = dlgl.decisionChain?.depth === 5;
const noAutoExecute = n.interpretationSafetyContract?.can_execute === false;
const inflationOk = typeof dlgl.latencyInflation?.score === "number";

const payload = {
  gate: "rhizoh.decision_latency_governance_gate.v0",
  ranAt: new Date().toISOString(),
  latencyTier: dlgl.latencyTier,
  inflationScore: dlgl.latencyInflation?.score,
  fastPathEligible: dlgl.fastPath?.eligible,
  packetOk,
  chainOk,
  noAutoExecute,
  passed: packetOk && chainOk && noAutoExecute && inflationOk
};

console.log(JSON.stringify(payload, null, 2));
process.exit(payload.passed ? 0 : 1);
