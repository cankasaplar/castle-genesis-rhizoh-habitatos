/**
 * Execution Governance Switchboard v0 — top-layer lock for Shadow Production Mode.
 * Defines which layers may exert real-world effect while legal gate is closed.
 * RESEARCH-ONLY — observation may run; external / user-impacting execution stays OFF.
 */

import { isRhizohLegalPendingHoldV0 } from "./rhizohLegalPendingWaitLoopV0.js";
import { resolveIngressRouteV0 } from "../ingress/ingress_router.js";
import {
  getAdmittedSubjectReportV0,
  isSubjectAdmittedV0
} from "../ingress/closedUserAdmissionEngineV0.js";
import { readClosedAdmissionSubjectRefV0 } from "../ingress/ingress_router.js";
import { isRhizohShadowModeActiveV0, resolveShadowModeReasonV0 } from "./rhizohShadowTraceLedgerV0.js";

export const RHIZOH_EXECUTION_GOVERNANCE_SWITCHBOARD_SCHEMA_V0 =
  "castle.rhizoh.execution_governance_switchboard.v0";

export const GOVERNANCE_MODE_V0 = Object.freeze({
  SHADOW_PRODUCTION: "shadow_production",
  LEGAL_HOLD: "legal_hold",
  LIVE_READY: "live_ready"
});

export const GOVERNANCE_LAYER_V0 = Object.freeze({
  UI_RENDERING: "ui_rendering",
  AGENTS: "agents",
  COUNCIL: "council",
  MEMORY_GRAPH: "memory_graph",
  STRESS_ENGINE: "stress_engine",
  SIMULATION: "simulation",
  PERSISTENCE: "persistence",
  EXTERNAL_EFFECTS: "external_effects",
  LEGAL_GATE: "legal_gate",
  USER_IMPACTING_MUTATIONS: "user_impacting_mutations"
});

/** Layer state: on | off | hard_block | limited */
export const GOVERNANCE_LAYER_STATE_V0 = Object.freeze({
  ON: "on",
  OFF: "off",
  HARD_BLOCK: "hard_block",
  LIMITED: "limited"
});

export const SHADOW_PRODUCTION_GOVERNANCE_V0 = Object.freeze({
  execution: GOVERNANCE_LAYER_STATE_V0.OFF,
  simulation: GOVERNANCE_LAYER_STATE_V0.ON,
  persistence: GOVERNANCE_LAYER_STATE_V0.ON,
  externalEffect: GOVERNANCE_LAYER_STATE_V0.OFF,
  interpretationOnly: true,
  nonExecutive: true
});

/** @type {Readonly<Record<string, string>>} */
const SHADOW_PRODUCTION_LAYER_MATRIX_V0 = Object.freeze({
  [GOVERNANCE_LAYER_V0.UI_RENDERING]: GOVERNANCE_LAYER_STATE_V0.ON,
  [GOVERNANCE_LAYER_V0.AGENTS]: GOVERNANCE_LAYER_STATE_V0.ON,
  [GOVERNANCE_LAYER_V0.COUNCIL]: GOVERNANCE_LAYER_STATE_V0.ON,
  [GOVERNANCE_LAYER_V0.MEMORY_GRAPH]: GOVERNANCE_LAYER_STATE_V0.ON,
  [GOVERNANCE_LAYER_V0.STRESS_ENGINE]: GOVERNANCE_LAYER_STATE_V0.ON,
  [GOVERNANCE_LAYER_V0.SIMULATION]: GOVERNANCE_LAYER_STATE_V0.ON,
  [GOVERNANCE_LAYER_V0.PERSISTENCE]: GOVERNANCE_LAYER_STATE_V0.ON,
  [GOVERNANCE_LAYER_V0.EXTERNAL_EFFECTS]: GOVERNANCE_LAYER_STATE_V0.OFF,
  [GOVERNANCE_LAYER_V0.LEGAL_GATE]: GOVERNANCE_LAYER_STATE_V0.HARD_BLOCK,
  [GOVERNANCE_LAYER_V0.USER_IMPACTING_MUTATIONS]: GOVERNANCE_LAYER_STATE_V0.OFF
});

/**
 * @returns {string}
 */
export function resolveExecutionGovernanceModeV0() {
  if (isRhizohLegalPendingHoldV0()) return GOVERNANCE_MODE_V0.LEGAL_HOLD;
  if (isRhizohShadowModeActiveV0()) return GOVERNANCE_MODE_V0.SHADOW_PRODUCTION;
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_RHIZOH_LIVE_READY === "1") {
    return GOVERNANCE_MODE_V0.LIVE_READY;
  }
  return GOVERNANCE_MODE_V0.SHADOW_PRODUCTION;
}

/**
 * @param {string} layer
 * @returns {string}
 */
export function getExecutionGovernanceLayerStateV0(layer) {
  const key = String(layer || "").trim();
  const mode = resolveExecutionGovernanceModeV0();

  if (mode === GOVERNANCE_MODE_V0.LIVE_READY) {
    if (key === GOVERNANCE_LAYER_V0.LEGAL_GATE) return GOVERNANCE_LAYER_STATE_V0.ON;
    if (key === GOVERNANCE_LAYER_V0.EXTERNAL_EFFECTS) return GOVERNANCE_LAYER_STATE_V0.LIMITED;
    if (key === GOVERNANCE_LAYER_V0.USER_IMPACTING_MUTATIONS) return GOVERNANCE_LAYER_STATE_V0.LIMITED;
    return SHADOW_PRODUCTION_LAYER_MATRIX_V0[key] || GOVERNANCE_LAYER_STATE_V0.ON;
  }

  return SHADOW_PRODUCTION_LAYER_MATRIX_V0[key] || GOVERNANCE_LAYER_STATE_V0.OFF;
}

