/**
 * PR-1 — Debug layer umbrella (`VITE_DEBUG`) + granular `VITE_RHIZOH_*_DEBUG` flags.
 * Prod: lab flags need umbrella + granular; go-live membrane flags use allowlist (§ Go-Live V1).
 * Dev: lab overlay flags → granular || umbrella; membrane / research node flags → granular only.
 *
 * @see docs/SURFACE_REDUCTION_PASS_LIVE_V0.md
 * @see docs/RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md §1
 */

/** Prod-safe without VITE_DEBUG=1 (ESM membrane). */
export const CASTLE_PRODUCTION_MEMBRANE_FLAGS_V0 = Object.freeze([
  "VITE_SOVEREIGN_NODE_ONBOARDING",
  "VITE_SATELLITE_NODE_REGISTRY_V0",
  "VITE_REAL_LAYER_WEATHER_INGRESS",
  "VITE_REAL_LAYER_TRAFFIC_INGRESS"
]);

/**
 * @param {string} viteEnvName e.g. `VITE_RHIZOH_PERCEPTION_DEBUG`
 * @returns {boolean}
 */
export function isCastleDebugGranularFlagEnabled(viteEnvName) {
  if (typeof import.meta === "undefined" || !import.meta.env) return false;
  const env = import.meta.env;
  const granular = String(env[viteEnvName] || "").trim() === "1";
  const umbrella = String(env.VITE_DEBUG || "").trim() === "1";
  if (env.DEV) {
    if (CASTLE_PRODUCTION_MEMBRANE_FLAGS_V0.includes(viteEnvName)) {
      return granular;
    }
    return granular || umbrella;
  }
  if (granular && CASTLE_PRODUCTION_MEMBRANE_FLAGS_V0.includes(viteEnvName)) {
    return true;
  }
  return umbrella && granular;
}