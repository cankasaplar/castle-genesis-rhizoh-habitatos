/**
 * Segment hash chain — H_n = f(H_{n-1}, payload_n). Genesis anchor h00000000.
 */

export const WAL_HASH_CHAIN_GENESIS_V0 = "h00000000";

/**
 * @param {string} str
 */
function djb2HexU32(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return `h${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

/**
 * @param {unknown} v
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
 * @param {string} prevHash
 * @param {unknown} payload
 */
export function foldWalSegmentHashV0(prevHash, payload) {
  const prev = String(prevHash || WAL_HASH_CHAIN_GENESIS_V0);
  return djb2HexU32(`${prev}|${canonicalJsonV0(payload)}`);
}

/**
 * @param {string} prevHash
 * @param {{ hash?: string, body?: unknown }} segment
 */
export function validateSegmentHashLinkV0(prevHash, segment) {
  const expected = foldWalSegmentHashV0(prevHash, segment?.body ?? null);
  const actual = String(segment?.hash || "");
  if (!actual || actual !== expected) {
    return { ok: false, code: "hash_chain_break", expected, actual };
  }
  return { ok: true, expected };
}
