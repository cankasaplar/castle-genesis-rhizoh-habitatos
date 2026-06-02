/**
 * Product WORLD surface policy — GLOBE home, map as sub-layer, no default Istanbul flyTo.
 * @see docs/RHIZOH_WORLD_SURFACE_HIERARCHY_V0.md
 */

import { readUserAnchorV0 } from "./memoryAnchorSystemV0.js";

export const RHIZOH_WORLD_SURFACE_POLICY_CONTRACT_V0 = "rhizoh-world-surface-policy-v0";

/** Product red line (locked): map is a tool inside WORLD, never WORLD itself. */
export const RHIZOH_RED_LINE_MAP_IS_NOT_WORLD_V0 =
  "Harita Dünya değildir — Dünya = GLOBE + swarm + anchor + continuity + wheel + voice + chat.";

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
 * Capability wheel = WORLD stage affordance (not tied to bottom drawer open state).
 * @param {string} [productSurface]
 */
export function isRhizohCapabilityWheelVisibleV0(productSurface = "world") {
  return String(productSurface || "") === "world";
}

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
