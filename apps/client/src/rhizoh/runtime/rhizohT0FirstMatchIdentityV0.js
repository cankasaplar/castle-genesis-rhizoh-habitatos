/**
 * T0 first official match — production identity surface (no debug / lab chrome).
 * @see docs/RHIZOH_CEOL_V0.md
 * @see docs/SURFACE_REDUCTION_PASS_LIVE_V0.md
 */

/**
 * Visible in first-match mode: CEOL + continuity rail, anchor/intent, chat, map, studio shell.
 * Hidden: cognition debug, advanced panels, observatory links, swarm telemetry copy.
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

/**
 * Chat dock `bottom` offset — clears continuity rail + product bar.
 * @param {{ compactRail?: boolean }} [opts]
 */
export function resolveRhizohT0ChatBottomCssV0(opts = {}) {
  const railRem = opts.compactRail !== false && isRhizohT0FirstMatchIdentityV0() ? 5.75 : 8.75;
  return `calc(${RHIZOH_PRODUCT_SHELL_BAR_H_REM_V0}rem + ${railRem}rem + env(safe-area-inset-bottom, 0px))`;
}
