/**
 * Reply schema registry v1 — gateway authoritative SSOT.
 * Client MUST NOT negotiate; only projects gateway replySchemaNegotiation + replyContractDriftClass.
 */

export const RHIZOH_REPLY_SCHEMA_REGISTRY_SCHEMA_V1 = "castle.rhizoh.reply_schema_registry.v1";

export const RHIZOH_REPLY_SCHEMA_V1 = "castle.rhizoh.reply_schema.v1";

/** @deprecated alias — use RHIZOH_REPLY_SCHEMA_V1 */
export const RHIZOH_REPLY_SCHEMA_VERSION_V1 = RHIZOH_REPLY_SCHEMA_V1;

/** @typedef {"current"|"legacy"|"deprecated"} RhizohReplySchemaEntryStatusV1 */
/** @typedef {"matched"|"downgraded_to_current"|"legacy_compat"|"unsupported_requested"} RhizohReplySchemaNegotiationStatusV1 */
/** @typedef {"ok"|"informative"|"breaking"|"legacy_only"} RhizohReplyContractDriftClassV1 */

export const RHIZOH_REPLY_SCHEMA_REGISTRY_V1 = Object.freeze({
  schema: RHIZOH_REPLY_SCHEMA_REGISTRY_SCHEMA_V1,
  current: RHIZOH_REPLY_SCHEMA_V1,
  entries: Object.freeze([
    Object.freeze({
      id: RHIZOH_REPLY_SCHEMA_V1,
      status: "current",
      requiredFields: Object.freeze(["reply", "replySchemaVersion", "rhizohDeliveryKind"])
    })
  ]),
  /** Pre-pin clients — gateway serves current schema, drift class legacy_only */
  legacyIds: Object.freeze([]),
  /** Unknown ids — gateway serves current, negotiation unsupported_requested + breaking drift */
  unsupportedPolicy: "serve_current_mark_breaking"
});

const KNOWN_IDS = new Set(RHIZOH_REPLY_SCHEMA_REGISTRY_V1.entries.map((e) => e.id));

/**
 * Gateway-only version negotiation.
 * @param {unknown} requestedVersion — context.replySchemaPreference (optional client hint)
 */
export function negotiateReplySchemaV1(requestedVersion) {
  const requested = String(requestedVersion ?? "").trim() || null;
  const active = RHIZOH_REPLY_SCHEMA_REGISTRY_V1.current;

  if (!requested) {
    return Object.freeze({
      requested: null,
      active,
      status: "downgraded_to_current",
      registrySchema: RHIZOH_REPLY_SCHEMA_REGISTRY_SCHEMA_V1
    });
  }
  if (requested === active || KNOWN_IDS.has(requested)) {
    return Object.freeze({
      requested,
      active,
      status: "matched",
      registrySchema: RHIZOH_REPLY_SCHEMA_REGISTRY_SCHEMA_V1
    });
  }
  if (RHIZOH_REPLY_SCHEMA_REGISTRY_V1.legacyIds.includes(requested)) {
    return Object.freeze({
      requested,
      active,
      status: "legacy_compat",
      registrySchema: RHIZOH_REPLY_SCHEMA_REGISTRY_SCHEMA_V1
    });
  }
  return Object.freeze({
    requested,
    active,
    status: "unsupported_requested",
    registrySchema: RHIZOH_REPLY_SCHEMA_REGISTRY_SCHEMA_V1
  });
}

/**
 * Gateway-only drift classification (observable, non-executable on client).
 * @param {{
 *   negotiation: ReturnType<typeof negotiateReplySchemaV1>,
 *   rhizohDeliveryKind?: string,
 *   replyFormatDriftScore?: number | null,
 *   extractPath?: string
 * }} input
 * @returns {RhizohReplyContractDriftClassV1}
 */
export function classifyReplyContractDriftV1(input) {
  const negotiation = input?.negotiation || negotiateReplySchemaV1(null);
  const deliveryKind = String(input?.rhizohDeliveryKind ?? "ok");
  const driftScore = Number(input?.replyFormatDriftScore);
  const extractPath = String(input?.extractPath ?? "");

  if (negotiation.status === "unsupported_requested") return "breaking";
  if (negotiation.status === "legacy_compat") return "legacy_only";

  if (deliveryKind === "empty_reply") return "breaking";

  const formatDrift =
    deliveryKind === "unstructured_reply" ||
    extractPath === "plain_text_fallback" ||
    extractPath === "json.alt_field" ||
    (Number.isFinite(driftScore) && driftScore >= 0.35);

  if (formatDrift) return "informative";

  if (negotiation.status === "matched" || negotiation.status === "downgraded_to_current") {
    return "ok";
  }

  return "legacy_only";
}

/**
 * Attach registry + negotiation + drift class to gateway success body.
 * @param {Record<string, unknown>} body
 * @param {unknown} requestedVersion
 */
export function attachReplySchemaContractV1(body, requestedVersion) {
  const negotiation = negotiateReplySchemaV1(requestedVersion);
  const replyContractDriftClass = classifyReplyContractDriftV1({
    negotiation,
    rhizohDeliveryKind: body.rhizohDeliveryKind,
    replyFormatDriftScore: body.replyFormatDriftScore,
    extractPath:
      body.rhizohCompressionLedger &&
      typeof body.rhizohCompressionLedger === "object" &&
      /** @type {Record<string, unknown>} */ (body.rhizohCompressionLedger).replyExtractPath
        ? String(/** @type {Record<string, unknown>} */ (body.rhizohCompressionLedger).replyExtractPath)
        : body.observedFormat
  });

  return {
    ...body,
    replySchemaRegistry: RHIZOH_REPLY_SCHEMA_REGISTRY_SCHEMA_V1,
    replySchemaVersion: negotiation.active,
    replySchemaNegotiation: negotiation,
    replyContractDriftClass
  };
}
