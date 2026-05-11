/**
 * ECER-ADV-META-1.1 — axis-based adversarial completeness (normative hook).
 * @see docs/ECER_ADVERSARIAL_META_ADV_1_1.md §2–3
 *
 * ADV-1.1 criterion: every DIVERGENCE_CLASS must have ≥1 scenario each on
 * WITNESS, AUTHORITY, and EPOCH axes (generator output / CI matrix).
 */

import { DIVERGENCE_CLASS } from "./classifyDivergence.mjs";

export const ADVERSARIAL_COMPLETENESS_VERSION = "ECER_ADV_META_1_1";

/** Perturbation axes — coverage is per (divergenceClass × axis). */
export const ADVERSARIAL_AXIS = Object.freeze({
  WITNESS: "ADV_AXIS_WITNESS",
  AUTHORITY: "ADV_AXIS_AUTHORITY",
  EPOCH: "ADV_AXIS_EPOCH"
});

/** Ordered D1 surface — generator matrices should use this column order. */
export const DIVERGENCE_CLASS_ORDER = Object.freeze(
  /** @type {readonly string[]} */ (
    Object.values(DIVERGENCE_CLASS)
  )
);

/** @type {readonly string[]} */
export const ADVERSARIAL_AXIS_ORDER = Object.freeze([
  ADVERSARIAL_AXIS.WITNESS,
  ADVERSARIAL_AXIS.AUTHORITY,
  ADVERSARIAL_AXIS.EPOCH
]);

/**
 * Empty completeness matrix — all cells false until meta-generator fills them.
 * @returns {Record<string, Record<string, boolean>>}
 */
export function emptyCompletenessMatrix() {
  /** @type {Record<string, Record<string, boolean>>} */
  const m = {};
  for (const d of DIVERGENCE_CLASS_ORDER) {
    m[d] = {};
    for (const a of ADVERSARIAL_AXIS_ORDER) {
      m[d][a] = false;
    }
  }
  return m;
}

/**
 * @param {Record<string, Record<string, boolean>>} matrix
 * @returns {boolean}
 */
export function isAxisComplete(matrix) {
  for (const d of DIVERGENCE_CLASS_ORDER) {
    const row = matrix[d];
    if (!row) {
      return false;
    }
    for (const a of ADVERSARIAL_AXIS_ORDER) {
      if (row[a] !== true) {
        return false;
      }
    }
  }
  return true;
}

/**
 * @param {Record<string, Record<string, boolean>>} matrix
 * @returns {Array<{ divergenceClass: string; axis: string }>}
 */
export function listMissingCells(matrix) {
  /** @type {Array<{ divergenceClass: string; axis: string }>} */
  const out = [];
  for (const d of DIVERGENCE_CLASS_ORDER) {
    const row = matrix[d];
    if (!row) {
      for (const a of ADVERSARIAL_AXIS_ORDER) {
        out.push({ divergenceClass: d, axis: a });
      }
      continue;
    }
    for (const a of ADVERSARIAL_AXIS_ORDER) {
      if (row[a] !== true) {
        out.push({ divergenceClass: d, axis: a });
      }
    }
  }
  return out;
}

/**
 * @param {Record<string, Record<string, boolean>>} base
 * @param {Record<string, Record<string, boolean>>} overlay
 * @returns {Record<string, Record<string, boolean>>}
 */
export function mergeCoverageMatrices(base, overlay) {
  const m = emptyCompletenessMatrix();
  for (const d of DIVERGENCE_CLASS_ORDER) {
    for (const a of ADVERSARIAL_AXIS_ORDER) {
      m[d][a] = Boolean(base[d]?.[a]) || Boolean(overlay[d]?.[a]);
    }
  }
  return m;
}
