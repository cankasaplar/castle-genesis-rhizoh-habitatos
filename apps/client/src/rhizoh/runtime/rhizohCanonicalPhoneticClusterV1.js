/**
 * Lightweight phonetic entity clustering — Rhizoh brand surface collapse (Phase 3).
 */

export const RHIZOH_ENTITY_CANONICAL_V1 = "rhizoh";

const ENTITY_CLUSTER_EXACT_V1 = new Set([
  "rhizoh",
  "rizo",
  "rezo",
  "resol",
  "erizo",
  "evizo",
  "eriso",
  "rhizo",
  "riso",
  "rizoh",
  "ryzo",
  "riseoh",
  "rizohh"
]);

/**
 * Consonant skeleton for fuzzy entity match (no embeddings).
 * @param {string} token
 */
export function phoneticEntitySkeletonV1(token) {
  const t = String(token || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z]/g, "");
  if (!t) return "";
  return t[0] + t.slice(1).replace(/[aeiou]/g, "");
}

/**
 * @param {string} token
 * @returns {string | null} canonical entity id or null
 */
export function collapseEntityPhoneticTokenV1(token) {
  const t = String(token || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z]/g, "")
    .trim();
  if (!t) return null;
  if (ENTITY_CLUSTER_EXACT_V1.has(t)) return RHIZOH_ENTITY_CANONICAL_V1;

  if (t.length >= 3 && t.length <= 10 && t.startsWith("r")) {
    const sk = phoneticEntitySkeletonV1(t);
    if (/^r(z|zh|s|sl|zo|so|h|hz)/.test(sk) || sk === "rzh" || sk.startsWith("rzh")) {
      return RHIZOH_ENTITY_CANONICAL_V1;
    }
    if (t.startsWith("rez") || t.startsWith("riz") || t.startsWith("rhiz")) {
      return RHIZOH_ENTITY_CANONICAL_V1;
    }
  }
  return null;
}
