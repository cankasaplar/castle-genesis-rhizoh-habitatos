/**
 * Rhizoh Explanation Layer — human-readable WHY for control plane + spatial + tensor decisions.
 * Sits above Truth Trace: raw events → structured explanations (not a black box).
 */

import { isTruthTraceEnabledV0 } from "./rhizohTruthTraceLayerV0.js";
import { RHIZOH_DOWNGRADE_MODE_V0 } from "./rhizohDomainDowngradePolicyV0.js";
import { isTraceSamplingActiveV0 } from "./rhizohTraceSamplingV0.js";

export const RHIZOH_EXPLANATION_SCHEMA_V0 = "rhizoh.explanation.v0";
export const RHIZOH_EXPLANATION_EVENT_V0 = "rhizoh:explanation-v0";

export const EXPLANATION_KIND_V0 = Object.freeze({
  CONTROL_PLANE: "control_plane_decision",
  TENSOR_SAFETY: "tensor_safety_block",
  CASCADE_ISOLATION: "cascade_isolation",
  SPATIAL_ORIGIN: "spatial_event_origin",
  ADAPTER_FAILURE: "adapter_failure",
  DOWNGRADE: "downgrade_triggered"
});

/** @type {object[]} */
const explanationLog = [];
/** @type {object[]} */
const controlPlaneDecisionLog = [];
/** @type {object[]} */
const spatialOriginLog = [];

const LOG_MAX = 128;

/** @type {boolean | null} @internal vitest */
let forceEnabledForTest = null;

/**
 * @returns {boolean}
 */
export function isExplanationEnabledV0() {
  if (forceEnabledForTest !== null) return forceEnabledForTest;
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const v = String(import.meta.env.VITE_RHIZOH_EXPLANATION ?? "").trim().toLowerCase();
    if (v === "0" || v === "false" || v === "off") return false;
    if (v === "1" || v === "true" || v === "on") return true;
  }
  return isTruthTraceEnabledV0();
}

function nextExplanationIdV0() {
  return `exp_${Date.now().toString(36)}_${explanationLog.length}`;
}

function pushExplanation(row, { controlPlane = false, spatial = false } = {}) {
  explanationLog.push(row);
  if (explanationLog.length > LOG_MAX) explanationLog.shift();
  if (controlPlane) {
    controlPlaneDecisionLog.push(row);
    if (controlPlaneDecisionLog.length > LOG_MAX) controlPlaneDecisionLog.shift();
  }
  if (spatial) {
    spatialOriginLog.push(row);
    if (spatialOriginLog.length > LOG_MAX) spatialOriginLog.shift();
  }

  if (typeof window !== "undefined") {
    window.__RHIZOH_EXPLANATION__ = getExplanationSnapshotV0();
    window.dispatchEvent(new CustomEvent(RHIZOH_EXPLANATION_EVENT_V0, { detail: row }));
  }

  return row;
}

/**
 * @param {string} domain
 * @param {string} action
 * @param {object[]} reasons
 * @param {object} [extra]
 */
function buildExplanationV0(kind, domain, action, reasons, extra = {}) {
  if (!isExplanationEnabledV0()) return null;

  const row = Object.freeze({
    schema: RHIZOH_EXPLANATION_SCHEMA_V0,
    id: nextExplanationIdV0(),
    kind,
    domain: String(domain || ""),
    action: String(action || "unknown"),
    summary: extra.summary ?? summarizeActionV0(domain, action, reasons),
    reasons: Object.freeze(reasons.map((r) => Object.freeze({ ...r }))),
    human: formatExplanationHumanV0(domain, action, reasons),
    atMs: Date.now(),
    ...extra
  });

  return row;
}

/**
 * @param {string} domain
 * @param {object} health
 */
export function explainControlPlaneDecisionV0(domain, health) {
  const d = String(domain || "").trim();
  const reasons = [];
  let action = "normal_operation";

  if (!health?.gate) {
    reasons.push({ code: "gate_unavailable", detail: "Domain gate did not resolve" });
  }
  if (!health?.adapter) {
    reasons.push({ code: "adapter_missing", detail: "Required adapter not registered" });
  }
  if (health?.tensor === false) {
    reasons.push({ code: "tensor_init_failed", detail: "Tensor bridge init returned failure" });
  }
  if (!health?.render) {
    reasons.push({ code: "render_not_ready", detail: "Render isolation or surface not ready" });
  }

  for (const r of health?.reasons || []) {
    reasons.push({ code: String(r), detail: `Health contract: ${r}` });
  }

  if (health?.propagation === "blocked") {
    action = "propagation_blocked";
    reasons.push({
      code: "control_plane_propagation_blocked",
      detail: "Control plane blocked cross-domain event propagation"
    });
  } else if (health?.propagation === "warning") {
    action = "degraded_propagation";
    reasons.push({
      code: "control_plane_propagation_warning",
      detail: "Adapter or tensor degraded — strict isolation applied"
    });
  }

  if (health?.fallback === "active" || health?.safeUiMode) {
    action = resolveDowngradeActionV0(d, health);
    reasons.push({
      code: "control_plane_downgrade_triggered",
      detail: `Downgrade mode: ${health?.downgradeMode ?? RHIZOH_DOWNGRADE_MODE_V0.DEGRADED}`
    });
    appendDowngradeReasonsV0(d, health?.downgrade, reasons);
  }

  if (health?.isolation === "strict") {
    reasons.push({
      code: "isolation_strict",
      detail: "Domain events confined — cascade prevention active"
    });
  }

  const row = buildExplanationV0(
    EXPLANATION_KIND_V0.CONTROL_PLANE,
    d,
    action,
    reasons,
    { health: summarizeHealthV0(health) }
  );
  if (!row) return null;
  return pushExplanation(row, { controlPlane: true });
}

