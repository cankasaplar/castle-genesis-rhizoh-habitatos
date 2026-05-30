#!/usr/bin/env node
import { buildUnifiedStateNarrativeV0 } from "./unifiedStateNarrativeV0.js";
import { EXECUTION_ELIGIBILITY_V0 } from "./actionContextResolutionLayerV0.js";

const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-acrl-gate-ci" });
const acrl = n.actionContextResolution;

if (!acrl?.schema) {
  console.error("ACRL_GATE_FAIL: missing actionContextResolution");
  process.exit(1);
}

const deploy = acrl.actionOverloadingRisk?.deployAgentExample;
const spiralBlocked = deploy?.spiral_mmo === EXECUTION_ELIGIBILITY_V0.BLOCKED;
const govReview = deploy?.governance === EXECUTION_ELIGIBILITY_V0.REVIEW_REQUIRED;
const noCollision = acrl.domainCollision?.detected !== true;
const bindingPresent = acrl.asglGclBinding?.schema != null;
const fingerprintOk = Boolean(acrl.contextFingerprint?.fingerprintHash);

const payload = {
  gate: "rhizoh.action_context_resolution_gate.v0",
  ranAt: new Date().toISOString(),
  spiralDeployBlocked: spiralBlocked,
  governanceDeployReview: govReview,
  domainCollision: acrl.domainCollision?.detected,
  fingerprintOk,
  bindingPresent,
  passed: spiralBlocked && govReview && noCollision && fingerprintOk && bindingPresent
};

console.log(JSON.stringify(payload, null, 2));
process.exit(payload.passed ? 0 : 1);
