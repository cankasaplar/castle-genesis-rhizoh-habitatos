/**
 * RegretVectorSystemV0 — teacher vs played trajectory distance (not a penalty).
 * RESEARCH-ONLY observation substrate.
 */

export const REGRET_VECTOR_SCHEMA_V0 = "rhizoh.regret_vector.v0";

/**
 * @param {number} swingCp
 */
function normalizeRegretMagnitudeV0(swingCp) {
  const swing = Math.abs(Number(swingCp) || 0);
  return Math.min(1, swing / 120);
}

/**
 * @param {{
 *   regret: { evalTrace?: ReadonlyArray<{ moveNumber?: number, san?: string, bestMove?: string, swingCp?: number|null, beforeCp?: number }> },
 *   fenRows?: ReadonlyArray<{ san?: string, before?: string }>
 * }} opts
 */
export function buildRegretVectorsFromTraceV0(opts = {}) {
  const regret = opts.regret || {};
  const fenRows = opts.fenRows || [];
  /** @type {object[]} */
  const vectors = [];

  for (const trace of regret.evalTrace || []) {
    if (trace.swingCp == null && !trace.bestMove) continue;
    const row = fenRows[(trace.moveNumber || 1) - 1];
    const magnitude = normalizeRegretMagnitudeV0(trace.swingCp);
    vectors.push(
      Object.freeze({
        schema: REGRET_VECTOR_SCHEMA_V0,
        moveNumber: trace.moveNumber || 0,
        san: trace.san || row?.san || null,
        bestMove: trace.bestMove || null,
        beforeFen: row?.before || null,
        swingCp: trace.swingCp != null ? Math.round(trace.swingCp) : null,
        teacherCp: trace.beforeCp != null ? Math.round(trace.beforeCp) : null,
        magnitude,
        evalGapCp: trace.swingCp != null ? Math.abs(Math.round(trace.swingCp)) : 0
      })
    );
  }

  return Object.freeze(vectors);
}
