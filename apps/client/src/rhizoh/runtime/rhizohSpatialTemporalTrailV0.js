/**
 * Temporal spatial trail — event history / replay markers on the map layer (TEMPORAL tier).
 * RESEARCH-ONLY observability projection; not authority input.
 */

import { SPATIAL_NODE_TIER_V0 } from "./rhizohSpatialNodeLayerV0.js";
import { emitSpatialEventFromDomainV0 } from "./rhizohSpatialEventEmitterV0.js";
import { RHIZOH_DOMAIN_ID_V0 } from "./rhizohDomainCoreStoreV0.js";

export const SPATIAL_TEMPORAL_TRAIL_SCHEMA_V0 = "rhizoh.spatial_temporal_trail.v0";

const TEMPORAL_TRAIL_RING_MAX_V0 = 48;
/** @type {object[]} */
const temporalTrailRingV0 = [];

function pushTrailRowV0(row) {
  temporalTrailRingV0.push(row);
  if (temporalTrailRingV0.length > TEMPORAL_TRAIL_RING_MAX_V0) temporalTrailRingV0.shift();
}

/**
 * @param {string} sourceDomain
 * @param {{ nodeId: string, kind: string, payload?: object }} event
 */
export function emitSpatialTemporalTrailV0(sourceDomain, event = {}) {
  const nodeId = String(event.nodeId || "").trim();
  if (!nodeId) return Object.freeze({ ok: false, reason: "missing_node_id" });
  const result = emitSpatialEventFromDomainV0(sourceDomain, {
    tier: SPATIAL_NODE_TIER_V0.TEMPORAL,
    nodeId,
    kind: event.kind || "trail_marker",
    payload: {
      trailSchema: SPATIAL_TEMPORAL_TRAIL_SCHEMA_V0,
      ...(event.payload || {})
    },
    trigger: "temporal_trail"
  });
  if (result.ok) {
    pushTrailRowV0(
      Object.freeze({
        atMs: Date.now(),
        domain: sourceDomain,
        nodeId,
        kind: event.kind || "trail_marker"
      })
    );
  }
  return result;
}

/**
 * Domain transition → temporal trail node (history trace).
 */
export function recordDomainTransitionTemporalV0(opts = {}) {
  const domain = String(opts.domain || RHIZOH_DOMAIN_ID_V0.T0);
  const prev = String(opts.prevDomain || "none");
  const pathname = String(opts.pathname || "/");
  const at = Date.now();
  return emitSpatialTemporalTrailV0(RHIZOH_DOMAIN_ID_V0.OBSERVER, {
    nodeId: `trail_domain_${at.toString(36)}`,
    kind: "domain_transition_trail",
    payload: {
      domain,
      prevDomain: prev,
      pathname,
      reason: opts.reason || "gate_bootstrap"
    }
  });
}

/**
 * World POI fetch → sampled temporal trail markers (not full static pin set).
 * @param {{ rows?: object[], feed?: string, limit?: number }} opts
 */
export function publishWorldPoiTemporalTrailV0(opts = {}) {
  const rows = Array.isArray(opts.rows) ? opts.rows : [];
  const feed = String(opts.feed || "unknown");
  const limit = Math.min(12, Math.max(1, Number(opts.limit) || 8));
  const sample = rows.slice(0, limit);
  const at = Date.now();
  let emitted = 0;

  for (let i = 0; i < sample.length; i++) {
    const row = sample[i];
    const lat = Number(row?.lat);
    const lon = Number(row?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const out = emitSpatialTemporalTrailV0(RHIZOH_DOMAIN_ID_V0.WORLD, {
      nodeId: `trail_poi_${String(row.id || i)}_${at.toString(36)}`,
      kind: "poi_fetch_trail",
      payload: {
        feed,
        lat,
        lon,
        name: row?.name || null,
        sampleIndex: i,
        totalLoaded: rows.length
      }
    });
    if (out.ok) emitted += 1;
  }

  if (sample.length) {
    emitSpatialTemporalTrailV0(RHIZOH_DOMAIN_ID_V0.WORLD, {
      nodeId: `trail_poi_batch_${at.toString(36)}`,
      kind: "poi_batch_trail",
      payload: { feed, loaded: rows.length, sampled: emitted }
    });
  }

  return Object.freeze({ ok: true, emitted, feed, loaded: rows.length });
}

export function getSpatialTemporalTrailSnapshotV0() {
  return Object.freeze({
    schema: SPATIAL_TEMPORAL_TRAIL_SCHEMA_V0,
    count: temporalTrailRingV0.length,
    recent: Object.freeze(temporalTrailRingV0.slice(-12))
  });
}