/**
 * @param {string} domain
 * @param {object} [health]
 */
function resolveDowngradeActionV0(domain, health) {
  const downgrade = health?.downgrade || {};
  if (domain === "world" && downgrade.cesiumFreeze) return "cesium_freeze";
  if (domain === "castle" && downgrade.voiceEnabled === false) return "castle_voice_off";
  if (domain === "studio" && downgrade.editorReadOnly) return "studio_read_only";
  return "safe_ui_mode";
}

/**
 * @param {string} domain
 * @param {object} [downgrade]
 * @param {object[]} reasons
 */
function appendDowngradeReasonsV0(domain, downgrade, reasons) {
  if (!downgrade || typeof downgrade !== "object") return;
  for (const [key, val] of Object.entries(downgrade)) {
    if (key === "mode") continue;
    if (val === true || val === false) {
      reasons.push({
        code: `downgrade_policy:${key}`,
        detail: `${domain} policy → ${key}=${val}`
      });
    }
  }
  if (downgrade.cesiumFreeze) {
    reasons.push({
      code: "spatial_emitter_live_blocked",
      detail: "Spatial emitter: live spatial commands disabled under cesium freeze"
    });
  }
  if (downgrade.spatialCommands === false) {
    reasons.push({
      code: "spatial_commands_disabled",
      detail: "World spatial commands blocked by downgrade policy"
    });
  }
}

/**
 * @param {string} domain
 * @param {string} reason
 * @param {object} [ctx]
 */
export function explainTensorSafetyBlockV0(domain, reason, ctx = {}) {
  const reasons = [
    { code: "tensor_safety_threshold", detail: `Safety filter blocked: ${reason}` },
    { code: "control_plane_constraint", detail: "Control plane safety filter applied before action" }
  ];
  if (ctx.intent) {
    reasons.unshift({ code: "intent_rejected", detail: `Intent "${ctx.intent}" not allowed` });
  }
  if (ctx.action) {
    reasons.push({ code: "action_blocked", detail: String(ctx.action) });
  }

  const row = buildExplanationV0(
    EXPLANATION_KIND_V0.TENSOR_SAFETY,
    domain,
    "tensor_safety_block",
    reasons,
    { blockReason: reason, intent: ctx.intent ?? null }
  );
  if (!row) return null;
  return pushExplanation(row, { controlPlane: true });
}

/**
 * @param {string} domain
 * @param {string} [trigger]
 */
export function explainCascadeIsolationV0(domain, trigger = "health_failure") {
  const reasons = [
    { code: "cascade_failure_prevention", detail: `Trigger: ${trigger}` },
    { code: "spatial_emitter_blocked", detail: "Spatial emitter blocked for isolated domain" },
    { code: "control_plane_isolation", detail: "Control plane: cascade isolation applied" }
  ];

  const row = buildExplanationV0(
    EXPLANATION_KIND_V0.CASCADE_ISOLATION,
    domain,
    "domain_isolated",
    reasons,
    { trigger }
  );
  if (!row) return null;
  return pushExplanation(row, { controlPlane: true });
}

/**
 * Spatial event origin tracking — why did this map event arrive?
 * @param {string} sourceDomain
 * @param {object} event
 * @param {{ ok: boolean, reason?: string, node?: object }} outcome
 * @param {{ trigger?: string, intent?: string }} [origin]
 */
