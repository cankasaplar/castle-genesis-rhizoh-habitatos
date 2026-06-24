/**
 * Execution Permission Layer v0 — unified read model for governance + admission.
 * RESEARCH-ONLY — labels only; never grants execution authority.
 */

import { getAdmissionArbitrationSnapshotV1 } from "./admissionArbitrationLayerV1.js";
import {
  assertExecutionGovernanceLayerV0,
  getExecutionGovernanceSnapshotV0,
  GOVERNANCE_LAYER_V0
} from "./rhizohExecutionGovernanceSwitchboardV0.js";

export const EXECUTION_PERMISSION_LAYER_SCHEMA_V0 = "castle.rhizoh.execution_permission_layer.v0";

export const EXECUTION_ACTION_CLASS_V0 = Object.freeze({
  OBSERVE: "observe",
  SUGGEST: "suggest",
  MUTATE: "mutate"
});

/**
 * @param {{ actionClass?: string, domain?: string }} [opts]
 */
export function evaluateExecutionPermissionV0(opts = {}) {
  const actionClass = String(opts.actionClass || EXECUTION_ACTION_CLASS_V0.OBSERVE);
  const domain = String(opts.domain || "world_bridge");
  const governance = getExecutionGovernanceSnapshotV0();
  const admission = getAdmissionArbitrationSnapshotV1();
  const externalGate = assertExecutionGovernanceLayerV0(GOVERNANCE_LAYER_V0.EXTERNAL_EFFECTS, {
    reason: `action_${actionClass}`
  });
  const mutationGate = assertExecutionGovernanceLayerV0(GOVERNANCE_LAYER_V0.USER_IMPACTING_MUTATIONS, {
    reason: `action_${actionClass}`
  });

  const observationPermitted = true;
  const mutationPermitted =
    actionClass === EXECUTION_ACTION_CLASS_V0.MUTATE &&
    mutationGate.permitted &&
    externalGate.permitted &&
    admission.lastVerdict?.inferenceEligible === true &&
    admission.lastVerdict?.realityMutationPermitted === true;

  const suggestPermitted =
    actionClass === EXECUTION_ACTION_CLASS_V0.SUGGEST ||
    actionClass === EXECUTION_ACTION_CLASS_V0.OBSERVE;

  return Object.freeze({
    schema: EXECUTION_PERMISSION_LAYER_SCHEMA_V0,
    actionClass,
    domain,
    observationPermitted,
    suggestPermitted,
    mutationPermitted,
    executionClass: mutationPermitted ? "mutate" : suggestPermitted ? "suggest" : "read_only",
    governanceMode: governance.mode,
    admissionVerdict: admission.lastVerdict?.verdict || null,
    inferenceEligible: admission.lastVerdict?.inferenceEligible === true,
    externalEffectBlocked: externalGate.blocked,
    mutationBlocked: mutationGate.blocked,
    interpretationOnly: true,
    nonExecutive: true,
    atMs: Date.now()
  });
}

export function getExecutionPermissionLayerSnapshotV0() {
  return evaluateExecutionPermissionV0({ actionClass: EXECUTION_ACTION_CLASS_V0.OBSERVE });
}

export function ensureExecutionPermissionLayerDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.executionPermission = (opts) => evaluateExecutionPermissionV0(opts);
  return window.__rhizoh.executionPermission;
}
