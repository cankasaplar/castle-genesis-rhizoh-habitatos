/**
 * CORE-ELIGIBLE — Location seed (v0): route-independent locale + IANA timezone basis.
 *
 * **Not authority:** seed informs world instance projection; it does not advance `realityEpoch`.
 *
 * @see worldInstanceFromLocationSeedV0.js
 * @see docs/RHIZOH_WORLD_MESH_MENTAL_MODEL_V1.0.md
 */

export const LOCATION_SEED_SCHEMA_V0 = "castle.rhizoh.location_seed.v0";

/**
 * @returns {{
 *   schema: string,
 *   timeZone: string,
 *   locale: string,
 *   seedBasis: string,
 *   routeIndependent: true
 * }}
 */
export function resolveLocationSeedV0() {
  if (typeof window === "undefined") {
    return Object.freeze({
      schema: LOCATION_SEED_SCHEMA_V0,
      timeZone: "UTC",
      locale: "und",
      seedBasis: "ssr_placeholder",
      routeIndependent: true
    });
  }

  let timeZone = "UTC";
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    timeZone = "UTC";
  }
  const locale = String(typeof navigator !== "undefined" ? navigator.language || "und" : "und").slice(0, 24);

  return Object.freeze({
    schema: LOCATION_SEED_SCHEMA_V0,
    timeZone,
    locale,
    seedBasis: "tz_locale",
    routeIndependent: true
  });
}
