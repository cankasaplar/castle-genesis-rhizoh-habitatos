/**
 * Verified (𝒟 × axis) cells — populated as scenarios are implemented + asserted.
 * @see docs/ECER_ADVERSARIAL_META_ADV_1_1.md §2
 */

import { DIVERGENCE_CLASS } from "../../classifyDivergence.mjs";
import {
  ADVERSARIAL_AXIS,
  emptyCompletenessMatrix,
  mergeCoverageMatrices
} from "../../ecerAdversarialCompleteness.mjs";
import { ECER_ADVERSARIAL_SCENARIO } from "./scenarios.mjs";

/**
 * @typedef {{ scenarioId: string; divergenceClass: string; axis: string; note?: string }} CoverageEntry
 */

/** @type {readonly CoverageEntry[]} */
export const VERIFIED_COVERAGE = Object.freeze([
  {
    scenarioId: ECER_ADVERSARIAL_SCENARIO.DUAL_READ_CONFLICT,
    divergenceClass: DIVERGENCE_CLASS.EPOCH_FORK,
    axis: ADVERSARIAL_AXIS.EPOCH,
    note: "dual-read witness missing under CUT_OVER pressure"
  },
  {
    scenarioId: ECER_ADVERSARIAL_SCENARIO.AUTHORITY_SPLIT_TEMPORAL,
    divergenceClass: DIVERGENCE_CLASS.W_EXCLUSIVE,
    axis: ADVERSARIAL_AXIS.AUTHORITY,
    note: "bundle epoch vs context authority epoch"
  },
  {
    scenarioId: ECER_ADVERSARIAL_SCENARIO.MALICIOUS_BUNDLE_INJECTION,
    divergenceClass: DIVERGENCE_CLASS.PI_SPLIT_INCOMPARABLE,
    axis: ADVERSARIAL_AXIS.AUTHORITY,
    note: "malformed / injected bundle shape"
  },
  {
    scenarioId: ECER_ADVERSARIAL_SCENARIO.EPOCH_BACKWARD_REPLAY,
    divergenceClass: DIVERGENCE_CLASS.PI_SPLIT_NON_BREAKING,
    axis: ADVERSARIAL_AXIS.EPOCH,
    note: "trace E0 vs authority E1 with NON_BREAKING bridge"
  },
  {
    scenarioId: ECER_ADVERSARIAL_SCENARIO.WITNESS_COLLAPSE,
    divergenceClass: DIVERGENCE_CLASS.W_VOID,
    axis: ADVERSARIAL_AXIS.WITNESS,
    note: "empty witnessSet → RBL_ERR_WITNESSLESS"
  }
]);

/**
 * @param {readonly CoverageEntry[]} [entries]
 * @returns {Record<string, Record<string, boolean>>}
 */
export function matrixFromVerifiedEntries(entries = VERIFIED_COVERAGE) {
  const m = emptyCompletenessMatrix();
  for (const e of entries) {
    if (m[e.divergenceClass] && e.axis in m[e.divergenceClass]) {
      m[e.divergenceClass][e.axis] = true;
    }
  }
  return m;
}

/**
 * Optional user / CI overlay (e.g. generated stubs promoted to verified).
 * @param {Record<string, Record<string, boolean>> | undefined} overlay
 */
export function verifiedCoverageMatrix(overlay) {
  const base = matrixFromVerifiedEntries();
  if (!overlay) {
    return base;
  }
  return mergeCoverageMatrices(base, overlay);
}
