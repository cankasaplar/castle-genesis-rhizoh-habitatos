/**
 * Layer context routing — T0 live vs World domain pages (Space · Social · Modes).
 * Wheel = contextual control on world domain pages only; never on T0.
 */

import { RHIZOH_WORLD_DRAWER_DOMAIN_V0, readRhizohWorldDrawerDomainV0 } from "./rhizohWorldDrawerDomainV0.js";
import {
  RHIZOH_WORLD_SYSTEM_MODE_V0,
  readRhizohWorldSystemModeV0
} from "./rhizohWorldSystemModeV0.js";
import { resolveWorldDomainFromPathV0 } from "./rhizohWorldDomainRoutesV0.js";
import { isRhizohProductMapExecutionEnabledV0 } from "../../reality/realityEngineSurface.js";

export const RHIZOH_LAYER_MODE_V0 = Object.freeze({
  T0_LIVE: "t0_live",
  MAPS_SPACE: "maps_space",
  MAPS_SOCIAL: "maps_social",
  MODE_ROBOTICS: "mode_robotics",
  MODE_SPIRAL: "mode_spiral",
  MODE_DREAM: "mode_dream",
  MODE_SIMULATION: "mode_simulation"
});

export const RHIZOH_LAYER_CONSTITUTION_V0 = Object.freeze({
  schema: "rhizoh.layer.constitution.v1.2",
  t0Ephemeral: true,
  t0NoWheel: true,
  mapsNeverControlsT0: true,
  spatialRenderOnly: true,
  apisViaMapsOnly: true,
  modIsolation: true
});

/**
 * @param {string} [pathname]
 * @returns {boolean}
 */
export function isRhizohWorldDomainActiveV0(pathname) {
  if (typeof window !== "undefined" && !pathname) {
    return resolveWorldDomainFromPathV0(window.location.pathname) != null;
  }
  return resolveWorldDomainFromPathV0(pathname) != null;
}

/**
 * @param {{ pathname?: string, worldDomain?: string | null }} [ctx]
 * @returns {"space" | "social" | "modes" | null}
 */
export function resolveActiveWorldDomainV0(ctx = {}) {
  if (ctx.worldDomain != null) {
    const d = String(ctx.worldDomain);
    if (d === RHIZOH_WORLD_DRAWER_DOMAIN_V0.SOCIAL) return RHIZOH_WORLD_DRAWER_DOMAIN_V0.SOCIAL;
    if (d === RHIZOH_WORLD_DRAWER_DOMAIN_V0.MODES) return RHIZOH_WORLD_DRAWER_DOMAIN_V0.MODES;
    if (d === RHIZOH_WORLD_DRAWER_DOMAIN_V0.SPACE) return RHIZOH_WORLD_DRAWER_DOMAIN_V0.SPACE;
    return null;
  }
  const fromPath =
    ctx.pathname ??
    (typeof window !== "undefined" ? window.location.pathname : "");
  return resolveWorldDomainFromPathV0(fromPath);
}

/**
 * @param {{ pathname?: string, worldDomain?: string | null, worldSystemMode?: string }} [ctx]
 * @returns {string}
 */
export function resolveRhizohLayerModeV0(ctx = {}) {
  const domain = resolveActiveWorldDomainV0(ctx);
  if (!domain) return RHIZOH_LAYER_MODE_V0.T0_LIVE;
  if (domain === RHIZOH_WORLD_DRAWER_DOMAIN_V0.SOCIAL) return RHIZOH_LAYER_MODE_V0.MAPS_SOCIAL;
  if (domain === RHIZOH_WORLD_DRAWER_DOMAIN_V0.MODES) {
    return resolveModesLayerModeV0(ctx.worldSystemMode);
  }
  return RHIZOH_LAYER_MODE_V0.MAPS_SPACE;
}

/**
 * Context wheel — visible only on world domain pages (never T0 live).
 * @param {{ pathname?: string, worldDomain?: string | null }} [ctx]
 */
export function isRhizohContextWheelVisibleV0(ctx = {}) {
  return resolveActiveWorldDomainV0(ctx) != null;
}

/**
 * @param {string} systemMode
 * @returns {string}
 */
function resolveModesLayerModeV0(systemMode) {
  const m = String(systemMode || readRhizohWorldSystemModeV0());
  if (m === RHIZOH_WORLD_SYSTEM_MODE_V0.SPIRAL) return RHIZOH_LAYER_MODE_V0.MODE_SPIRAL;
  if (m === RHIZOH_WORLD_SYSTEM_MODE_V0.DREAM) return RHIZOH_LAYER_MODE_V0.MODE_DREAM;
  if (m === RHIZOH_WORLD_SYSTEM_MODE_V0.SIMULATION) return RHIZOH_LAYER_MODE_V0.MODE_SIMULATION;
  return RHIZOH_LAYER_MODE_V0.MODE_ROBOTICS;
}

/**
 * Map manipulation wheel — Maps · Space page only.
 * @param {{ pathname?: string, worldDomain?: string | null }} [ctx]
 */
export function isRhizohMapWheelVisibleV0(ctx = {}) {
  return resolveRhizohLayerModeV0(ctx) === RHIZOH_LAYER_MODE_V0.MAPS_SPACE;
}

/**
 * @deprecated use isRhizohContextWheelVisibleV0 / isRhizohMapWheelVisibleV0
 */
export function isRhizohCapabilityWheelVisibleV0(_productSurface = "world") {
  return isRhizohContextWheelVisibleV0();
}

/**
 * @param {{ worldDrawerOpen?: boolean, worldDrawerDomain?: string }} [ctx]
 */
