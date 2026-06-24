/**
 * Spatial surface renderer registry — Cesium / Leaflet / Three / etc. as plugins on one topology.
 * RESEARCH-ONLY — observation framing; does not gate execution.
 */

import {
  getCesiumExecutorApiV0,
  isCesiumExecutorCommandReadyV0
} from "../../castleFlight/cesiumCommandExecutorV0.js";
import { getSpatialReadyGateSnapshotV0 } from "./rhizohSpatialReadyGateV0.js";
import { listSpatialNodesV0 } from "./rhizohSpatialNodeLayerV0.js";
import { isWorldLayerEnabled } from "./castleWorldLayerGateV0.js";
import {
  getSpatialWorldSyncSnapshotV0,
  isSpatialWorldSyncReadyV0
} from "./spatialWorldSyncV0.js";
import { resolveWorldLayerActivationStatusV0 } from "./rhizohWorldLayerActivationStatusV0.js";

export const RHIZOH_SPATIAL_RENDERER_REGISTRY_SCHEMA_V0 = "rhizoh.spatial_surface_renderer_registry.v0";

export const SPATIAL_RENDERER_PLUGIN_V0 = Object.freeze({
  CESIUM: "cesium",
  LEAFLET: "leaflet",
  THREE: "three_js",
  UNREAL_STREAM: "unreal_stream",
  XR: "xr_surface"
});

/**
 * @param {{
 *   id: string,
 *   label: string,
 *   registered: boolean,
 *   mounted: boolean,
 *   ready: boolean,
 *   commandReady?: boolean,
 *   enabled: boolean,
 *   blocked: boolean,
 *   legalHold: boolean,
 *   pending: boolean,
 *   blockReason?: string | null
 * }} row
 */
function freezePluginRowV0(row) {
  return Object.freeze(row);
}

/**
 * @returns {object[]}
 */
export function listSpatialRendererPluginSnapshotsV0() {
  const worldLayer = resolveWorldLayerActivationStatusV0();
  const worldSync = getSpatialWorldSyncSnapshotV0();
  const legalHold = worldLayer.phase === "legal_hold";
  const gateOpen = isSpatialWorldSyncReadyV0();

  const cesiumWindow =
    typeof window !== "undefined" && window.__CASTLE_CESIUM__ ? window.__CASTLE_CESIUM__ : null;
  const cesiumExecutor = getCesiumExecutorApiV0() || cesiumWindow;
  const cesiumRegistered = Boolean(cesiumExecutor && typeof cesiumExecutor === "object");
  const cesiumCommandReady = isCesiumExecutorCommandReadyV0(cesiumExecutor);
  const cesiumMounted = Boolean(cesiumWindow);
  const cesiumReady = cesiumCommandReady === true;
  const cesiumBlocked = legalHold || !gateOpen;
  const cesiumBlockReason = legalHold
    ? worldLayer.holdReason || "legal_hold"
    : !cesiumRegistered
      ? "plugin_not_registered"
      : !cesiumCommandReady
        ? "command_not_ready"
        : !gateOpen
          ? "spatial_gate_closed"
          : null;

  const leaflet =
    typeof window !== "undefined" && window.__RHIZOH_MAP_DIAG__?.engine === "leaflet";
  const leafletRegistered = Boolean(leaflet);

  return Object.freeze([
    freezePluginRowV0({
      id: SPATIAL_RENDERER_PLUGIN_V0.CESIUM,
      label: "Cesium",
      registered: cesiumRegistered,
      mounted: cesiumMounted,
      ready: cesiumReady,
      commandReady: cesiumCommandReady,
      enabled: isWorldLayerEnabled() && !legalHold,
      blocked: cesiumBlocked,
      legalHold,
      pending: cesiumRegistered && !cesiumReady && !legalHold,
      blockReason: cesiumBlockReason
    }),
    freezePluginRowV0({
      id: SPATIAL_RENDERER_PLUGIN_V0.LEAFLET,
      label: "Leaflet",
      registered: leafletRegistered,
      mounted: leafletRegistered,
      ready: leafletRegistered,
      commandReady: leafletRegistered,
      enabled: isWorldLayerEnabled(),
      blocked: false,
      legalHold: false,
      pending: false,
      blockReason: leafletRegistered ? null : "plugin_not_registered"
    }),
    freezePluginRowV0({
      id: SPATIAL_RENDERER_PLUGIN_V0.THREE,
      label: "Three.js",
      registered: false,
      mounted: false,
      ready: false,
      commandReady: false,
      enabled: false,
      blocked: true,
      legalHold: false,
      pending: false,
      blockReason: "plugin_not_registered"
    }),
    freezePluginRowV0({
      id: SPATIAL_RENDERER_PLUGIN_V0.UNREAL_STREAM,
      label: "Unreal Stream",
      registered: false,
      mounted: false,
      ready: false,
      commandReady: false,
      enabled: false,
      blocked: true,
      legalHold: false,
      pending: false,
      blockReason: "plugin_not_registered"
    }),
    freezePluginRowV0({
      id: SPATIAL_RENDERER_PLUGIN_V0.XR,
      label: "XR Surface",
      registered: false,
      mounted: false,
      ready: false,
      commandReady: false,
      enabled: false,
      blocked: true,
      legalHold: false,
      pending: false,
      blockReason: "plugin_not_registered"
    })
  ]);
}

/**
 * @returns {object}
 */
export function getSpatialRendererRegistrySnapshotV0() {
  const plugins = listSpatialRendererPluginSnapshotsV0();
  const active = plugins.find((p) => p.ready) || plugins.find((p) => p.mounted) || null;
  const gate = getSpatialReadyGateSnapshotV0();
  const worldSync = getSpatialWorldSyncSnapshotV0();
  const worldLayer = resolveWorldLayerActivationStatusV0();
  const nodeCount = listSpatialNodesV0().length;
  const cesiumPlugin = plugins.find((p) => p.id === SPATIAL_RENDERER_PLUGIN_V0.CESIUM) || null;

  const snap = Object.freeze({
    schema: RHIZOH_SPATIAL_RENDERER_REGISTRY_SCHEMA_V0,
    atMs: Date.now(),
    influencesExecution: false,
    worldExists: isWorldLayerEnabled(),
    topologyExists: nodeCount > 0,
    spatialNodeCount: nodeCount,
    activeRenderer: active?.id ?? null,
    activeRendererReady: active?.ready === true,
    rendererAbsent: !active?.ready,
    plugins: Object.freeze(plugins.slice()),
    worldLayerPhase: worldLayer.phase,
    holdReason: worldLayer.holdReason,
    worldSync: Object.freeze({
      worldSyncActive: worldSync.worldSyncActive,
      adapterAlive: worldSync.adapterAlive,
      ready: worldSync.ready
    }),
    gateCause:
      gate.open === true
        ? "open"
        : !worldSync.worldSyncActive
          ? "world_sync_inactive"
          : !worldSync.adapterAlive
            ? cesiumPlugin?.blockReason || "adapter_not_alive"
            : "spatial_gate_closed",
    narrative: active?.ready
      ? `Rhizoh topology · ${active.label} renderer active`
      : nodeCount > 0
        ? `Rhizoh exists · world topology exists · renderer plugin absent (${cesiumPlugin?.blockReason || "unknown"})`
        : "Rhizoh exists · topology seed pending · renderer plugin absent",
    spatialGate: Object.freeze({
      open: gate.open,
      cesiumReady: gate.cesiumReady,
      buffered: gate.buffered
    })
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.spatialRendererRegistry = snap;
  }

  return snap;
}
