import crypto from "node:crypto";

export const AUTHORITY_LEDGER_WITNESS_SCHEMA_V1 = "castle.rhizoh.authority_ledger_witness.v1";

/**
 * Canonical witness payload — gateway does not interpret admission/fusion semantics.
 * @param {{
 *   subjectId: string,
 *   height: number,
 *   entryId: string,
 *   clientSealHash: string,
 *   prevClientSealHash: string,
 *   epochId?: string,
 *   witnessedAt: number
 * }} body
 */
export function canonicalAuthorityLedgerWitnessStringV1(body) {
  const payload = {
    schemaVersion: AUTHORITY_LEDGER_WITNESS_SCHEMA_V1,
    subjectId: String(body.subjectId || ""),
    epochId: String(body.epochId || "epoch_unknown"),
    height: Number(body.height) || 0,
    entryId: String(body.entryId || ""),
    clientSealHash: String(body.clientSealHash || ""),
    prevClientSealHash: String(body.prevClientSealHash || ""),
    witnessedAt: Number(body.witnessedAt) || 0
  };
  return `${JSON.stringify(payload)}\n`;
}

/**
 * @param {string} canonicalUtf8
 * @param {string} secret
 */
export function hashAndSignAuthorityLedgerWitnessV1(canonicalUtf8, secret) {
  const hash = crypto.createHash("sha256").update(canonicalUtf8, "utf8").digest("hex");
  const signature = crypto.createHmac("sha256", secret).update(hash, "utf8").digest("hex");
  return { hash, signature };
}

/**
 * @param {string} canonicalUtf8
 * @param {string} secret
 * @param {string} expectedHash
 * @param {string} expectedSig
 */
export function verifyAuthorityLedgerWitnessV1(canonicalUtf8, secret, expectedHash, expectedSig) {
  const { hash, signature } = hashAndSignAuthorityLedgerWitnessV1(canonicalUtf8, secret);
  const eh = String(expectedHash || "");
  const es = String(expectedSig || "");
  if (eh.length !== hash.length || es.length !== signature.length) return false;
  const t = crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(eh, "hex"));
  const u = crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(es, "hex"));
  return t && u;
}
