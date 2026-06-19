/**
 * Authority ledger segment hash chain — gateway-side verification mirror of client walHashChainV0.
 * Witness-only; does not recompute admission or fusion semantics.
 */

export const AUTHORITY_WAL_HASH_GENESIS_V1 = "h00000000";

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
function canonicalJsonV1(v) {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : `"NaN"`;
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "string") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map((x) => canonicalJsonV1(x)).join(",")}]`;
  if (typeof v === "object") {
    const o = /** @type {Record<string, unknown>} */ (v);
    const keys = Object.keys(o).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJsonV1(o[k])}`).join(",")}}`;
  }
  return `"${String(v)}"`;
}

/**
 * @param {string} prevHash
 * @param {unknown} payload
 */
export function foldAuthorityWalSegmentHashV1(prevHash, payload) {
  const prev = String(prevHash || AUTHORITY_WAL_HASH_GENESIS_V1);
  return djb2HexU32(`${prev}|${canonicalJsonV1(payload)}`);
}

/**
 * @param {object} entry sealed authority ledger entry
 */
export function buildAuthorityLedgerSealBodyV1(entry) {
  return Object.freeze({
    height: entry.height,
    admissionRequest: entry.admissionRequest,
    humanAttestation: entry.humanAttestation,
    authorityDecision: entry.authorityDecision,
    realityMutation: entry.realityMutation
  });
}

/**
 * @param {object} entry
 * @param {string} expectedPrevHash
 */
export function verifyAuthorityLedgerEntrySealV1(entry, expectedPrevHash) {
  const schema = String(entry?.schema || "");
  if (!schema.startsWith("castle.rhizoh.authority_ledger.v1.entry")) {
    return { ok: false, code: "schema_mismatch", reason: "invalid_entry_schema" };
  }
  const height = Number(entry?.height);
  if (!Number.isFinite(height) || height < 1) {
    return { ok: false, code: "height_invalid", reason: "invalid_height" };
  }
  const prevSealHash = String(entry?.seal?.prevSealHash || "");
  const sealHash = String(entry?.seal?.sealHash || "");
  if (!prevSealHash || !sealHash) {
    return { ok: false, code: "seal_missing", reason: "missing_seal_fields" };
  }
  if (prevSealHash !== String(expectedPrevHash || AUTHORITY_WAL_HASH_GENESIS_V1)) {
    return {
      ok: false,
      code: "prev_seal_mismatch",
      reason: "prev_seal_hash_mismatch",
      expected: expectedPrevHash,
      actual: prevSealHash
    };
  }
  const body = buildAuthorityLedgerSealBodyV1(entry);
  const expected = foldAuthorityWalSegmentHashV1(prevSealHash, body);
  if (expected !== sealHash) {
    return {
      ok: false,
      code: "seal_hash_mismatch",
      reason: "client_seal_hash_mismatch",
      expected,
      actual: sealHash
    };
  }
  return { ok: true, height, sealHash, prevSealHash, body };
}
