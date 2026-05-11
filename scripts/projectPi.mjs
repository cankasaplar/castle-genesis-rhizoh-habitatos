/**
 * UCFC canonical projection π(trace) — Phase 2.5.
 * Idempotent + deterministic edge multiset → canonical representative (order on `opId`, tie `kind`).
 * Root hash uses π(body) so permuted traces with same multiset rejoin ([MK-1] GECS / UCFC runtime proof).
 *
 * @see docs/MK1_KERNEL_VALIDATOR_V0_1.md §4 GECS
 */

/** Projection contract tag embedded in canonical body (audit). */
export const UCFC_PI_SPEC_TAG = "UCFC_PI_PHASE25";

/**
 * @param {Record<string, unknown>} body Trace body (no `finalHash`) or full trace — `finalHash` ignored.
 * @returns {Record<string, unknown>} Shallow clone with `edges` canonically ordered; other keys unchanged order.
 */
export function projectPi(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return /** @type {Record<string, unknown>} */ (body);
  }

  const { finalHash: _f, edges: rawEdges, ...rest } = /** @type {{ finalHash?: string, edges?: unknown }} */ (
    body
  );

  if (!Array.isArray(rawEdges)) {
    return { ...rest, ucfcPi: UCFC_PI_SPEC_TAG };
  }

  const edges = rawEdges.map((e) => (e && typeof e === "object" ? { ...e } : e));

  edges.sort((a, b) => {
    const ea = /** @type {{ opId?: string, kind?: string }} */ (a);
    const eb = /** @type {{ opId?: string, kind?: string }} */ (b);
    const ka = ea?.opId ?? "";
    const kb = eb?.opId ?? "";
    const c = ka.localeCompare(kb);
    if (c !== 0) return c;
    return (ea?.kind ?? "").localeCompare(eb?.kind ?? "");
  });

  return {
    ...rest,
    ucfcPi: UCFC_PI_SPEC_TAG,
    edges
  };
}

/**
 * @param {Record<string, unknown>} body
 * @returns {boolean}
 */
export function isPiIdempotent(body) {
  const once = projectPi(body);
  const twice = projectPi(once);
  return stableJson(once) === stableJson(twice);
}

function stableJson(x) {
  return JSON.stringify(x);
}
