import crypto from "node:crypto";

export const EPISTEMIC_SEAL_SCHEMA = "rhizoh.epistemic.seal.v529.0";

/**
 * İmzalanacak yükü deterministik JSON olarak üretir (UTF-8).
 * @param {{
 *   truth_contract: object,
 *   runtime_hash: string,
 *   model_route: { provider?: string | null, model?: string | null },
 *   memory_digest: string,
 *   world_snapshot_hash: string,
 *   timestamp: number
 * }} body
 */
export function canonicalEpistemicSealString(body) {
  const payload = {
    schemaVersion: EPISTEMIC_SEAL_SCHEMA,
    truth_contract: body.truth_contract,
    runtime_hash: String(body.runtime_hash || ""),
    model_route: {
      provider: body.model_route?.provider ?? null,
      model: body.model_route?.model ?? null
    },
    memory_digest: String(body.memory_digest || ""),
    world_snapshot_hash: String(body.world_snapshot_hash || ""),
    timestamp: Number(body.timestamp) || 0
  };
  return `${JSON.stringify(payload)}\n`;
}

/**
 * @param {string} canonicalUtf8
 * @param {string} secret
 * @returns {{ hash: string, signature: string }}
 */
export function hashAndSignEpistemicSeal(canonicalUtf8, secret) {
  const hash = crypto.createHash("sha256").update(canonicalUtf8, "utf8").digest("hex");
  const signature = crypto.createHmac("sha256", secret).update(hash, "utf8").digest("hex");
  return { hash, signature };
}

/**
 * Doğrulama (replay / offline audit).
 * @param {string} canonicalUtf8
 * @param {string} secret
 * @param {string} expectedHash
 * @param {string} expectedSig
 */
export function verifyEpistemicSeal(canonicalUtf8, secret, expectedHash, expectedSig) {
  const { hash, signature } = hashAndSignEpistemicSeal(canonicalUtf8, secret);
  const eh = String(expectedHash || "");
  const es = String(expectedSig || "");
  if (eh.length !== hash.length || es.length !== signature.length) return false;
  const t = crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(eh, "hex"));
  const u = crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(es, "hex"));
  return t && u;
}
