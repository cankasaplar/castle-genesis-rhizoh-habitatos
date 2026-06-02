/**
 * T0 first official match — production identity surface (no debug / lab chrome).
 * @see docs/RHIZOH_CEOL_V0.md
 * @see docs/SURFACE_REDUCTION_PASS_LIVE_V0.md
 */

import { isRhizohProductSurfaceDrawerOpenV0 } from "./rhizohProductChromePanelsV0.js";

/** Bottom product drawer (`RhizohProductSurfaceDrawerV0`) approximate height reserve. */
export const RHIZOH_PRODUCT_SURFACE_DRAWER_H_REM_V0 = 13.5;

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

/** Product shell bar (`UnifiedProductShellBar`) fixed height. */
export const RHIZOH_PRODUCT_SHELL_BAR_H_REM_V0 = 3.35;

/** @deprecated separate toggle strip removed — bottom nav toggles panels. */
export const RHIZOH_CHROME_TOGGLE_STRIP_H_REM_V0 = 0;

/**
 * Chat dock `bottom` offset — product bar + optional surface drawer.
 * @param {{ drawerOpen?: boolean }} [opts]
 */
export function resolveRhizohT0ChatBottomCssV0(opts = {}) {
  const drawerOpen =
    opts.drawerOpen !== undefined ? opts.drawerOpen === true : isRhizohProductSurfaceDrawerOpenV0();
  const drawerRem = drawerOpen ? RHIZOH_PRODUCT_SURFACE_DRAWER_H_REM_V0 : 0;
  return `calc(${RHIZOH_PRODUCT_SHELL_BAR_H_REM_V0}rem + ${drawerRem}rem + env(safe-area-inset-bottom, 0px))`;
}

/** Capability wheel — product interaction hub (viewport center, not chat stack). */
export function resolveRhizohT0CapabilityHaloLayoutV0() {
  return Object.freeze({
    position: "fixed",
    left: "50%",
    top: "clamp(36vh, 44%, 50vh)",
    bottom: "auto",
    transform: "translate(-50%, -50%)",
    zIndex: 68
  });
}
