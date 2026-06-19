/**
 * Spatial world sink probe — honest registry for Cesium / world-layer / router surfaces.
 * RESEARCH-ONLY observability; does not grant execution authority.
 */

import {
  getCesiumExecutorApiV0,
  isCesiumExecutorCommandReadyV0
} from "../../castleFlight/cesiumCommandExecutorV0.js";
import { isWorldLayerEnabled } from "./castleWorldLayerGateV0.js";
import {
  gateRhizohSpatialCommandV0,
  isRhizohWorldSpaceCesiumEnvEnabledV0,
  resolveRhizohCesiumLayerActiveV0,
  resolveRhizohLayerModeV0
} from "./rhizohLayerContextV0.js";
import { readRhizohWorldSystemModeV0 } from "./rhizohWorldSystemModeV0.js";
import { resolveSpatialSinkRoutePolicyV0 } from "./spatialSinkRoutePolicyV0.js";
import { publishRhizohSpatialModeV0 } from "./rhizohSpatialModeV0.js";

export const SPATIAL_WORLD_SINK_PROBE_SCHEMA_V0 = "castle.rhizoh.spatial_world_sink_probe.v0";

/**
 * Probe all known global sink registration points.
 */
export function resolveSpatialSinkProbeV0() {
  const pathname = typeof window !== "undefined" ? String(window.location.pathname || "/") : "/";
  const policy = resolveSpatialSinkRoutePolicyV0();
  const layerCtx = Object.freeze({
    pathname,
    worldSystemMode: readRhizohWorldSystemModeV0(),
    realityMode: "REAL_MAP",
    mapSurfaceActive: true,
    mapTool: "city"
  });

  const executorApi = getCesiumExecutorApiV0();
  const windowCesium =
    typeof window !== "undefined" && window.__CASTLE_CESIUM__ ? window.__CASTLE_CESIUM__ : null;
  const api = executorApi || windowCesium;
  const commandReady = isCesiumExecutorCommandReadyV0(api);
  const hasCommitSurface = typeof api?.commitSpatialNode === "function";
  const worldLayerEnabled = isWorldLayerEnabled();
  const cesiumLayerActive = resolveRhizohCesiumLayerActiveV0(layerCtx);
  const layerMode = resolveRhizohLayerModeV0(layerCtx);
  const mapCommandGate = gateRhizohSpatialCommandV0("bootstrap_viewport", layerCtx);
  const worldSpaceBridge =
    typeof window !== "undefined" ? window.__rhizoh?.worldSpaceBridge ?? null : null;
  const leafletMap =
    typeof window !== "undefined" ? window.__rhizoh?.v11LeafletMap ?? null : null;
  const leafletMapActive = Boolean(leafletMap);
  const executorRegistry =
    typeof window !== "undefined" ? window.__CASTLE_CESIUM_EXECUTOR__ ?? null : null;
  const cesiumRouterRegistry =
    typeof window !== "undefined" ? window.__rhizoh?.cesiumRouter ?? null : null;

  const leafletSinkExpected =
    policy.leafletSinkExpected === true ||
    (policy.worldDomain === "space" && !isRhizohWorldSpaceCesiumEnvEnabledV0());

  let sink = "missing";
  if (!policy.sinkExpected) sink = "route_no_world_sink";
  else if (leafletSinkExpected) {
    if (leafletMapActive) sink = "leaflet";
    else if (worldSpaceBridge?.ok === true || worldSpaceBridge?.hydrated === true) sink = "leaflet_deferred";
    else sink = "leaflet_unmounted";
  } else if (commandReady && hasCommitSurface) sink = "cesium";
  else if (hasCommitSurface || api) sink = "cesium_deferred";
  else if (!worldLayerEnabled) sink = "world_layer_disabled";
  else if (!cesiumLayerActive) sink = "world_layer_unmounted";
  else if (!mapCommandGate.allowed) sink = "layer_gate_blocked";
  else if (!policy.engineReady) sink = "engine_deferred";

  return Object.freeze({
    schema: SPATIAL_WORLD_SINK_PROBE_SCHEMA_V0,
    atMs: Date.now(),
    sink,
    commandReady,
    hasCommitSurface,
    hasExecutorApi: Boolean(api),
    hasWindowCesium: Boolean(windowCesium),
    hasExecutorRegistry: Boolean(executorRegistry),
    hasCesiumRouterRegistry: Boolean(cesiumRouterRegistry),
    worldLayerEnabled,
    cesiumLayerActive,
    layerMode,
    layerGateAllowed: mapCommandGate.allowed,
    layerGateReason: mapCommandGate.reason,
    worldSpaceBridgeOk: worldSpaceBridge?.ok === true || worldSpaceBridge?.hydrated === true,
    leafletMapActive,
    leafletSinkExpected,
    pathname,
    policy
  });
}

/**
 * Publish global observability registries for console probing.
 */
export function publishSpatialSinkRegistriesV0(extra = {}) {
  if (typeof window === "undefined") return null;
  const probe = resolveSpatialSinkProbeV0();
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.worldLayer = Object.freeze({
    schema: "castle.rhizoh.world_layer.registry.v0",
    enabled: probe.worldLayerEnabled,
    cesiumLayerActive: probe.cesiumLayerActive,
    layerMode: probe.layerMode,
    layerGateAllowed: probe.layerGateAllowed,
    layerGateReason: probe.layerGateReason,
    commandReady: probe.commandReady,
    hasCommitSurface: probe.hasCommitSurface,
    sink: probe.sink,
  });
  window.__rhizoh.spatialSinkProbe = Object.freeze({ ...probe, ...extra });
  window.__rhizoh.spatialSinkRoutePolicy = probe.policy;
  publishRhizohSpatialModeV0({ sink: probe.sink });
  return probe;
}
