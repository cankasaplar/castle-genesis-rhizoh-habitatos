/**
 * Rhizoh Geometry Layer — pattern family registry (V0).
 * RESEARCH-ONLY: shape taxonomy, not domain semantics.
 */

export const RHIZOH_GEOMETRY_PATTERN_FAMILY_V0 = Object.freeze({
  ENCLOSURE: "enclosure",
  JUMP: "jump",
  CLUSTER: "cluster"
});

export const RHIZOH_GEOMETRY_PATTERN_FAMILIES_V0 = Object.freeze(
  Object.values(RHIZOH_GEOMETRY_PATTERN_FAMILY_V0)
);

/**
 * @param {string} raw
 */
export function isRhizohGeometryPatternFamilyV0(raw) {
  return RHIZOH_GEOMETRY_PATTERN_FAMILIES_V0.includes(String(raw || ""));
}
