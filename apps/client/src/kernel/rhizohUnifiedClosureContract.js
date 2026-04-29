/**
 * GAP 4 — Birleşik closure sözleşmesi: f(canonicalProof, jointSeal, frameHash) → truthEquivalence.
 */

import { verifyJointSealIntegrity } from "./rhizohJointSealV2.js";

export const UNIFIED_CLOSURE_CONTRACT_VERSION = "v1";

const FNV_PRIME = 16777619 >>> 0;

function mixStr(h0, s) {
  let h = h0 >>> 0;
  const str = String(s ?? "");
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, FNV_PRIME) >>> 0;
  }
  return h >>> 0;
}

/**
 * @param {{
 *   canonicalProof: { equivalent?: boolean, formalStatus?: string } | null,
 *   jointSealState: object | null,
 *   frameInputHash: string | null | undefined
 * }} att
 */
export function evaluateUnifiedClosureContractV1(att) {
  const gpuCpuAgree = !!att?.canonicalProof?.equivalent;
  const jointOk = verifyJointSealIntegrity(att?.jointSealState).ok;
  const fh = att?.frameInputHash;
  const frameOk = typeof fh === "string" && fh.length > 0;
  const truthEquivalent = gpuCpuAgree && jointOk && frameOk;

  let h = 2166136261 >>> 0;
  h = mixStr(h, fh);
  h = mixStr(h, att?.jointSealState?.closureRoot);
  h = mixStr(h, att?.canonicalProof?.formalStatus);

  return Object.freeze({
    version: UNIFIED_CLOSURE_CONTRACT_VERSION,
    truthEquivalent,
    components: Object.freeze({
      gpuCpuCanonicalAgreement: gpuCpuAgree,
      jointSealOk: jointOk,
      frameHashOk: frameOk
    }),
    closureFingerprint: h.toString(16).padStart(8, "0")
  });
}
