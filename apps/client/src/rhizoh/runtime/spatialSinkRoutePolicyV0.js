/**
 * Spatial sink route policy — when world commit surface is expected vs deferred.
 * RESEARCH-ONLY observability; does not grant execution authority.
 *
 * Ingress (legal_preamble, language, cohort) and T0 live shell do not mount
 * Cesium commit surface — SPATIAL_SINK_MISSING is misleading there.
 */

import { resolveIngressRouteV0 } from "../ingress/ingress_router.js";
import { isRhizohSpatialProductShellEnabled } from "./castleWorldLayerGateV0.js";
import { isRhizohWorldSpaceCesiumEnvEnabledV0 } from "./rhizohLayerContextV0.js";
import { publishRhizohSpatialModeV0 } from "./rhizohSpatialModeV0.js";
import {
  isRhizohT0LivePathV0,
  resolveWorldDomainFromPathV0
} from "./rhizohWorldDomainRoutesV0.js";

export const SPATIAL_SINK_ROUTE_POLICY_SCHEMA_V0 = "castle.rhizoh.spatial_sink_route_policy.v0";
export const SPATIAL_SINK_ROUTE_NO_WORLD_CODE_V0 = "ROUTE_NO_WORLD_SINK";
export const SPATIAL_SINK_ENGINE_DEFERRED_CODE_V0 = "SINK_ENGINE_DEFERRED";
export const CASTLE_APP_ENGINE_READY_EVENT_V0 = "castle:app-engine-ready-v0";
export const RHIZOH_INGRESS_ROUTE_EVENT_V0 = "rhizoh:ingress-route-v0";

const INGRESS_NO_SINK_ROUTES_V0 = new Set([
  "legal_preamble",
  "language",
  "cohort",
  "hold",
  "closed_admission_hold",
  "error"
]);

/**
 * @returns {string}
 */
export function resolveIngressRouteLabelV0() {
  if (typeof window === "undefined") return "unknown";
  const phase = String(window.__rhizoh_ingress_phase || "").trim();
  if (phase) return phase;
  const fromBoot = String(window.__rhizoh_boot_context?.route || "").trim();
  if (fromBoot) return fromBoot;
  const fromIngress = String(window.__rhizoh_ingress_route || "").trim();
  if (fromIngress) return fromIngress;
  try {
    return String(resolveIngressRouteV0().route || "app");
  } catch {
    return "app";
  }
}

/**
 * @returns {boolean}
 */
export function isCastleAppEngineReadyV0() {
  if (typeof window === "undefined") return false;
  return window.__rhizoh?.appEngineReady === true;
}

/**
 * Mark Apex engine boot complete — idempotent.
 * @param {string} [source]
 * @returns {boolean} true on first mark; false when already ready
 */
export function markCastleAppEngineReadyV0(source = "app.engine.ready") {
  if (typeof window === "undefined") return false;
  window.__rhizoh = window.__rhizoh || {};
  if (window.__rhizoh.appEngineReady === true) return false;
  const atMs = Date.now();
  window.__rhizoh.appEngineReady = true;
  window.__rhizoh.appEngineReadyAtMs = atMs;
  window.dispatchEvent(
    new CustomEvent(CASTLE_APP_ENGINE_READY_EVENT_V0, {
      detail: Object.freeze({ source, atMs })
    })
  );
  try {
    publishRhizohSpatialModeV0();
  } catch {
    /* spatial mode optional in tests */
  }
  return true;
}

/** Reset engine-ready latch on Apex teardown (route unmount). */
export function releaseCastleAppEngineReadyV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.appEngineReady = false;
  delete window.__rhizoh.appEngineReadyAtMs;
}

/**
 * Publish ingress route for spatial sink policy + route-transition retries.
 * @param {string} route
 * @param {Record<string, unknown>} [extra]
 */
export function publishIngressRouteV0(route, extra = {}) {
  if (typeof window === "undefined") return;
  const label = String(route || "").trim() || "app";
  window.__rhizoh_ingress_route = label;
  window.__rhizoh_ingress_phase = label;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.ingressRoute = label;
  window.dispatchEvent(
    new CustomEvent(RHIZOH_INGRESS_ROUTE_EVENT_V0, {
      detail: Object.freeze({ route: label, ...extra, atMs: Date.now() })
    })
  );
}

/**
 * Resolve whether a Cesium/world commit sink should exist on this route.
 */
export function resolveSpatialSinkRoutePolicyV0() {
  const pathname = typeof window !== "undefined" ? String(window.location.pathname || "/") : "/";
  const ingressRoute = resolveIngressRouteLabelV0();
  const onIngress = INGRESS_NO_SINK_ROUTES_V0.has(ingressRoute);
  const worldDomain = resolveWorldDomainFromPathV0(pathname);
  const spatialShell = isRhizohSpatialProductShellEnabled();
  const t0Live = isRhizohT0LivePathV0(pathname) && !spatialShell;
  const engineReady = isCastleAppEngineReadyV0();

  let sinkExpected = false;
  let reason = "unknown";

  if (onIngress) {
    reason = "ingress_no_world_shell";
  } else if (worldDomain === "space" || spatialShell) {
    sinkExpected = true;
    reason = worldDomain ? "world_space_route" : "spatial_product_shell";
  } else if (t0Live) {
    reason = "t0_live_no_commit_surface";
  } else if (worldDomain) {
    reason = "world_domain_no_map_sink";
  } else {
    reason = "app_shell_deferred";
  }

  const drainAllowed = !onIngress;
  const worldSpaceRoute = worldDomain === "space";
  const cesiumEnvEnabled = isRhizohWorldSpaceCesiumEnvEnabledV0();
  const leafletSinkExpected = worldSpaceRoute && !spatialShell && !cesiumEnvEnabled;
  const cesiumSinkExpected =
    spatialShell || (worldSpaceRoute && cesiumEnvEnabled);
  const warnOnMissing = cesiumSinkExpected && engineReady;

  let deferCode = null;
  if (onIngress || t0Live || !sinkExpected) {
    deferCode = SPATIAL_SINK_ROUTE_NO_WORLD_CODE_V0;
  } else if (sinkExpected && !engineReady) {
    deferCode = SPATIAL_SINK_ENGINE_DEFERRED_CODE_V0;
  }

  return Object.freeze({
    schema: SPATIAL_SINK_ROUTE_POLICY_SCHEMA_V0,
    ingressRoute,
    pathname,
    sinkExpected,
    drainAllowed,
    warnOnMissing,
    engineReady,
    spatialShell,
    worldDomain,
    t0Live,
    onIngress,
    reason,
    deferCode,
    leafletSinkExpected,
    cesiumSinkExpected,
    cesiumEnvEnabled,
    atMs: Date.now()
  });
}
