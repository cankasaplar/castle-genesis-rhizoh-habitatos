import {
  resolveTraceSamplingV0,
  scheduleTraceFlushV0,
  noteTraceRecordedV0,
  getTraceSamplingSnapshotV0,
  __resetTraceSamplingForTestV0
} from "./rhizohTraceSamplingV0.js";

export const RHIZOH_TRUTH_TRACE_SCHEMA_V0 = "rhizoh.truth_trace.v0";
export const RHIZOH_TRUTH_TRACE_EVENT_V0 = "rhizoh:truth-trace-v0";

export const TRUTH_TRACE_KIND_V0 = Object.freeze({
  DOMAIN_TRANSITION: "domain_transition",
  DOMAIN_PASS: "domain_pass",
  ADAPTER_RESOLVE: "adapter_resolve",
  ADAPTER_INVOKE: "adapter_invoke",
  TENSOR_DECISION: "tensor_decision",
  TENSOR_REPLAY: "tensor_replay",
  FALLBACK: "fallback",
  SPATIAL_NODE: "spatial_node",
  CONTROL_PLANE: "control_plane",
  CODEX_GHOST: "codex_ghost"
});

/** @type {object[]} */
const traceLog = [];
const TRACE_MAX = 256;

/** @type {string | null} */
let sessionTraceId = null;

/** @type {boolean | null} @internal vitest */
let forceEnabledForTest = null;

/**
 * @returns {boolean}
 */
export function isTruthTraceEnabledV0() {
  if (forceEnabledForTest !== null) return forceEnabledForTest;
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const v = String(import.meta.env.VITE_RHIZOH_TRUTH_TRACE ?? "").trim().toLowerCase();
    if (v === "0" || v === "false" || v === "off") return false;
    if (v === "1" || v === "true" || v === "on") return true;
    if (import.meta.env.PROD) return true;
  }
  return typeof import.meta !== "undefined" && Boolean(import.meta.env?.DEV);
}

