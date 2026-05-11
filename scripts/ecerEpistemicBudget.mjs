/**
 * LOOP-1.1 — Epistemic Budgeting Layer (EBL) — prefix allocation under caps.
 * ERGS execution constraint; GPF ordering is applied before this slice.
 * @see docs/ECER_ADV_EPISTEMIC_BUDGETING_LAYER_V1_1.md
 */

export const EPISTEMIC_BUDGET_LAYER_VERSION = "ECER_ADV_EBL_1_1";

/** Closed budget dimensions (conceptual; units set by ops policy). */
export const BUDGET_DIMENSION = Object.freeze({
  COMPUTE: "EB_DIM_COMPUTE",
  TRACE_CORPUS: "EB_DIM_TRACE_CORPUS",
  WITNESS_OPS: "EB_DIM_WITNESS_OPS",
  CI_WALL_CLOCK: "EB_DIM_CI_WALL_CLOCK"
});

/**
 * GPF sırasını bozmadan: en fazla `maxItems` gap bu koşumda çalıştırılır.
 * @param {readonly string[]} prioritizedGapIds — GPF çıktısı
 * @param {number} maxItems — β birleşik kesimi için basitleştirilmiş tavan (v0)
 * @returns {{ accepted: string[]; deferred: string[]; ledger: Record<string, unknown> }}
 */
export function allocateEpistemicBudgetPrefix(prioritizedGapIds, maxItems) {
  const cap = Math.max(0, Math.floor(maxItems));
  const accepted = prioritizedGapIds.slice(0, cap);
  const deferred = prioritizedGapIds.slice(cap);
  return {
    accepted,
    deferred,
    ledger: {
      layerVersion: EPISTEMIC_BUDGET_LAYER_VERSION,
      requested: prioritizedGapIds.length,
      acceptedCount: accepted.length,
      deferredCount: deferred.length,
      policy: "PREFIX_UNDER_MAX_ITEMS"
    }
  };
}
