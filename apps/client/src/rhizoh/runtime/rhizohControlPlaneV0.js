/**
 * Rhizoh Control Plane — governance layer above adapter registry + tensor bridge.
 * Monitors health, manages downgrade/isolation, audits tensor decisions, blocks cascade failure.
 */

import { RHIZOH_DOMAIN_ID_V0, getRhizohDomainCoreSnapshotV0 } from "./rhizohDomainCoreStoreV0.js";
import { evaluateBaseDomainHealthV0 } from "./rhizohDomainHealthContractV0.js";
import { resolveDomainDowngradePolicyV0, RHIZOH_DOWNGRADE_MODE_V0 } from "./rhizohDomainDowngradePolicyV0.js";
import { blockSpatialEmitterV0, unblockSpatialEmitterV0 } from "./rhizohSpatialEventEmitterV0.js";
import {
  traceControlPlaneV0,
  traceFallbackV0
} from "./rhizohTruthTraceLayerV0.js";
import {
  explainControlPlaneDecisionV0,
  explainCascadeIsolationV0
} from "./rhizohExplanationLayerV0.js";

export const RHIZOH_CONTROL_PLANE_SCHEMA_V0 = "rhizoh.control_plane.v0";
export const RHIZOH_CONTROL_PLANE_EVENT_V0 = "rhizoh:control-plane-v0";

export const PROPAGATION_V0 = Object.freeze({
  SAFE: "safe",
  WARNING: "warning",
  BLOCKED: "blocked"
});

export const ISOLATION_V0 = Object.freeze({
  STRICT: "strict",
  RELAXED: "relaxed"
});

export const FALLBACK_V0 = Object.freeze({
  ACTIVE: "active",
  IDLE: "idle"
});

/** @type {Map<string, ReturnType<typeof runControlPlaneForDomainV0>>} */
const controlSnapshots = new Map();

/** @type {Set<string>} */
const cascadeBlockedDomains = new Set();

/** @type {object[]} */
const tensorAuditLog = [];
const AUDIT_MAX = 128;

/**
 * @param {string} domain
 * @param {object} baseHealth
 */
function resolvePropagationV0(domain, baseHealth) {
  if (cascadeBlockedDomains.has(domain)) return PROPAGATION_V0.BLOCKED;
  if (!baseHealth.gate || !baseHealth.render) return PROPAGATION_V0.BLOCKED;
  if (!baseHealth.adapter || !baseHealth.tensor) return PROPAGATION_V0.WARNING;
  return PROPAGATION_V0.SAFE;
}

/**
 * @param {string} domain
 * @param {string} propagation
 */
function resolveIsolationLevelV0(domain, propagation) {
  if (propagation === PROPAGATION_V0.BLOCKED) return ISOLATION_V0.STRICT;
  if (
    domain === RHIZOH_DOMAIN_ID_V0.CASTLE ||
    domain === RHIZOH_DOMAIN_ID_V0.STUDIO ||
    domain === RHIZOH_DOMAIN_ID_V0.OBSERVER
  ) {
    return ISOLATION_V0.STRICT;
  }
  return propagation === PROPAGATION_V0.WARNING ? ISOLATION_V0.STRICT : ISOLATION_V0.RELAXED;
}

/**
 * @param {boolean} degraded
 */
function resolveFallbackStateV0(degraded) {
  return degraded ? FALLBACK_V0.ACTIVE : FALLBACK_V0.IDLE;
}

/**
 * Apply cascade isolation — failed domain cannot propagate events to others.
 * @param {string} failedDomain
 */
export function applyCascadeIsolationV0(failedDomain) {
  const d = String(failedDomain || "").trim();
  if (!d) return;
  cascadeBlockedDomains.add(d);
  blockSpatialEmitterV0(d);
  explainCascadeIsolationV0(d, "cascade_health_failure");
}

/**
 * @param {string} domain
 */
export function clearCascadeIsolationV0(domain) {
  const d = String(domain || "").trim();
  cascadeBlockedDomains.delete(d);
  unblockSpatialEmitterV0(d);
}

/**
 * Extended health contract with governance fields.
 * @param {string} domain
 * @param {{ tensorOk?: boolean }} [opts]
 */
export function evaluateControlPlaneHealthV0(domain, opts = {}) {
  const d = String(domain || RHIZOH_DOMAIN_ID_V0.T0).trim();
  const base = evaluateBaseDomainHealthV0(d);
  const tensor = opts.tensorOk !== undefined ? opts.tensorOk : base.tensor;

  const coreOk = base.gate && base.adapter && tensor && base.render;
  const degraded = !coreOk;
  const propagation = resolvePropagationV0(d, { ...base, tensor });
  const isolation = resolveIsolationLevelV0(d, propagation);
  const fallback = resolveFallbackStateV0(degraded);
  const downgrade = resolveDomainDowngradePolicyV0(d, degraded);

  if (propagation === PROPAGATION_V0.BLOCKED && degraded) {
    applyCascadeIsolationV0(d);
  } else if (!degraded) {
    clearCascadeIsolationV0(d);
  }

  return Object.freeze({
    schema: RHIZOH_CONTROL_PLANE_SCHEMA_V0,
    domain: d,
    gate: base.gate,
    adapter: base.adapter,
    tensor,
    render: base.render,
    propagation,
    isolation,
    fallback,
    safeUiMode: degraded,
    downgradeMode: degraded ? RHIZOH_DOWNGRADE_MODE_V0.DEGRADED : RHIZOH_DOWNGRADE_MODE_V0.NORMAL,
    downgrade,
    reasons: base.reasons,
    atMs: Date.now()
  });
}

