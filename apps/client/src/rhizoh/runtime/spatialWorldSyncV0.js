/**
 * World sync + spatial adapter liveness — gate truth source.
 * ready = worldSyncActive ∧ adapterAlive (not bufferEmpty ≠ cesium pending).
 */

import { getGenesisSingleAuthorityLockSnapshotV0 } from "./genesisSingleAuthorityLockV0.js";
import { getGroundingLayerSnapshotV1 } from "./rhizohGroundingLayerV1.js";
import { isCesiumExecutorCommandReadyV0 } from "../../castleFlight/cesiumCommandExecutorV0.js";
import { getCesiumExecutorApiV0 } from "../../castleFlight/cesiumCommandExecutorV0.js";

export const SPATIAL_WORLD_SYNC_SCHEMA_V0 = "castle.rhizoh.spatial_world_sync.v0";

/**
 * World anchor + genesis authority + grounding posture.
 */
export function isWorldSyncActiveV0() {
  if (typeof window === "undefined") return false;

  const geo = window.__CASTLE_NEXUS_GEO__;
  const hasGeo = Number.isFinite(Number(geo?.lat)) && Number.isFinite(Number(geo?.lon));
  const bridge = window.__rhizoh?.worldSpaceBridge;
  const bridgeOk = bridge?.hydrated === true || bridge?.ok === true;

  const lock = getGenesisSingleAuthorityLockSnapshotV0();
  const genesisOk = lock.originCount >= 1 && Boolean(lock.primaryOrigin);

  const grounding = getGroundingLayerSnapshotV1();
  const anchored = grounding.worldAnchored === true || hasGeo;

  return (hasGeo || bridgeOk) && genesisOk && anchored;
}

/**
 * Spatial adapter surface alive (Cesium executor registered or world_space bridge armed).
 */
export function isSpatialAdapterAliveV0() {
  if (typeof window === "undefined") return false;

  const api = getCesiumExecutorApiV0() || window.__CASTLE_CESIUM__;
  const cesiumRegistered = Boolean(api && typeof api === "object");
  const cesiumCommandReady = isCesiumExecutorCommandReadyV0(api);
  const bridgeArmed = Boolean(window.__rhizoh?.worldSpaceBridge);

  return cesiumRegistered && (cesiumCommandReady || bridgeArmed);
}

/**
 * Composite gate: worldSyncActive ∧ adapterAlive
 */
export function isSpatialWorldSyncReadyV0() {
  return isWorldSyncActiveV0() && isSpatialAdapterAliveV0();
}

export function getSpatialWorldSyncSnapshotV0() {
  const snap = Object.freeze({
    schema: SPATIAL_WORLD_SYNC_SCHEMA_V0,
    atMs: Date.now(),
    worldSyncActive: isWorldSyncActiveV0(),
    adapterAlive: isSpatialAdapterAliveV0(),
    ready: isSpatialWorldSyncReadyV0()
  });
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.spatialWorldSync = snap;
  }
  return snap;
}