function nextTraceIdV0() {
  if (!sessionTraceId) {
    sessionTraceId = `tr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }
  return `${sessionTraceId}_${traceLog.length}`;
}

/**
 * @param {string} kind
 * @param {object} detail
 */
export function traceTruthEventV0(kind, detail = {}) {
  if (!isTruthTraceEnabledV0()) return null;

  const sampling = resolveTraceSamplingV0(kind, detail);
  if (!sampling.record) return null;

  const row = Object.freeze({
    schema: RHIZOH_TRUTH_TRACE_SCHEMA_V0,
    traceId: nextTraceIdV0(),
    kind: String(kind || "unknown"),
    sampleTier: sampling.tier,
    sampleMode: sampling.mode,
    traceClass: sampling.traceClass,
    atMs: Date.now(),
    ...detail
  });

  traceLog.push(row);
  if (traceLog.length > TRACE_MAX) traceLog.shift();
  noteTraceRecordedV0(sampling.mode, sampling.traceClass, kind);

  const flush = () => {
    if (typeof window === "undefined") return;
    window.__RHIZOH_TRUTH_TRACE__ = getTruthTraceSnapshotV0();
    window.dispatchEvent(new CustomEvent(RHIZOH_TRUTH_TRACE_EVENT_V0, { detail: row }));
  };
  scheduleTraceFlushV0(flush, sampling.mode);

  return row;
}

/**
 * Domain gate transition trace.
 */
export function traceDomainTransitionV0(opts = {}) {
  return traceTruthEventV0(TRUTH_TRACE_KIND_V0.DOMAIN_TRANSITION, {
    domain: opts.domain ?? null,
    prevDomain: opts.prevDomain ?? null,
    pathname: opts.pathname ?? null,
    reason: opts.reason ?? "gate_bootstrap"
  });
}

/**
 * passDomainStateV0 handoff trace.
 */
export function traceDomainPassV0(from, to, payload) {
  return traceTruthEventV0(TRUTH_TRACE_KIND_V0.DOMAIN_PASS, {
    from: String(from || ""),
    to: String(to || ""),
    payloadSummary: payload && typeof payload === "object" ? Object.keys(payload) : null,
    reason: "explicit_passDomainStateV0"
  });
}

/**
 * Adapter identity + selection reason.
 */
export function traceAdapterResolveV0(domain, capability, adapter, reason = "registry_lookup") {
  return traceTruthEventV0(TRUTH_TRACE_KIND_V0.ADAPTER_RESOLVE, {
    domain: String(domain || ""),
    capability: String(capability || ""),
    adapterId: adapter?.id ?? "null",
    adapterKind: adapter?.kind ?? "unknown",
    reason
  });
}

/**
 * Adapter invoke with latency.
 */
export function traceAdapterInvokeV0(domain, capability, adapter, request, result, startedAtMs) {
  const latencyMs =
    typeof startedAtMs === "number" ? Math.max(0, Date.now() - startedAtMs) : null;
  return traceTruthEventV0(TRUTH_TRACE_KIND_V0.ADAPTER_INVOKE, {
    domain: String(domain || ""),
    capability: String(capability || ""),
    adapterId: adapter?.id ?? "null",
    requestSummary: summarizeRequestV0(request),
    resultOk: result?.ok !== false,
    resultReason: result?.reason ?? null,
    fallback: result?.reason === "null_adapter" ? "idle_adapter" : "none",
    latencyMs
  });
}

/**
 * Full intent → tensor → action chain.
 */
export function traceTensorDecisionV0(opts = {}) {
  return traceTruthEventV0(TRUTH_TRACE_KIND_V0.TENSOR_DECISION, {
    domain: opts.domain ?? null,
    intent: opts.intent ?? null,
    tensorAction: opts.action ?? null,
    adapterId: opts.adapterId ?? null,
    render: opts.render ?? null,
    fallback: opts.fallback ?? "none",
    blocked: opts.blocked === true,
    blockReason: opts.blockReason ?? null,
    latencyMs: opts.latencyMs ?? null,
    chain: Object.freeze([
      "intent",
      "tensor_decision",
      opts.blocked ? "safety_blocked" : "adapter_invoke",
      opts.blocked ? "fallback" : "action"
    ])
  });
}

/**
 * Fallback / downgrade explanation.
 */
export function traceFallbackV0(domain, reason, detail = {}) {
  return traceTruthEventV0(TRUTH_TRACE_KIND_V0.FALLBACK, {
    domain: String(domain || ""),
    reason: String(reason || "unknown"),
    ...detail
  });
}

/**
 * Spatial node action — LIVE nodes are projection-only.
 */
export function traceSpatialNodeV0(tier, nodeId, detail = {}) {
  const t = String(tier || "static");
  return traceTruthEventV0(TRUTH_TRACE_KIND_V0.SPATIAL_NODE, {
    tier: t,
    nodeId: String(nodeId || ""),
    projectionOnly: t === "live",
    ...detail
  });
}

/**
 * Codex ghost lifecycle — spawn/death from PersistentCodexBus (observation only).
 */
export function traceCodexGhostV0(phase, detail = {}) {
  return traceTruthEventV0(TRUTH_TRACE_KIND_V0.CODEX_GHOST, {
    phase: String(phase || "spawn"),
    influencesExecution: false,
    ...detail
  });
}

/**
 * Control plane health snapshot trace.
 */
export function traceControlPlaneV0(domain, health) {
  return traceTruthEventV0(TRUTH_TRACE_KIND_V0.CONTROL_PLANE, {
    domain: String(domain || ""),
    propagation: health?.propagation ?? null,
    isolation: health?.isolation ?? null,
    fallback: health?.fallback ?? null,
    safeUiMode: health?.safeUiMode === true,
    reasons: health?.reasons ?? []
  });
}

/**
 * @param {object} request
 */
function summarizeRequestV0(request) {
  if (!request || typeof request !== "object") return null;
  return Object.freeze({
    intent: request.intent ?? null,
    op: request.op ?? null,
    action: request.action ?? null
  });
}

/**
 * @returns {{ schema: string, enabled: boolean, count: number, sessionTraceId: string | null, entries: object[] }}
 */
export function getTruthTraceSnapshotV0() {
  return Object.freeze({
    schema: RHIZOH_TRUTH_TRACE_SCHEMA_V0,
    enabled: isTruthTraceEnabledV0(),
    count: traceLog.length,
    sessionTraceId,
    sampling: getTraceSamplingSnapshotV0(),
    entries: Object.freeze([...traceLog])
  });
}

/** @returns {object[]} */
export function getTruthTraceLogV0() {
  return [...traceLog];
}

/** @param {string} [kind] */
export function getTruthTraceByKindV0(kind) {
  const k = String(kind || "").trim();
  if (!k) return getTruthTraceLogV0();
  return traceLog.filter((r) => r.kind === k);
}

/** @internal vitest */
export function __forceTruthTraceEnabledForTestV0(enabled) {
  forceEnabledForTest = enabled === true;
}

/** @internal vitest */
export function __resetTruthTraceForTestV0() {
  traceLog.length = 0;
  sessionTraceId = null;
  forceEnabledForTest = null;
  if (typeof window !== "undefined") {
    delete window.__RHIZOH_TRUTH_TRACE__;
  }
  __resetTraceSamplingForTestV0();
}