export function isRhizohMapToolStripVisibleV0(ctx = {}) {
  return isRhizohMapWheelVisibleV0(ctx);
}

/**
 * Whether the Cesium DOM subtree may mount (World · Space route only — not T0 live).
 * @param {{ pathname?: string, worldDomain?: string | null }} [ctx]
 * @returns {boolean}
 */
export function shouldMountRhizohWorldSpaceMapEngineV0(ctx = {}) {
  return resolveRhizohLayerModeV0(ctx) === RHIZOH_LAYER_MODE_V0.MAPS_SPACE;
}

/**
 * Cesium / REAL_MAP surface — only when exploring maps in space drawer.
 * @param {{ worldDrawerOpen?: boolean, worldDrawerDomain?: string, mapSurfaceActive?: boolean }} [ctx]
 */
export function isRhizohSpatialMapEngineActiveV0(ctx = {}) {
  if (!shouldMountRhizohWorldSpaceMapEngineV0(ctx)) return false;
  return ctx.mapSurfaceActive !== false;
}

/**
 * Whether the full-screen Cesium stack should render (not merely REAL_MAP intent).
 * Blocks map behind product drawers (profile, hall, …) and non-space world tabs.
 * @param {{
 *   mapSurfaceActive?: boolean,
 *   realityMode?: string,
 *   pathname?: string,
 *   worldDomain?: string | null,
 *   mapTool?: string,
 *   openProductDrawerId?: string | null,
 *   detailDrawerOpen?: boolean
 * }} [ctx]
 * @returns {boolean}
 */
/**
 * Dedicated World · Space shell — minimal gate (no T0 drawer/detail blocking).
 * @param {{
 *   mapSurfaceActive?: boolean,
 *   mapTool?: string,
 *   pathname?: string,
 *   worldDomain?: string | null
 * }} [ctx]
 * @returns {boolean}
 */
export function isRhizohWorldSpaceCesiumEnvEnabledV0() {
  try {
    const env = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
    return String(env.VITE_RHIZOH_WORLD_SPACE_CESIUM || "").trim() === "1";
  } catch {
    return false;
  }
}

export function resolveRhizohWorldSpaceCesiumActiveV0(ctx = {}) {
  if (!shouldMountRhizohWorldSpaceMapEngineV0(ctx)) return false;
  if (ctx.mapSurfaceActive === false) return false;
  try {
    const env = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
    if (String(env.VITE_RHIZOH_WORLD_SPACE_CESIUM || "").trim() !== "1") return false;
  } catch {
    return false;
  }
  const tool = String(ctx.mapTool || "city_map").toLowerCase();
  if (tool === "city_map" || tool === "globe" || tool === "satellite" || tool === "streets") return false;
  if (tool === "anchor_map" || tool === "terrain") return true;
  return isRhizohProductMapExecutionEnabledV0() && tool !== "city_map";
}

export function resolveRhizohCesiumLayerActiveV0(ctx = {}) {
  if (shouldMountRhizohWorldSpaceMapEngineV0(ctx)) {
    return resolveRhizohWorldSpaceCesiumActiveV0(ctx);
  }
  if (ctx.detailDrawerOpen) return false;
  if (ctx.openProductDrawerId) return false;
  if (String(ctx.realityMode || "") !== "REAL_MAP") return false;
  if (!ctx.mapSurfaceActive) return false;
  if (!isRhizohSpatialMapEngineActiveV0({ ...ctx, mapSurfaceActive: true })) return false;
  const tool = String(ctx.mapTool || "globe").toLowerCase();
  if (tool === "globe") return false;
  return true;
}

/**
 * @param {{ worldDrawerOpen?: boolean, worldDrawerDomain?: string }} [ctx]
 */
export function isRhizohSocialLayerActiveV0(ctx = {}) {
  return resolveRhizohLayerModeV0(ctx) === RHIZOH_LAYER_MODE_V0.MAPS_SOCIAL;
}

/**
 * @param {{ worldDrawerOpen?: boolean, worldDrawerDomain?: string, worldSystemMode?: string }} [ctx]
 */
export function isRhizohSystemModeLayerActiveV0(ctx = {}) {
  const mode = resolveRhizohLayerModeV0(ctx);
  return (
    mode === RHIZOH_LAYER_MODE_V0.MODE_ROBOTICS ||
    mode === RHIZOH_LAYER_MODE_V0.MODE_SPIRAL ||
    mode === RHIZOH_LAYER_MODE_V0.MODE_DREAM ||
    mode === RHIZOH_LAYER_MODE_V0.MODE_SIMULATION
  );
}

/**
 * @param {string} op
 * @param {{ worldDrawerOpen?: boolean, worldDrawerDomain?: string, worldSystemMode?: string }} [ctx]
 * @returns {{ allowed: boolean, reason: string | null }}
 */
export function gateRhizohSpatialCommandV0(op, ctx = {}) {
  const mode = resolveRhizohLayerModeV0(ctx);
  if (mode === RHIZOH_LAYER_MODE_V0.T0_LIVE) {
    return Object.freeze({ allowed: false, reason: "t0_live_no_map_commands" });
  }
  if (mode === RHIZOH_LAYER_MODE_V0.MAPS_SOCIAL) {
    return Object.freeze({ allowed: false, reason: "social_layer_no_map_commands" });
  }
  if (isRhizohSystemModeLayerActiveV0(ctx)) {
    return Object.freeze({ allowed: false, reason: "system_mode_no_map_commands" });
  }
  if (!op) return Object.freeze({ allowed: false, reason: "missing_op" });
  return Object.freeze({ allowed: true, reason: null });
}
