/**
 * Opt-in gate for Sprint B WAL geometry ingress (mesh → seal candidate, no direct epoch).
 *
 * Env: `VITE_WAL_GEOMETRY_INGRESS=1`
 */

export const WAL_WORLD_AUTHORITY_GATE_SCHEMA_V0 = "castle.rhizoh.wal_world_authority_gate.v0";

/**
 * @returns {boolean}
 */
export function isWalGeometryIngressEnabledV0() {
  if (typeof import.meta === "undefined" || !import.meta.env) return false;
  return import.meta.env.VITE_WAL_GEOMETRY_INGRESS === "1";
}
