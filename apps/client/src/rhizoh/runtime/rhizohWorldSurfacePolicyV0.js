/**
 * Product WORLD surface policy — GLOBE home, map as sub-layer, no default Istanbul flyTo.
 * @see docs/RHIZOH_WORLD_SURFACE_HIERARCHY_V0.md
 */

import { readUserAnchorV0 } from "./memoryAnchorSystemV0.js";
import { RHIZOH_WORLD_DRAWER_DOMAIN_V0 } from "./rhizohWorldDrawerDomainV0.js";
import { shouldMountRhizohWorldSpaceMapEngineV0 } from "./rhizohLayerContextV0.js";
import {
  RHIZOH_UI_MAP_STRIP_ESTIMATE_REM_V0,
  RHIZOH_UI_MAP_STRIP_EXPANDED_REM_V0,
  RHIZOH_UI_SHELL_BAR_H_REM_V0,
  resolveRhizohWorldSpaceMapOverlayBottomCssV0,
  resolveRhizohWorldSpaceMapStripBottomCssV0,
  resolveRhizohWorldSpaceVoiceDockBottomCssV0
} from "./rhizohUiLayoutResolverV0.js";

export const RHIZOH_WORLD_SURFACE_POLICY_CONTRACT_V0 = "rhizoh-world-surface-policy-v0";

/** Product red line — map/tools live in World drawer · Space; T0 = live scene only. */
export const RHIZOH_RED_LINE_MAP_IS_NOT_WORLD_V0 =
  "Harita Dünya değildir — T0 = GLOBE + swarm + fox + voice + chat; Maps = drawer · Space.";

/**
 * World · Space map stage — /world/space route (Cesium substrate).
 * @param {{ pathname?: string, worldDomain?: string | null }} [ctx]
 * @returns {boolean}
 */
export function isRhizohWorldSpaceMapStageV0(ctx = {}) {
  if (String(ctx.worldDomain || "").toLowerCase() === RHIZOH_WORLD_DRAWER_DOMAIN_V0.SPACE) {
    return true;
  }
  return shouldMountRhizohWorldSpaceMapEngineV0({ pathname: ctx.pathname });
}

/**
 * T0 fox + full chat dock — live home (/), World · Social, World · Modes.
 * @param {{ isWorldDomainActive?: boolean, worldDomain?: string }} [ctx]
 * @returns {boolean}
 */
export function shouldRhizohT0LiveChromeVisibleV0(ctx = {}) {
  if (!ctx.isWorldDomainActive) return true;
  return !isRhizohWorldSpaceMapStageV0(ctx);
}

/**
 * Compact voice dock on World · Space — Rhizoh conversation continues on the map stage.
 * @param {{ isWorldDomainActive?: boolean, worldDomain?: string, pathname?: string }} [ctx]
 * @returns {boolean}
 */
export function shouldRhizohWorldSpaceVoiceDockVisibleV0(ctx = {}) {
  if (!ctx.isWorldDomainActive) return false;
  return isRhizohWorldSpaceMapStageV0(ctx);
}

/**
 * Hide T0 continuity chrome (anchor strip, Ayrıntılar) on map stage.
 * @param {{ pathname?: string, worldDomain?: string | null }} [ctx]
 * @returns {boolean}
 */
export function shouldHideT0ContinuityChromeOnWorldSpaceV0(ctx = {}) {
  return isRhizohWorldSpaceMapStageV0(ctx);
}

/** @deprecated use RHIZOH_UI_MAP_STRIP_ESTIMATE_REM_V0 */
export const RHIZOH_WORLD_SPACE_MAP_STRIP_ESTIMATE_REM_V0 = RHIZOH_UI_MAP_STRIP_ESTIMATE_REM_V0;

/** @deprecated use RHIZOH_UI_MAP_STRIP_EXPANDED_REM_V0 */
export const RHIZOH_WORLD_SPACE_MAP_STRIP_EXPANDED_REM_V0 = RHIZOH_UI_MAP_STRIP_EXPANDED_REM_V0;

/** @deprecated use RHIZOH_UI_SHELL_BAR_H_REM_V0 */
export const RHIZOH_PRODUCT_SHELL_BAR_H_REM_V0 = RHIZOH_UI_SHELL_BAR_H_REM_V0;

