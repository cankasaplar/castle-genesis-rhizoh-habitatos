/**
 * PR-3.1 — Deterministic execution command hash (rule-of-origin witness).
 * SPECFLOW: **RESEARCH-ONLY**
 */

/**
 * @param {unknown} v
 * @returns {string}
 */
function canonicalJsonV0(v) {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : `"NaN"`;
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "string") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map((x) => canonicalJsonV0(x)).join(",")}]`;
  if (typeof v === "object") {
    const o = /** @type {Record<string, unknown>} */ (v);
    const keys = Object.keys(o).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJsonV0(o[k])}`).join(",")}}`;
  }
  return `"${String(v)}"`;
}

/**
 * @param {string} str
 * @returns {string}
 */
function djb2HexU32(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return `h${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

/**
 * Hash basis: lane, provenance, namespace, type, payload only (never `executionHash`).
 *
 * @param {{ lane?: unknown, provenance?: unknown, namespace?: unknown, type?: unknown, payload?: unknown }} cmd
 */
export function computeExecutionCommandHashV0(cmd) {
  if (!cmd || typeof cmd !== "object") return "h00000000";
  const basis = {
    lane: cmd.lane,
    provenance: cmd.provenance,
    namespace: cmd.namespace,
    type: cmd.type,
    payload: cmd.payload === undefined ? null : cmd.payload
  };
  return djb2HexU32(canonicalJsonV0(basis));
}

/**
 * Producer helper: returns shallow copy with `executionHash` set from canonical basis.
 *
 * @template T
 * @param {T & { executionHash?: string }} cmd
 */
export function stampExecutionCommandHashV0(cmd) {
  const h = computeExecutionCommandHashV0(cmd);
  return { ...cmd, executionHash: h };
}
