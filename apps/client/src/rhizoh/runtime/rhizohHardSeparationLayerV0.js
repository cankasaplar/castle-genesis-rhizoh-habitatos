/**
 * Hard Separation Layer v0 — Epistemic / Execution / Legal boundary enforcement.
 * Epistemic writes truth; Execution renders truth; Legal blocks external effect.
 * RESEARCH-ONLY
 */

import {
  assertExecutionGovernanceLayerV0,
  getExecutionGovernanceSnapshotV0,
  GOVERNANCE_LAYER_V0,
  isExternalEffectPermittedV0,
  isLegalGateHardBlockedV0,
  isUserImpactingMutationPermittedV0
} from "./rhizohExecutionGovernanceSwitchboardV0.js";
import { assertForwardExecutionAuthorityV0, EXECUTION_LAYER } from "./executionAuthorityBoundaryV0.js";

export const RHIZOH_HARD_SEPARATION_LAYER_SCHEMA_V0 = "castle.rhizoh.hard_separation_layer.v0";

export const HARD_SEPARATION_REALM_V0 = Object.freeze({
  EPISTEMIC: "epistemic",
  EXECUTION: "execution",
  LEGAL: "legal"
});

/** Forbidden cross-realm flows during shadow production. */
const FORBIDDEN_CROSS_REALM_V0 = Object.freeze([
  Object.freeze({ from: HARD_SEPARATION_REALM_V0.EPISTEMIC, to: HARD_SEPARATION_REALM_V0.EXECUTION, action: "feeds_move_selection" }),
  Object.freeze({ from: HARD_SEPARATION_REALM_V0.EPISTEMIC, to: HARD_SEPARATION_REALM_V0.EXECUTION, action: "feeds_drift_detection" }),
  Object.freeze({ from: HARD_SEPARATION_REALM_V0.EXECUTION, to: HARD_SEPARATION_REALM_V0.EPISTEMIC, action: "reverse_execution_authority" }),
  Object.freeze({ from: HARD_SEPARATION_REALM_V0.EXECUTION, to: HARD_SEPARATION_REALM_V0.LEGAL, action: "bypass_legal_gate" })
]);

/**
 * @param {string} fromRealm
 * @param {string} toRealm
 * @param {string} action
 */
export function assertHardSeparationCrossRealmV0(fromRealm, toRealm, action) {
  const from = String(fromRealm || "");
  const to = String(toRealm || "");
  const act = String(action || "");

  const forbidden = FORBIDDEN_CROSS_REALM_V0.find(
    (r) => r.from === from && r.to === to && r.action === act
  );
  if (forbidden) {
    return Object.freeze({
      schema: RHIZOH_HARD_SEPARATION_LAYER_SCHEMA_V0,
      permitted: false,
      blocked: true,
      fromRealm: from,
      toRealm: to,
      action: act,
      reason: `forbidden_cross_realm:${from}->${to}:${act}`
    });
  }

  if (act === "reverse_execution_authority") {
    const auth = assertForwardExecutionAuthorityV0(EXECUTION_LAYER.ACTUATOR, EXECUTION_LAYER.EPISTEMIC);
    if (!auth.ok) {
      return Object.freeze({
        schema: RHIZOH_HARD_SEPARATION_LAYER_SCHEMA_V0,
        permitted: false,
        blocked: true,
        fromRealm: from,
        toRealm: to,
        action: act,
        reason: auth.code
      });
    }
  }

  return Object.freeze({
    schema: RHIZOH_HARD_SEPARATION_LAYER_SCHEMA_V0,
    permitted: true,
    blocked: false,
    fromRealm: from,
    toRealm: to,
    action: act,
    reason: null
  });
}

/**
 * Legal layer choke — external effects and user mutations.
 * @param {{ action?: string, layer?: string }} [opts]
 */
export function assertLegalEffectGateV0(opts = {}) {
  const layer = opts.layer || GOVERNANCE_LAYER_V0.EXTERNAL_EFFECTS;
  const gate = assertExecutionGovernanceLayerV0(layer, { reason: opts.action || "legal_effect_gate" });

  if (!gate.permitted) {
    return Object.freeze({
      schema: RHIZOH_HARD_SEPARATION_LAYER_SCHEMA_V0,
      permitted: false,
      blocked: true,
      layer,
      legalGateHardBlock: isLegalGateHardBlockedV0(),
      reason: gate.reason,
      governance: gate
    });
  }

  return Object.freeze({
    schema: RHIZOH_HARD_SEPARATION_LAYER_SCHEMA_V0,
    permitted: true,
    blocked: false,
    layer,
    legalGateHardBlock: isLegalGateHardBlockedV0(),
    reason: null,
    governance: gate
  });
}

/**
 * @returns {object}
 */
export function getHardSeparationSnapshotV0() {
  const governance = getExecutionGovernanceSnapshotV0();
  return Object.freeze({
    schema: RHIZOH_HARD_SEPARATION_LAYER_SCHEMA_V0,
    realms: HARD_SEPARATION_REALM_V0,
    forbiddenCrossRealm: FORBIDDEN_CROSS_REALM_V0,
    legalGateHardBlock: isLegalGateHardBlockedV0(),
    externalEffectPermitted: isExternalEffectPermittedV0(),
    userImpactingMutationPermitted: isUserImpactingMutationPermittedV0(),
    governanceMode: governance.mode,
    shadowProductionMode: governance.shadowProductionMode,
    atMs: Date.now()
  });
}

export function ensureHardSeparationDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.hardSeparation = getHardSeparationSnapshotV0();
  window.__rhizoh.assertLegalEffectGate = assertLegalEffectGateV0;
  window.__rhizoh.assertHardSeparationCrossRealm = assertHardSeparationCrossRealmV0;
  return window.__rhizoh.hardSeparation;
}
