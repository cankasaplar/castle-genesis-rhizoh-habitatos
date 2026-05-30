#!/usr/bin/env node
import { buildUnifiedStateNarrativeV0 } from "./unifiedStateNarrativeV0.js";
const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-asgl-gate-ci" });
const asgl = n.actionSemanticGovernance;

if (!asgl?.schema) {
  console.error("ASGL_GATE_FAIL: missing actionSemanticGovernance");
  process.exit(1);
}

const prohibitedAuto = asgl.evaluatedSuggestedActions?.some(
  (e) => e.narrativeExecutable === true
);
const loopOk = asgl.epistemicFeedbackLoop?.loopClosed === true;
const authorityOk =
  asgl.epistemicFeedbackLoop?.risks?.authorityCollapse?.mitigated === true;

const payload = {
  gate: "rhizoh.action_semantic_governance_gate.v0",
  ranAt: new Date().toISOString(),
  highRiskActionCount: asgl.highRiskActionCount,
  loopClosed: loopOk,
  authorityMitigated: authorityOk,
  prohibitedNarrativeExecutable: prohibitedAuto,
  passed: loopOk && authorityOk && !prohibitedAuto
};

console.log(JSON.stringify(payload, null, 2));
process.exit(payload.passed ? 0 : 1);
