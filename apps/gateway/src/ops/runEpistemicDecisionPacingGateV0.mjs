#!/usr/bin/env node
/**
 * EDPL gate — operator tempo + temporary_static_posture_windows.
 * Hard assert: deploy_agent and apply_narrative_suggested_action never receive execution_approval;
 * ACRL eligibility never OK for those actions on export.
 */
import { EXECUTION_ELIGIBILITY_V0 } from "./actionContextResolutionLayerV0.js";
import {
  EDPL_FORBIDDEN_EXECUTION_ACTIONS_V0,
  assertEdplExecutionBoundariesV0
} from "./epistemicDecisionPacingLayerV0.js";
import { buildUnifiedStateNarrativeV0 } from "./unifiedStateNarrativeV0.js";

const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-edpl-gate-ci" });
const edpl = n.epistemicDecisionPacing;

if (!edpl?.schema) {
  console.error("EDPL_GATE_FAIL: missing epistemicDecisionPacing");
  process.exit(1);
}

const boundaries = assertEdplExecutionBoundariesV0(n);
const windows = edpl.temporaryStaticPostureWindows?.temporaryStaticPostureWindows;
const saturationOk = edpl.operatorPacingControl?.queueSaturation?.tier != null;
const notCertaintyZone = windows?.notCertaintyZone === true;
const noExecute = n.interpretationSafetyContract?.can_execute === false;
const edplNoApproval = edpl.grantsExecutionApproval === false;

const acrlBlocked = EDPL_FORBIDDEN_EXECUTION_ACTIONS_V0.every((actionId) => {
  const matrix = n.actionContextResolution?.executionEligibilityMatrix?.find(
    (m) => m.actionId === actionId
  );
  if (!matrix) return false;
  return Object.values(matrix.matrix).every((c) => c.eligibility !== EXECUTION_ELIGIBILITY_V0.OK);
});

const payload = {
  gate: "rhizoh.epistemic_decision_pacing_gate.v0",
  ranAt: new Date().toISOString(),
  queueSaturationTier: edpl.operatorPacingControl?.queueSaturation?.tier,
  postureWindowCount: windows?.windowCount ?? 0,
  executionBoundariesValid: boundaries.valid,
  acrlForbiddenActionsBlocked: acrlBlocked,
  notCertaintyZone,
  edplNoApproval,
  noExecute,
  passed:
    saturationOk &&
    boundaries.valid &&
    acrlBlocked &&
    notCertaintyZone &&
    edplNoApproval &&
    noExecute
};

console.log(JSON.stringify(payload, null, 2));
if (!payload.passed) {
  console.error("EDPL_GATE_VIOLATIONS:", boundaries.violations);
}
process.exit(payload.passed ? 0 : 1);