export {
  resolveRhizohWorldSpaceMapStripBottomCssV0,
  resolveRhizohWorldSpaceVoiceDockBottomCssV0,
  resolveRhizohWorldSpaceMapOverlayBottomCssV0
};

/**
 * Apex procedural REAL_MAP drones — suppressed when Cesium owns World · Space.
 * @param {{ pathname?: string, worldDomain?: string | null }} [ctx]
 * @returns {boolean}
 */
export function shouldUseApexProceduralRealMapV0(ctx = {}) {
  return !isRhizohWorldSpaceMapStageV0(ctx);
}

/** Product shell "Dünya" — abstract globe + swarm (main stage). */
export const RHIZOH_PRODUCT_WORLD_REALITY_V0 = "GLOBE";

/**
 * @param {string} [productSurface]
 * @returns {"GLOBE" | "REAL_MAP"}
 */
export function resolveRhizohProductWorldRealityModeV0(productSurface = "world") {
  if (String(productSurface || "") === "world") return RHIZOH_PRODUCT_WORLD_REALITY_V0;
  return "REAL_MAP";
}

const WORLD_REALITY_BLOCK_SOURCES_V0 = [
  "PRODUCT_SHELL_WORLD",
  "PRODUCT_SHELL_WORLD_MAP",
  "PRODUCT_SHELL_WORLD_RECENTER",
  "PRODUCT_SHELL"
];

/** spatial-main shadow prod — Apex procedural city on T0 home (not Cesium drawer). */
export const RHIZOH_T0_AMBIENT_REALITY_SOURCE_V0 = "SPATIAL_SHADOW_AMBIENT_CITY";

const WORLD_REALITY_ALLOW_SOURCES_V0 = [
  "ROUTE_WORLD_DOMAIN",
  "PRODUCT_SHELL_WORLD_DOMAIN",
  "ROUTE_MAP",
  "MAP_TOOL_EXPLICIT",
  "WORLD_DOMAIN_MAP_STRIP",
  RHIZOH_T0_AMBIENT_REALITY_SOURCE_V0
];

/**
 * spatial-main profile — procedural buildings + drones on T0 `/` (Apex REAL_MAP, not Cesium).
 * @returns {boolean}
 */
