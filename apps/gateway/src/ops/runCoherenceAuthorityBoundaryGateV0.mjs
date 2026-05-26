#!/usr/bin/env node
import { COHERENCE_NEGATION_V0 } from "./coherenceAuthorityBoundaryV0.js";
import { buildUnifiedStateNarrativeV0 } from "./unifiedStateNarrativeV0.js";

const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-cab-gate-ci" });
const cab = n.coherenceAuthorityBoundary;

if (!cab?.schema) {
  console.error("CAB_GATE_FAIL: missing coherenceAuthorityBoundary");
  process.exit(1);
}

const neg = cab.negations || {};
const bindingOk = cab.eclAuthorityBinding?.valid === true;
const noExecute = cab.contract?.can_execute === false && n.interpretationSafetyContract?.can_execute === false;
const allNegations =
  neg[COHERENCE_NEGATION_V0.COHERENT_IS_NOT_EXECUTABLE_TRUTH] === true &&
  neg[COHERENCE_NEGATION_V0.COHERENT_IS_NOT_POLICY_OVERRIDE] === true &&
  neg[COHERENCE_NEGATION_V0.COHERENT_IS_NOT_REALITY_CLAIM] === true;

const payload = {
  gate: "rhizoh.coherence_authority_boundary_gate.v0",
  ranAt: new Date().toISOString(),
  eclVerdict: n.epistemicCoherence?.systemCoherence?.verdict,
  bindingValid: bindingOk,
  allNegations,
  noExecute,
  passed: bindingOk && allNegations && noExecute
};

console.log(JSON.stringify(payload, null, 2));
process.exit(payload.passed ? 0 : 1);
