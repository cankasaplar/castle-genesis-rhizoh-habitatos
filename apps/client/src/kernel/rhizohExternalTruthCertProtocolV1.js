/**
 * Dış truth sertifikasyon protokolü v1 — istek/yanıt zarfı (ağ/yan süreç ile konuşmak için).
 * Taşıma katmanı (HTTP/gRPC) uygulama dışıdır; burada yalnızca anlamsal sözleşme.
 */

export const RHIZOH_EXTERNAL_TRUTH_CERT_PROTOCOL_VERSION = "v1";

export const EXTERNAL_TRUTH_CERT_MESSAGE_KIND = Object.freeze({
  CERT_REQUEST: "RHIZOH_EXTERNAL_TRUTH_CERT_REQUEST_V1",
  CERT_RESPONSE: "RHIZOH_EXTERNAL_TRUTH_CERT_RESPONSE_V1",
  CERT_REVOCATION: "RHIZOH_EXTERNAL_TRUTH_CERT_REVOCATION_V1"
});

/**
 * @param {{
 *   requestId: string,
 *   compositeFingerprint: string,
 *   frameAnchor?: string | null,
 *   obligationIds?: string[],
 *   smtIrDigest?: string | null,
 *   issuerHint?: string | null
 * }} parts
 */
export function encodeExternalTruthCertRequestV1(parts) {
  const rid = String(parts.requestId ?? "");
  if (!rid) throw new Error("rhizohExternalTruthCert: requestId required");
  return Object.freeze({
    kind: EXTERNAL_TRUTH_CERT_MESSAGE_KIND.CERT_REQUEST,
    protocolVersion: RHIZOH_EXTERNAL_TRUTH_CERT_PROTOCOL_VERSION,
    requestId: rid,
    compositeFingerprint: String(parts.compositeFingerprint ?? ""),
    frameAnchor: parts.frameAnchor ?? null,
    obligationIds: Object.freeze([...(parts.obligationIds ?? [])]),
    smtIrDigest: parts.smtIrDigest ?? null,
    issuerHint: parts.issuerHint ?? null,
    issuedAtMs: Date.now()
  });
}

/**
 * @param {object} raw — ağdan gelen veya yerel yanıt
 */
export function parseExternalTruthCertResponseV1(raw) {
  if (!raw || typeof raw !== "object") {
    return { ok: false, reason: "invalid_payload" };
  }
  if (raw.kind !== EXTERNAL_TRUTH_CERT_MESSAGE_KIND.CERT_RESPONSE) {
    return { ok: false, reason: "not_cert_response" };
  }
  const status = raw.certificationStatus;
  if (status !== "GRANTED" && status !== "DENIED" && status !== "DEFERRED") {
    return { ok: false, reason: "unknown_certification_status" };
  }
  return Object.freeze({
    ok: true,
    requestId: raw.requestId ?? null,
    certificationStatus: status,
    certificateRef: raw.certificateRef ?? null,
    verifierId: raw.verifierId ?? null,
    expiresAtMs: raw.expiresAtMs ?? null,
    obligationsCovered: Object.freeze([...(raw.obligationsCovered ?? [])])
  });
}

export function buildExternalTruthCertProtocolSurface() {
  return Object.freeze({
    protocolVersion: RHIZOH_EXTERNAL_TRUTH_CERT_PROTOCOL_VERSION,
    messageKinds: EXTERNAL_TRUTH_CERT_MESSAGE_KIND,
    encodeRequest: "encodeExternalTruthCertRequestV1",
    parseResponse: "parseExternalTruthCertResponseV1"
  });
}