/**
 * Safety filter — intent → decision → safety → constraint → action.
 * @param {string} domain
 * @param {object} action
 * @param {object} [request]
 */
export function validateTensorSafetyV0(domain, action, request = {}) {
  const d = String(domain || "").trim();
  const snap = controlSnapshots.get(d);
  const health = snap?.health;
  const downgrade = health?.downgrade || resolveDomainDowngradePolicyV0(d, false);

  if (cascadeBlockedDomains.has(d)) {
    return Object.freeze({ allowed: false, reason: "cascade_isolated", action: null });
  }

  if (health?.propagation === PROPAGATION_V0.BLOCKED) {
    return Object.freeze({ allowed: false, reason: "propagation_blocked", action: null });
  }

  if (d === RHIZOH_DOMAIN_ID_V0.OBSERVER && request.mutate === true) {
    return Object.freeze({ allowed: false, reason: "observer_read_only", action: null });
  }

  if (d === RHIZOH_DOMAIN_ID_V0.WORLD && downgrade.cesiumFreeze && action?.action?.includes?.("fly")) {
    return Object.freeze({ allowed: false, reason: "world_cesium_frozen", action: null });
  }

  if (d === RHIZOH_DOMAIN_ID_V0.CASTLE && downgrade.presenceReadOnly && request.mutate === true) {
    return Object.freeze({ allowed: false, reason: "castle_presence_read_only", action: null });
  }

  if (d === RHIZOH_DOMAIN_ID_V0.STUDIO && downgrade.exportDisabled && action?.action === "persist_artifact") {
    return Object.freeze({ allowed: false, reason: "studio_export_disabled", action: null });
  }

  return Object.freeze({ allowed: true, reason: null, action });
}

/**
 * @param {string} domain
 * @param {object} decision
 */
export function auditTensorDecisionV0(domain, decision) {
  const row = Object.freeze({
    domain: String(domain || ""),
    decision,
    atMs: Date.now()
  });
  tensorAuditLog.push(row);
  if (tensorAuditLog.length > AUDIT_MAX) tensorAuditLog.shift();
  return row;
}

/**
 * Full control-plane pass after domain bootstrap.
 * @param {string} domain
 * @param {{ tensorResult?: object }} [ctx]
 */
export function runControlPlaneForDomainV0(domain, ctx = {}) {
  const d = String(domain || RHIZOH_DOMAIN_ID_V0.T0).trim();
  const tensorOk = ctx.tensorResult?.ok !== false;
  const health = evaluateControlPlaneHealthV0(d, { tensorOk });

  const snap = Object.freeze({
    schema: RHIZOH_CONTROL_PLANE_SCHEMA_V0,
    domain: d,
    health,
    safeUiMode: health.safeUiMode,
    downgrade: health.downgrade,
    atMs: Date.now()
  });

  controlSnapshots.set(d, snap);

  traceControlPlaneV0(d, health);
  explainControlPlaneDecisionV0(d, health);
  if (health.fallback === FALLBACK_V0.ACTIVE || health.safeUiMode) {
    traceFallbackV0(d, health.downgradeMode || "degraded", {
      reasons: health.reasons,
      safeUiMode: health.safeUiMode === true
    });
  }

  if (typeof window !== "undefined") {
    window.__RHIZOH_CONTROL_PLANE__ = snap;
    window.dispatchEvent(new CustomEvent(RHIZOH_CONTROL_PLANE_EVENT_V0, { detail: snap }));
  }

  return snap;
}

/** @returns {ReturnType<typeof runControlPlaneForDomainV0> | null} */
export function getControlPlaneSnapshotV0(domain) {
  const d = domain ? String(domain) : "";
  if (d) {
    return controlSnapshots.get(d) ?? null;
  }
  const active = getRhizohDomainCoreSnapshotV0()?.activeDomain;
  if (active && controlSnapshots.has(active)) {
    return controlSnapshots.get(active) ?? null;
  }
  if (typeof window !== "undefined" && window.__RHIZOH_CONTROL_PLANE__) {
    return window.__RHIZOH_CONTROL_PLANE__;
  }
  const last = [...controlSnapshots.values()].pop();
  return last ?? null;
}

/** @returns {object[]} */
export function getTensorAuditLogV0() {
  return [...tensorAuditLog];
}

/** @returns {object} */
export function getDomainDowngradeModeV0(domain) {
  const snap = getControlPlaneSnapshotV0(domain);
  return snap?.downgrade || resolveDomainDowngradePolicyV0(domain, false);
}

/** @internal vitest */
export function __resetControlPlaneForTestV0() {
  controlSnapshots.clear();
  cascadeBlockedDomains.clear();
  tensorAuditLog.length = 0;
}