/**
 * @param {string} layer
 * @returns {boolean}
 */
export function isExecutionGovernanceLayerEnabledV0(layer) {
  const state = getExecutionGovernanceLayerStateV0(layer);
  return state === GOVERNANCE_LAYER_STATE_V0.ON || state === GOVERNANCE_LAYER_STATE_V0.LIMITED;
}

/**
 * Hard stop for outbound / production side effects.
 * @returns {boolean}
 */
export function isExternalEffectPermittedV0() {
  return getExecutionGovernanceLayerStateV0(GOVERNANCE_LAYER_V0.EXTERNAL_EFFECTS) ===
    GOVERNANCE_LAYER_STATE_V0.ON;
}

/**
 * Hard stop for user-impacting writes (world action, policy mutation, etc.).
 * @returns {boolean}
 */
export function isUserImpactingMutationPermittedV0() {
  return getExecutionGovernanceLayerStateV0(GOVERNANCE_LAYER_V0.USER_IMPACTING_MUTATIONS) ===
    GOVERNANCE_LAYER_STATE_V0.ON;
}

/**
 * @returns {boolean}
 */
export function isLegalGateHardBlockedV0() {
  return getExecutionGovernanceLayerStateV0(GOVERNANCE_LAYER_V0.LEGAL_GATE) ===
    GOVERNANCE_LAYER_STATE_V0.HARD_BLOCK;
}

/**
 * Invited users = quarantine cohort: full observation, sandbox interaction, limited writes.
 * @param {{ subjectRef?: string|null }} [opts]
 */
export function resolveInvitedUserQuarantineCohortV0(opts = {}) {
  const subjectRef = String(
    opts.subjectRef ?? readClosedAdmissionSubjectRefV0() ?? ""
  ).trim();
  const admitted = subjectRef ? isSubjectAdmittedV0(subjectRef) : false;
  const admissionReport = subjectRef ? getAdmittedSubjectReportV0(subjectRef) : null;
  const mode = resolveExecutionGovernanceModeV0();
  const legalHold = isRhizohLegalPendingHoldV0();
  const ingress = resolveIngressRouteV0();
  const inQuarantineCohort =
    admitted && (legalHold || mode !== GOVERNANCE_MODE_V0.LIVE_READY || ingress?.route === "cohort");

  return Object.freeze({
    schema: RHIZOH_EXECUTION_GOVERNANCE_SWITCHBOARD_SCHEMA_V0,
    interpretationOnly: true,
    nonExecutive: true,
    subjectRef: subjectRef || null,
    admitted,
    inQuarantineCohort,
    writePermission: inQuarantineCohort
      ? GOVERNANCE_LAYER_STATE_V0.LIMITED
      : GOVERNANCE_LAYER_STATE_V0.OFF,
    observation: true,
    sandboxInteraction: inQuarantineCohort || isRhizohShadowModeActiveV0(),
    feedbackEvents: inQuarantineCohort,
    admissionReport,
    mode,
    legalHold
  });
}

/**
 * Assert layer gate — returns blocked snapshot when effect would leak.
 * @param {string} layer
 * @param {{ reason?: string }} [opts]
 */
export function assertExecutionGovernanceLayerV0(layer, opts = {}) {
  const state = getExecutionGovernanceLayerStateV0(layer);
  const permitted =
    state === GOVERNANCE_LAYER_STATE_V0.ON || state === GOVERNANCE_LAYER_STATE_V0.LIMITED;
  return Object.freeze({
    schema: RHIZOH_EXECUTION_GOVERNANCE_SWITCHBOARD_SCHEMA_V0,
    layer,
    state,
    permitted,
    blocked: !permitted,
    reason: opts.reason || (permitted ? null : `layer_${layer}_${state}`),
    mode: resolveExecutionGovernanceModeV0()
  });
}

/**
 * @returns {object}
 */
export function getExecutionGovernanceSnapshotV0() {
  const mode = resolveExecutionGovernanceModeV0();
  const layers = Object.freeze(
    Object.fromEntries(
      Object.values(GOVERNANCE_LAYER_V0).map((layer) => [layer, getExecutionGovernanceLayerStateV0(layer)])
    )
  );

  return Object.freeze({
    schema: RHIZOH_EXECUTION_GOVERNANCE_SWITCHBOARD_SCHEMA_V0,
    mode,
    shadowProductionMode: mode !== GOVERNANCE_MODE_V0.LIVE_READY,
    shadowModeActive: isRhizohShadowModeActiveV0(),
    shadowModeReason: resolveShadowModeReasonV0(),
    legalGateHardBlock: isLegalGateHardBlockedV0(),
    governance: SHADOW_PRODUCTION_GOVERNANCE_V0,
    layers,
    externalEffectPermitted: isExternalEffectPermittedV0(),
    userImpactingMutationPermitted: isUserImpactingMutationPermittedV0(),
    quarantineCohort: resolveInvitedUserQuarantineCohortV0(),
    atMs: Date.now()
  });
}

/**
 * Publish switchboard on window.__rhizoh (core boot + DevTools refresh).
 */
export function ensureExecutionGovernanceSwitchboardDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.executionGovernance = getExecutionGovernanceSnapshotV0();
  window.__rhizoh.getExecutionGovernanceSnapshot = getExecutionGovernanceSnapshotV0;
  window.__rhizoh.assertExecutionGovernanceLayer = assertExecutionGovernanceLayerV0;
  window.__rhizoh.isExternalEffectPermitted = isExternalEffectPermittedV0;
  window.__rhizoh.isUserImpactingMutationPermitted = isUserImpactingMutationPermittedV0;
  return window.__rhizoh.executionGovernance;
}
