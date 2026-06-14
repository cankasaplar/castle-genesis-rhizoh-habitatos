/**
 * Live Consistency Audit — 4-axis behavioral validation for map / spatial runtime.
 * Not a debug dump: checks whether the simulation is *consistent*, not merely running.
 */

import { listSpatialNodesV0, SPATIAL_NODE_TIER_V0 } from "./rhizohSpatialNodeLayerV0.js";
import { getTruthTraceLogV0, TRUTH_TRACE_KIND_V0 } from "./rhizohTruthTraceLayerV0.js";
import {
  getSpatialOriginLogV0,
  getControlPlaneDecisionLogV0,
  EXPLANATION_KIND_V0
} from "./rhizohExplanationLayerV0.js";
import { getControlPlaneSnapshotV0 } from "./rhizohControlPlaneV0.js";
import { TRACE_CLASS_V0 } from "./rhizohTraceSamplingV0.js";
import {
  resolveRhizohCesiumLayerActiveV0,
  resolveRhizohWorldSpaceCesiumActiveV0
} from "./rhizohLayerContextV0.js";
import { readRhizohWorldMapToolV0 } from "./rhizohWorldMapToolV0.js";

export const RHIZOH_LIVE_CONSISTENCY_AUDIT_SCHEMA_V0 = "rhizoh.live_consistency_audit.v0";
export const RHIZOH_LIVE_CONSISTENCY_AUDIT_EVENT_V0 = "rhizoh:live-consistency-audit-v0";

/** @type {Map<string, number>} */
const nodeSpawnCounts = new Map();

/**
 * @param {string} tier
 * @param {string} nodeId
 */
export function noteSpatialNodeSpawnV0(tier, nodeId) {
  const key = `${String(tier || "static")}:${String(nodeId || "").trim()}`;
  if (!key.endsWith(":")) {
    nodeSpawnCounts.set(key, (nodeSpawnCounts.get(key) || 0) + 1);
  }
}

/**
 * @param {string} tier
 * @param {string} nodeId
 * @param {object} [payload]
 */
export function spatialNodeIdentityHashV0(tier, nodeId, payload = {}) {
  const base = `${tier}:${nodeId}:${payload.kind ?? ""}:${payload.sourceDomain ?? ""}`;
  let h = 0;
  for (let i = 0; i < base.length; i += 1) h = (h * 31 + base.charCodeAt(i)) >>> 0;
  return `nid_${h.toString(36)}`;
}

/**
 * Axis 1 — duplicate spawn, identity hash coherence.
 */
export function auditNodeConsistencyV0() {
  const nodes = listSpatialNodesV0();
  const duplicates = [];
  const hashes = new Map();

  for (const [key, count] of nodeSpawnCounts) {
    if (count > 1) duplicates.push(Object.freeze({ key, spawnCount: count }));
  }

  for (const node of nodes) {
    const hash = spatialNodeIdentityHashV0(node.tier, node.id, node.payload || {});
    const prev = hashes.get(node.id);
    if (prev && prev !== hash) {
      duplicates.push(
        Object.freeze({ key: `${node.tier}:${node.id}`, issue: "identity_hash_mismatch", prev, hash })
      );
    }
    hashes.set(node.id, hash);
  }

  const pass = duplicates.length === 0;
  return Object.freeze({
    axis: "node_consistency",
    pass,
    nodeCount: nodes.length,
    static: listSpatialNodesV0(SPATIAL_NODE_TIER_V0.STATIC).length,
    live: listSpatialNodesV0(SPATIAL_NODE_TIER_V0.LIVE).length,
    temporal: listSpatialNodesV0(SPATIAL_NODE_TIER_V0.TEMPORAL).length,
    duplicates: Object.freeze(duplicates),
    issues: pass ? [] : Object.freeze(["duplicate_spawn_or_hash_mismatch"])
  });
}

/**
 * Axis 2 — domain → adapter → tensor → spatial causal graph from CRITICAL traces.
 */
export function auditEventOriginGraphV0() {
  const traces = getTruthTraceLogV0();
  const origins = getSpatialOriginLogV0();
  const edges = [];
  const gaps = [];

  const critical = traces.filter((t) => t.traceClass === TRACE_CLASS_V0.CRITICAL || !t.traceClass);
  const domainTransitions = critical.filter((t) => t.kind === TRUTH_TRACE_KIND_V0.DOMAIN_TRANSITION);
  const tensorDecisions = critical.filter((t) => t.kind === TRUTH_TRACE_KIND_V0.TENSOR_DECISION);
  const spatialTraces = traces.filter((t) => t.kind === TRUTH_TRACE_KIND_V0.SPATIAL_NODE);

  for (const origin of origins) {
    const chain = origin.originChain || [];
    edges.push(
      Object.freeze({
        domain: origin.domain,
        chain,
        action: origin.action,
        atMs: origin.atMs
      })
    );
    if (chain.length < 3) {
      gaps.push(Object.freeze({ id: origin.id, issue: "incomplete_origin_chain" }));
    }
  }

  if (spatialTraces.length > 0 && tensorDecisions.length === 0 && domainTransitions.length === 0) {
    gaps.push(Object.freeze({ issue: "spatial_without_domain_causal_anchor" }));
  }

  const pass = gaps.length === 0 && (edges.length > 0 || spatialTraces.length === 0);
  return Object.freeze({
    axis: "event_origin_graph",
    pass,
    edgeCount: edges.length,
    criticalTraceCount: critical.length,
    signalTraceCount: traces.filter((t) => t.traceClass === TRACE_CLASS_V0.SIGNAL).length,
    edges: Object.freeze(edges.slice(-16)),
    gaps: Object.freeze(gaps),
    issues: pass ? [] : Object.freeze(gaps.map((g) => g.issue))
  });
}