export function explainSpatialEventOriginV0(sourceDomain, event, outcome, origin = {}, opts = {}) {
  const domain = String(sourceDomain || "").trim();
  const tier = event.tier ?? "static";
  const nodeId = event.nodeId ?? "";
  const kind = event.kind ?? "node";

  if (isTraceSamplingActiveV0() && outcome.ok && opts.traceRecorded === false) {
    return null;
  }

  const reasons = [
    {
      code: "spatial_emitter_path",
      detail: `${domain} → spatial_emitter → ${tier}:${nodeId} → map_renderer`
    },
    { code: "event_kind", detail: `Kind: ${kind}` }
  ];

  if (origin.trigger) {
    reasons.unshift({ code: "origin_trigger", detail: origin.trigger });
  }
  if (origin.intent) {
    reasons.unshift({ code: "origin_intent", detail: `Intent: ${origin.intent}` });
  }

  let action = "spatial_node_registered";
  if (!outcome.ok) {
    action = "spatial_event_blocked";
    reasons.push({
      code: "block_reason",
      detail: outcome.reason || "unknown"
    });
    if (outcome.reason === "emitter_blocked") {
      reasons.push({
        code: "control_plane_cascade",
        detail: "Domain isolated — spatial emitter blocked live events"
      });
    }
  } else if (tier === "live") {
    reasons.push({
      code: "projection_only",
      detail: "LIVE tier = projection only (not domain state)"
    });
  }

  const row = buildExplanationV0(EXPLANATION_KIND_V0.SPATIAL_ORIGIN, domain, action, reasons, {
    tier,
    nodeId,
    kind,
    outcomeOk: outcome.ok === true,
    originChain: Object.freeze([
      domain,
      "spatial_emitter",
      `${tier}:${nodeId}`,
      outcome.ok ? "map_renderer" : "blocked"
    ])
  });
  if (!row) return null;
  return pushExplanation(row, { spatial: true });
}

/**
 * @param {string} domain
 * @param {string} capability
 * @param {string} adapterId
 * @param {string} reason
 */
export function explainAdapterFailureV0(domain, capability, adapterId, reason) {
  const reasons = [
    { code: "adapter_identity", detail: `Adapter: ${adapterId || "null"}` },
    { code: "capability", detail: `Capability: ${capability}` },
    { code: "failure_reason", detail: reason || "adapter_failed" }
  ];

  const row = buildExplanationV0(
    EXPLANATION_KIND_V0.ADAPTER_FAILURE,
    domain,
    "adapter_fallback",
    reasons,
    { capability, adapterId }
  );
  if (!row) return null;
  return pushExplanation(row, { controlPlane: true });
}

/**
 * @param {string} domain
 * @param {string} action
 * @param {object[]} reasons
 */
export function formatExplanationHumanV0(domain, action, reasons) {
  const lines = [
    `DOMAIN: ${String(domain || "").toUpperCase()}`,
    `ACTION: ${action}`,
    "",
    "REASON:"
  ];
  for (const r of reasons) {
    lines.push(`- ${r.detail || r.code}`);
  }
  return lines.join("\n");
}

function summarizeActionV0(domain, action, reasons) {
  const top = reasons[0]?.detail || reasons[0]?.code || "no reason recorded";
  return `${domain}:${action} — ${top}`;
}

function summarizeHealthV0(health) {
  if (!health) return null;
  return Object.freeze({
    propagation: health.propagation ?? null,
    isolation: health.isolation ?? null,
    fallback: health.fallback ?? null,
    safeUiMode: health.safeUiMode === true,
    downgradeMode: health.downgradeMode ?? null
  });
}

/**
 * @returns {{ schema: string, enabled: boolean, count: number, controlPlaneDecisions: number, spatialOrigins: number, entries: object[] }}
 */
export function getExplanationSnapshotV0() {
  return Object.freeze({
    schema: RHIZOH_EXPLANATION_SCHEMA_V0,
    enabled: isExplanationEnabledV0(),
    count: explanationLog.length,
    controlPlaneDecisions: controlPlaneDecisionLog.length,
    spatialOrigins: spatialOriginLog.length,
    entries: Object.freeze([...explanationLog]),
    latest: explanationLog.at(-1) ?? null
  });
}

/** @returns {object[]} */
export function getControlPlaneDecisionLogV0() {
  return [...controlPlaneDecisionLog];
}

/** @returns {object[]} */
export function getSpatialOriginLogV0() {
  return [...spatialOriginLog];
}

/** @returns {object[]} */
export function getExplanationLogV0() {
  return [...explanationLog];
}

/** @param {string} domain */
export function getLatestExplanationForDomainV0(domain) {
  const d = String(domain || "").trim();
  for (let i = explanationLog.length - 1; i >= 0; i -= 1) {
    if (explanationLog[i].domain === d) return explanationLog[i];
  }
  return null;
}

/** @internal vitest */
export function __forceExplanationEnabledForTestV0(enabled) {
  forceEnabledForTest = enabled === true;
}

/** @internal vitest */
export function __resetExplanationLayerForTestV0() {
  explanationLog.length = 0;
  controlPlaneDecisionLog.length = 0;
  spatialOriginLog.length = 0;
  forceEnabledForTest = null;
  if (typeof window !== "undefined") {
    delete window.__RHIZOH_EXPLANATION__;
  }
}
