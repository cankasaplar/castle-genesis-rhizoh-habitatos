/**
 * Reply schema registry v1 — client passive mirror (projection only).
 * Negotiation + drift classification happen on gateway only.
 */

export const RHIZOH_REPLY_SCHEMA_REGISTRY_SCHEMA_V1 = "castle.rhizoh.reply_schema_registry.v1";
export const RHIZOH_REPLY_SCHEMA_V1 = "castle.rhizoh.reply_schema.v1";
export const RHIZOH_REPLY_SCHEMA_VERSION_V1 = RHIZOH_REPLY_SCHEMA_V1;

/** @typedef {"ok"|"informative"|"breaking"|"legacy_only"} RhizohReplyContractDriftClassV1 */

/**
 * Passive projection — no negotiation, no re-classification.
 * @param {unknown} gatewayJson
 */
export function projectReplySchemaFromGatewayV1(gatewayJson) {
  const json =
    gatewayJson && typeof gatewayJson === "object" && !Array.isArray(gatewayJson)
      ? /** @type {Record<string, unknown>} */ (gatewayJson)
      : {};
  const negRaw =
    json.replySchemaNegotiation && typeof json.replySchemaNegotiation === "object"
      ? /** @type {Record<string, unknown>} */ (json.replySchemaNegotiation)
      : null;
  const replyContractDriftClass = String(json.replyContractDriftClass ?? "legacy_only");
  const replySchemaVersion = String(json.replySchemaVersion ?? "").trim();

  return Object.freeze({
    replySchemaRegistry: String(json.replySchemaRegistry ?? ""),
    replySchemaVersion,
    replySchemaNegotiation: negRaw
      ? Object.freeze({
          requested: negRaw.requested ?? null,
          active: String(negRaw.active ?? ""),
          status: String(negRaw.status ?? ""),
          registrySchema: String(negRaw.registrySchema ?? ""),
          cohortPin:
            negRaw.cohortPin && typeof negRaw.cohortPin === "object"
              ? Object.freeze({ .../** @type {Record<string, unknown>} */ (negRaw.cohortPin) })
              : null,
          observationOnly: negRaw.observationOnly === true
        })
      : null,
    replyContractDriftClass,
    /** Legacy mirrors — derived from gateway class only */
    contractOk: replyContractDriftClass === "ok" || replyContractDriftClass === "informative",
    contractDrift: replyContractDriftClass === "breaking"
  });
}

/** @deprecated use projectReplySchemaFromGatewayV1 — client must not assess locally */
export function assessRhizohReplySchemaContractV1(gatewayJson) {
  const p = projectReplySchemaFromGatewayV1(gatewayJson);
  return {
    contractOk: p.contractOk,
    replySchemaVersion: p.replySchemaVersion,
    contractDrift: p.contractDrift,
    replySchemaRegistry: p.replySchemaRegistry,
    replySchemaNegotiation: p.replySchemaNegotiation,
    replyContractDriftClass: p.replyContractDriftClass
  };
}
