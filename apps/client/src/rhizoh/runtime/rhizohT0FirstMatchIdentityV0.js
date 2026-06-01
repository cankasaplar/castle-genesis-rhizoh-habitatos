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