export function isRhizohT0AmbientProceduralCityV0() {
  if (typeof import.meta === "undefined" || !import.meta.env) return false;
  const raw = String(import.meta.env.VITE_RHIZOH_T0_AMBIENT_PROCEDURAL_CITY ?? "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "on";
}

/**
 * T0 home reality — GLOBE default; ambient city uses Apex REAL_MAP.
 * @returns {"GLOBE" | "REAL_MAP"}
 */
export function resolveRhizohT0HomeRealityModeV0() {
  return isRhizohT0AmbientProceduralCityV0() ? "REAL_MAP" : RHIZOH_PRODUCT_WORLD_REALITY_V0;
}

/**
 * Globe home overlay (orb + gradient) — hide when ambient procedural city is active.
 * @param {{
 *   cesiumLayerActive?: boolean,
 *   isWorldDomainActive?: boolean,
 *   worldMapTool?: string,
 *   realityMode?: string
 * }} [ctx]
 * @returns {boolean}
 */
export function shouldRhizohT0ShowGlobeHomeOverlayV0(ctx = {}) {
  if (ctx.cesiumLayerActive === true) return false;
  if (ctx.isWorldDomainActive === true) {
    return String(ctx.worldMapTool || "globe") === "globe";
  }
  if (isRhizohT0AmbientProceduralCityV0()) return false;
  if (String(ctx.realityMode || "") === "REAL_MAP") return false;
  return true;
}

/**
 * Enforces red line: product "Dünya" cannot commit REAL_MAP (map tool only).
 * @param {"GLOBE" | "REAL_MAP"} mode
 * @param {{ source?: string, productSurface?: string }} [opts]
 * @returns {"GLOBE" | "REAL_MAP"}
 */
export function coerceRhizohProductRealityModeV0(mode, opts = {}) {
  const next = String(mode || "");
  if (next !== "REAL_MAP") return /** @type {"GLOBE" | "REAL_MAP"} */ (next || RHIZOH_PRODUCT_WORLD_REALITY_V0);
  const source = String(opts.source || "");
  const surface = String(opts.productSurface || "");
  if (WORLD_REALITY_ALLOW_SOURCES_V0.includes(source)) {
    return "REAL_MAP";
  }
  if (surface === "world" && WORLD_REALITY_BLOCK_SOURCES_V0.includes(source)) {
    return RHIZOH_PRODUCT_WORLD_REALITY_V0;
  }
  if (WORLD_REALITY_BLOCK_SOURCES_V0.includes(source)) {
    return RHIZOH_PRODUCT_WORLD_REALITY_V0;
  }
  return "REAL_MAP";
}

/**
 * @param {{ productSurface?: string, realityMode?: string, source?: string }} ctx
 * @returns {boolean}
 */
export function shouldRhizohFlyToIstanbulV0(ctx = {}) {
  const surface = String(ctx.productSurface || "");
  const mode = String(ctx.realityMode || "");
  const source = String(ctx.source || "");
  if (surface === "world") return false;
  if (mode !== "REAL_MAP") return false;
  if (source === "ROUTE_MAP" || source === "PRODUCT_SHELL_HALL") return true;
  if (source.startsWith("PRODUCT_SHELL_") && surface !== "world") return true;
  if (source === "DSL_SPAWN_CASTLE" || source === "LAYER_QUICK") return true;
  if (source === "BROADCAST_PRESENCE") return true;
  return false;
}

/**
 * Returning user has a persisted user anchor (continuity), not first-open empty world.
 * @returns {boolean}
 */
export function hasRhizohReturningUserAnchorV0() {
  try {
    const anchor = readUserAnchorV0();
    return Boolean(anchor && (anchor.thread_id || anchor.label || anchor.primary_label));
  } catch {
    return false;
  }
}

/**
 * @returns {"returning" | "first_time"}
 */
export function resolveRhizohWorldEntryPersonaV0() {
  return hasRhizohReturningUserAnchorV0() ? "returning" : "first_time";
}

/**
 * Capability wheel = map tool only (World drawer · Space tab). Not a T0 live affordance.
 * @param {string} [_productSurface]
 */
export { isRhizohCapabilityWheelVisibleV0, isRhizohMapWheelVisibleV0 } from "./rhizohLayerContextV0.js";

const LANDING_LOCK_SESSION_KEY_V0 = "rhizoh.world.landing_lock.v0";

/**
 * Once per tab: GLOBE home + globe map tool (map stays sub-layer; wheel does not require drawer).
 * @param {{
 *   setRealityMode?: (mode: string, opts?: object) => Promise<unknown>,
 *   flyContext?: { nexusGeo?: object, castles?: object[] },
 *   force?: boolean
 * }} [opts]
 */
export async function applyRhizohWorldLandingLockV0(opts = {}) {
  if (typeof window !== "undefined" && !opts.force) {
    try {
      if (sessionStorage.getItem(LANDING_LOCK_SESSION_KEY_V0) === "1") {
        return Object.freeze({ skipped: true, reason: "session_done" });
      }
    } catch {
      /* noop */
    }
  }

  if (isRhizohT0AmbientProceduralCityV0() && opts.setRealityMode) {
    await opts.setRealityMode("REAL_MAP", {
      source: RHIZOH_T0_AMBIENT_REALITY_SOURCE_V0,
      productSurface: "world"
    });
    const { writeRhizohWorldMapToolV0 } = await import("./rhizohWorldMapToolV0.js");
    writeRhizohWorldMapToolV0("city_map");
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(LANDING_LOCK_SESSION_KEY_V0, "1");
      } catch {
        /* noop */
      }
    }
    return Object.freeze({
      skipped: false,
      persona: resolveRhizohWorldEntryPersonaV0(),
      ambientCity: true,
      realityMode: "REAL_MAP"
    });
  }

  const persona = resolveRhizohWorldEntryPersonaV0();
  const { applyRhizohWorldMapToolV0, readRhizohWorldMapToolV0 } = await import("./rhizohWorldMapToolV0.js");
  const tool = readRhizohWorldMapToolV0();
  const wantGlobe = persona === "first_time" || tool === "globe";

  const result = await applyRhizohWorldMapToolV0(wantGlobe ? "globe" : tool, {
    setRealityMode: opts.setRealityMode,
    flyContext: opts.flyContext,
    source: "WORLD_LANDING_LOCK"
  });

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(LANDING_LOCK_SESSION_KEY_V0, "1");
    } catch {
      /* noop */
    }
  }

  return Object.freeze({ skipped: false, persona, ...result });
}
