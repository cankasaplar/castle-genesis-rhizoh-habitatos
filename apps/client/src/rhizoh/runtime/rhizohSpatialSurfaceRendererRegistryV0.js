/**
 * Spatial surface renderer registry — Cesium / Leaflet / Three / etc. as plugins on one topology.
 * RESEARCH-ONLY — observation framing; does not gate execution.
 */

import { getSpatialReadyGateSnapshotV0 } from "./rhizohSpatialReadyGateV0.js";
import { listSpatialNodesV0 } from "./rhizohSpatialNodeLayerV0.js";
import { isWorldLayerEnabled } from "./castleWorldLayerGateV0.js";

export const RHIZOH_SPATIAL_RENDERER_REGISTRY_SCHEMA_V0 = "rhizoh.spatial_surface_renderer_registry.v0";

export const SPATIAL_RENDERER_PLUGIN_V0 = Object.freeze({
  CESIUM: "cesium",
  LEAFLET: "leaflet",
  THREE: "three_js",
  UNREAL_STREAM: "unreal_stream",
  XR: "xr_surface"
});

/** @typedef {{ id: string, label: string, mounted: boolean, ready: boolean }} SpatialRendererPluginSnapshotV0 */

/**
 * @returns {SpatialRendererPluginSnapshotV0[]}
 */
export function listSpatialRendererPluginSnapshotsV0() {
  const cesium =
    typeof window !== "undefined" && window.__CASTLE_CESIUM__ ? window.__CASTLE_CESIUM__ : null;
  const cesiumReady = cesium?.ready === true || cesium?.commandReady === true;
  const leaflet =
    typeof window !== "undefined" && window.__RHIZOH_MAP_DIAG__?.engine === "leaflet";

  return Object.freeze([
    Object.freeze({
      id: SPATIAL_RENDERER_PLUGIN_V0.CESIUM,
      label: "Cesium",
      mounted: Boolean(cesium),
      ready: cesiumReady === true
    }),
    Object.freeze({
      id: SPATIAL_RENDERER_PLUGIN_V0.LEAFLET,
      label: "Leaflet",
      mounted: Boolean(leaflet),
      ready: Boolean(leaflet)
    }),
    Object.freeze({
      id: SPATIAL_RENDERER_PLUGIN_V0.THREE,
      label: "Three.js",
      mounted: false,
      ready: false
    }),
    Object.freeze({
      id: SPATIAL_RENDERER_PLUGIN_V0.UNREAL_STREAM,
      label: "Unreal Stream",
      mounted: false,
      ready: false
    }),
    Object.freeze({
      id: SPATIAL_RENDERER_PLUGIN_V0.XR,
      label: "XR Surface",
      mounted: false,
      ready: false
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
  const nodeCount = listSpatialNodesV0().length;

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
    narrative: active?.ready
      ? `Rhizoh topology · ${active.label} renderer active`
      : nodeCount > 0
        ? "Rhizoh exists · world topology exists · renderer plugin absent"
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