/**
 * Axis 3 — adapter fallback frequency + resolution latency.
 */
export function auditAdapterStabilityV0() {
  const traces = getTruthTraceLogV0().filter((t) => t.kind === TRUTH_TRACE_KIND_V0.ADAPTER_INVOKE);
  const fallbacks = getTruthTraceLogV0().filter((t) => t.kind === TRUTH_TRACE_KIND_V0.FALLBACK);
  const adapterFailures = getControlPlaneDecisionLogV0().filter(
    (e) => e.kind === EXPLANATION_KIND_V0.ADAPTER_FAILURE
  );

  const latencies = traces
    .map((t) => t.latencyMs)
    .filter((n) => typeof n === "number" && n >= 0);
  const avgLatencyMs =
    latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null;
  const maxLatencyMs = latencies.length > 0 ? Math.max(...latencies) : null;

  const fallbackRate = traces.length > 0 ? fallbacks.length / traces.length : 0;
  const issues = [];
  if (fallbackRate > 0.25) issues.push("high_fallback_rate");
  if (maxLatencyMs !== null && maxLatencyMs > 500) issues.push("adapter_latency_spike");

  const cp = getControlPlaneSnapshotV0();
  if (cp?.health?.fallback === "active") issues.push("control_plane_fallback_active");

  const pass = issues.length === 0;
  return Object.freeze({
    axis: "adapter_stability",
    pass,
    invokeCount: traces.length,
    fallbackCount: fallbacks.length,
    adapterFailureCount: adapterFailures.length,
    fallbackRate: Math.round(fallbackRate * 1000) / 1000,
    avgLatencyMs,
    maxLatencyMs,
    issues: Object.freeze(issues)
  });
}

/**
 * Axis 4 — spatial emitter registry vs Cesium readiness divergence.
 */
function isProbeSpatialNodeV0(node) {
  const id = String(node?.id || "");
  return id.startsWith("probe-") || id.startsWith("probe_");
}

export function auditSpatialDriftV0() {
  const nodes = listSpatialNodesV0().filter((n) => !isProbeSpatialNodeV0(n));
  const liveCount = nodes.filter((n) => n.tier === SPATIAL_NODE_TIER_V0.LIVE).length;
  const cesium =
    typeof window !== "undefined" && window.__CASTLE_CESIUM__
      ? window.__CASTLE_CESIUM__
      : null;
  const cesiumReady = cesium?.ready === true || cesium?.commandReady === true;
  const cameraGeo = typeof cesium?.getCameraGeo === "function" ? cesium.getCameraGeo() : null;

  const pathname = typeof window !== "undefined" ? String(window.location.pathname || "") : "";
  const mapTool =
    typeof window !== "undefined" ? readRhizohWorldMapToolV0() : "city_map";
  const mapLayerExpected =
    resolveRhizohWorldSpaceCesiumActiveV0({
      pathname,
      mapSurfaceActive: true,
      mapTool
    }) ||
    resolveRhizohCesiumLayerActiveV0({
      pathname,
      realityMode: "REAL_MAP",
      mapSurfaceActive: true,
      mapTool
    });

  const issues = [];
  if (liveCount > 0 && !cesiumReady && mapLayerExpected) {
    issues.push("live_nodes_before_cesium_ready");
  }
  if (nodes.length > 0 && !cesium && mapLayerExpected) {
    issues.push("spatial_nodes_without_cesium_handle");
  }
  if (liveCount > 0 && cesiumReady && !cameraGeo && mapLayerExpected) {
    issues.push("live_projection_without_camera_geo");
  }

  const pass = issues.length === 0;
  return Object.freeze({
    axis: "spatial_drift",
    pass,
    spatialNodeCount: nodes.length,
    liveProjectionCount: liveCount,
    cesiumReady,
    hasCameraGeo: Boolean(cameraGeo),
    issues: Object.freeze(issues)
  });
}

/**
 * Run full 4-axis live consistency audit.
 * @param {{ domain?: string }} [opts]
 */
export function runLiveConsistencyAuditV0(opts = {}) {
  const axes = Object.freeze({
    nodeConsistency: auditNodeConsistencyV0(),
    eventOriginGraph: auditEventOriginGraphV0(),
    adapterStability: auditAdapterStabilityV0(),
    spatialDrift: auditSpatialDriftV0()
  });

  const pass = Object.values(axes).every((a) => a.pass);
  const report = Object.freeze({
    schema: RHIZOH_LIVE_CONSISTENCY_AUDIT_SCHEMA_V0,
    domain: opts.domain ?? null,
    pass,
    atMs: Date.now(),
    axes,
    summary: pass ? "consistent" : "drift_detected"
  });

  if (typeof window !== "undefined") {
    window.__RHIZOH_LIVE_CONSISTENCY_AUDIT__ = report;
    window.dispatchEvent(new CustomEvent(RHIZOH_LIVE_CONSISTENCY_AUDIT_EVENT_V0, { detail: report }));
  }

  return report;
}

/** @returns {ReturnType<typeof runLiveConsistencyAuditV0> | null} */
export function getLiveConsistencyAuditSnapshotV0() {
  if (typeof window !== "undefined" && window.__RHIZOH_LIVE_CONSISTENCY_AUDIT__) {
    return window.__RHIZOH_LIVE_CONSISTENCY_AUDIT__;
  }
  return null;
}

/** @internal vitest */
export function __resetLiveConsistencyAuditForTestV0() {
  nodeSpawnCounts.clear();
  if (typeof window !== "undefined") {
    delete window.__RHIZOH_LIVE_CONSISTENCY_AUDIT__;
  }
}
