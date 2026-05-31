/**
 * Gateway ↔ client frozen reply contract pin (v1).
 * @see docs/RHIZOH_REPLY_NORMALIZATION_LAYER_V1.md
 */

export const RHIZOH_REPLY_SCHEMA_VERSION_V1 = "castle.rhizoh.reply_schema.v1";

/**
 * @param {unknown} gatewayJson
 * @returns {{ contractOk: boolean, replySchemaVersion: string, contractDrift: boolean }}
 */
export function assessRhizohReplySchemaContractV1(gatewayJson) {
  const json =
    gatewayJson && typeof gatewayJson === "object" && !Array.isArray(gatewayJson)
      ? /** @type {Record<string, unknown>} */ (gatewayJson)
      : {};
  const replySchemaVersion = String(json.replySchemaVersion ?? "").trim();
  const contractOk = replySchemaVersion === RHIZOH_REPLY_SCHEMA_VERSION_V1;
  return {
    contractOk,
    replySchemaVersion,
    contractDrift: replySchemaVersion !== "" && !contractOk
  };
}
