/**
 * World · Space Re-attachment v0 — runtime → world_space bridge recovery after spatial desync.
 * Cesium rebind + normalized spatial_vector + drift quarantine at divergence > 0.23.
 */

import { hydrateWorldSpaceCastleAnchorV0 } from "./castleWorldSpaceContinuityV0.js";
import { resolveRhizohCesiumLayerActiveV0 } from "./rhizohLayerContextV0.js";
import { listSpatialNodesV0 } from "./rhizohSpatialNodeLayerV0.js";

export const WORLD_SPACE_REATTACHMENT_SCHEMA_V0 = "castle.rhizoh.world_space_reattachment.v0";
export const SPATIAL_DRIFT_QUARANTINE_THRESHOLD_V0 = 0.23;

/**
 * @param {{ lat?: number, lon?: number } | null | undefined} worldAnchor
 * @param {{ dtMs?: number, seq?: number } | null | undefined} temporalOffset
 */
export function normalizeSpatialVectorV0(worldAnchor, temporalOffset = {}) {
  const lat = Number(worldAnchor?.lat);
  const lon = Number(worldAnchor?.lon);
  const dtMs = Math.max(0, Number(temporalOffset?.dtMs) || 0);
  const seq = Math.max(0, Number(temporalOffset?.seq) || 0);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return Object.freeze({ ok: false, reason: "missing_world_anchor" });
  }

  const temporalScale = 1 / (1 + dtMs / 86_400_000);
  const seqBias = (seq % 360) / 360_000;
  const magnitude = Math.sqrt(lat * lat + lon * lon) || 1;
  const spatial_vector = Object.freeze({
    x: (lon / magnitude) * temporalScale + seqBias,
    y: (lat / magnitude) * temporalScale - seqBias * 0.5,
    z: temporalScale
  });

  return Object.freeze({
    ok: true,
    spatial_vector,
    world_anchor: Object.freeze({ lat, lon }),
    temporal_offset: Object.freeze({ dtMs, seq })
  });
}

/**
 * @param {number} divergence01
 */
export function evaluateSpatialDriftQuarantineV0(divergence01) {
  const divergence = Math.max(0, Math.min(1, Number(divergence01) || 0));
  const quarantine = divergence > SPATIAL_DRIFT_QUARANTINE_THRESHOLD_V0;
  return Object.freeze({
    divergence,
    threshold: SPATIAL_DRIFT_QUARANTINE_THRESHOLD_V0,
    quarantine,
    action: quarantine ? "quarantine_node" : "observe"
  });
}

/**
 * Estimate live divergence from Cesium readiness + spatial registry state.
 */
export function estimateWorldSpaceDivergenceV0() {
  const cesium =
    typeof window !== "undefined" && window.__CASTLE_CESIUM__
      ? window.__CASTLE_CESIUM__
      : null;
  const cesiumReady = cesium?.ready === true || cesium?.commandReady === true;
  const pathname = typeof window !== "undefined" ? String(window.location.pathname || "/") : "/";
  const mapExpected = resolveRhizohCesiumLayerActiveV0({
    pathname,
    realityMode: "REAL_MAP",
    mapSurfaceActive: true,
    mapTool: "city"
  });

  let divergence = 0;
  if (mapExpected && !cesium) divergence += 0.35;
  if (mapExpected && cesium && !cesiumReady) divergence += 0.28;
  if (typeof window !== "undefined" && window.__rhizoh?.genesisStream?.pollViaDirect === true) {
    divergence += 0.18;
  }
  if (typeof window !== "undefined" && window.__rhizoh?.ingressQueue?.authBlocked === true) {
    divergence += 0.12;
  }
  const causalCount =
    typeof window.__rhizoh?.causalMap?.nodeCount === "number"
      ? Number(window.__rhizoh.causalMap.nodeCount)
      : 0;
  const spatialCount = typeof window !== "undefined" ? listSpatialNodesV0().length : 0;
  if (causalCount > 0 && spatialCount === 0) {
    divergence += 0.32;
  }

  return Math.min(1, divergence);
}

/**
 * Re-initialize runtime → world_space bridge (Cesium rebind path).
 * @param {{ source?: string }} [opts]
 */
export function reattachWorldSpaceBridgeV0(opts = {}) {
  if (typeof window === "undefined") {
    return Object.freeze({ ok: false, reason: "no_window" });
  }

  const source = String(opts.source || "ontological_repair");
  const hydrated = hydrateWorldSpaceCastleAnchorV0();
  const geo = window.__CASTLE_NEXUS_GEO__ || null;
  const anchor =
    geo && Number.isFinite(geo.lat) && Number.isFinite(geo.lon)
      ? { lat: Number(geo.lat), lon: Number(geo.lon) }
      : null;

  const genesisSeq =
    typeof window.__rhizoh?.genesisStream?.lastAcceptedSeq === "number"
      ? window.__rhizoh.genesisStream.lastAcceptedSeq
      : 0;
  const vector = normalizeSpatialVectorV0(anchor, {
    dtMs: Date.now() - (Number(window.__rhizoh?.genesisAuthorityLock?.atMs) || Date.now()),
    seq: genesisSeq
  });

  const divergence = estimateWorldSpaceDivergenceV0();
  const quarantine = evaluateSpatialDriftQuarantineV0(divergence);

  const cesium = window.__CASTLE_CESIUM__;
  let cesiumRebound = false;
  if (cesium && typeof cesium.requestRender === "function") {
    try {
      cesium.requestRender();
      cesiumRebound = true;
    } catch {
      /* noop */
    }
  }

  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.worldSpaceBridge = Object.freeze({
    schema: WORLD_SPACE_REATTACHMENT_SCHEMA_V0,
    atMs: Date.now(),
    source,
    hydrated,
    anchor,
    spatial_vector: vector.ok ? vector.spatial_vector : null,
    divergence,
    quarantine,
    cesiumRebound,
    cesiumReady: cesium?.ready === true || cesium?.commandReady === true
  });

  if (quarantine.quarantine) {
    window.__rhizoh.worldSpaceQuarantine = Object.freeze({
      active: true,
      divergence: quarantine.divergence,
      threshold: quarantine.threshold,
      atMs: Date.now()
    });
  } else if (window.__rhizoh.worldSpaceQuarantine) {
    delete window.__rhizoh.worldSpaceQuarantine;
  }

  return Object.freeze({
    ok: vector.ok || hydrated,
    hydrated,
    vector,
    quarantine,
    cesiumRebound
  });
}
