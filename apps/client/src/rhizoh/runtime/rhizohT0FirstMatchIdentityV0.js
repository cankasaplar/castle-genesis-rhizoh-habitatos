/**
 * T0 first official match — production identity surface (no debug / lab chrome).
 * @see docs/RHIZOH_CEOL_V0.md
 * @see docs/SURFACE_REDUCTION_PASS_LIVE_V0.md
 */

import { isRhizohProductSurfaceDrawerOpenV0 } from "./rhizohProductChromePanelsV0.js";
import {
  RHIZOH_UI_CHROME_TOGGLE_STRIP_H_REM_V0,
  RHIZOH_UI_PRODUCT_DRAWER_H_REM_V0,
  RHIZOH_UI_SHELL_BAR_H_REM_V0,
  resolveRhizohT0CapabilityHaloLayoutV0,
  resolveRhizohT0ChatBottomCssV0 as resolveT0ChatBottomFromLayoutV0
} from "./rhizohUiLayoutResolverV0.js";

/** @deprecated use RHIZOH_UI_PRODUCT_DRAWER_H_REM_V0 */
export const RHIZOH_PRODUCT_SURFACE_DRAWER_H_REM_V0 = RHIZOH_UI_PRODUCT_DRAWER_H_REM_V0;

/**
 * Visible in first-match mode: CEOL + continuity rail, GLOBE/swarm world, anchor/intent, chat, bottom drawers.
 * Hidden: cognition debug, advanced panels, observatory links, verbose lab copy (not core swarm visuals).
 *
 * @returns {boolean}
 */
export function isRhizohT0FirstMatchIdentityV0() {
  if (typeof import.meta === "undefined" || !import.meta.env) return false;
  const env = import.meta.env;
  const raw = String(env.VITE_RHIZOH_T0_FIRST_MATCH ?? "").trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "off") return false;
  if (raw === "1" || raw === "true" || raw === "on") return true;
  if (env.DEV) return false;
  return String(env.VITE_DEBUG ?? "").trim() !== "1";
}

/** @deprecated use RHIZOH_UI_SHELL_BAR_H_REM_V0 */
export const RHIZOH_PRODUCT_SHELL_BAR_H_REM_V0 = RHIZOH_UI_SHELL_BAR_H_REM_V0;

/** @deprecated use RHIZOH_UI_CHROME_TOGGLE_STRIP_H_REM_V0 */
export const RHIZOH_CHROME_TOGGLE_STRIP_H_REM_V0 = RHIZOH_UI_CHROME_TOGGLE_STRIP_H_REM_V0;

/**
 * Chat dock `bottom` offset — product bar + optional surface drawer.
 * @param {{ drawerOpen?: boolean }} [opts]
 */
export function resolveRhizohT0ChatBottomCssV0(opts = {}) {
  const drawerOpen =
    opts.drawerOpen !== undefined ? opts.drawerOpen === true : isRhizohProductSurfaceDrawerOpenV0();
  return resolveT0ChatBottomFromLayoutV0({ drawerOpen });
}

export { resolveRhizohT0CapabilityHaloLayoutV0 };
