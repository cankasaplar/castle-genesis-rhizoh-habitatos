/**
 * Reply schema registry v1 — gateway authoritative SSOT.
 * Client MUST NOT negotiate; only projects gateway replySchemaNegotiation + replyContractDriftClass.
 */

import { resolveCohortPinV1, currentSchemaV1 } from "./rhizohCohortSchemaMapV1.js";

export const RHIZOH_REPLY_SCHEMA_V1 = "castle.rhizoh.reply_schema.v1";

/** @deprecated alias — use RHIZOH_REPLY_SCHEMA_V1 */
export const RHIZOH_REPLY_SCHEMA_VERSION_V1 = RHIZOH_REPLY_SCHEMA_V1;

/** @typedef {"planned"|"current"|"deprecated"|"retired"} RhizohSchemaLifecycleV1 */
/** @typedef {"matched"|"downgraded_to_current"|"legacy_compat"|"unsupported_requested"|"retired_requested"|"cohort_shadow"|"cohort_pinned"} RhizohReplySchemaNegotiationStatusV1 */
/** @typedef {"ok"|"informative"|"breaking"|"legacy_only"} RhizohReplyContractDriftClassV1 */

export const RHIZOH_REPLY_SCHEMA_REGISTRY_V1 = Object.freeze({
  schema: RHIZOH_REPLY_SCHEMA_REGISTRY_SCHEMA_V1,
  current: RHIZOH_REPLY_SCHEMA_V1,
  entries: Object.freeze([
    Object.freeze({
      id: RHIZOH_REPLY_SCHEMA_V1,
      lifecycle: "current",
      requiredFields: Object.freeze(["reply", "replySchemaVersion", "rhizohDeliveryKind", "replyContractDriftClass"])
    }),
    /** Simulation / governance placeholder — not served until promoted */
    Object.freeze({
      id: "castle.rhizoh.reply_schema.v2",
      lifecycle: "planned",
      requiredFields: Object.freeze([
        "reply",
        "replySchemaVersion",
        "rhizohDeliveryKind",
        "replyContractDriftClass",
        "replySchemaNegotiation",
        "replySchemaLifecycleAudit"
      ])
    })
  ]),
  /** Pre-pin clients — gateway serves current schema, drift class legacy_only */
  legacyIds: Object.freeze([]),
  /** Unknown ids — gateway serves current, negotiation unsupported_requested + breaking drift */
  unsupportedPolicy: "serve_current_mark_breaking"
});

const KNOWN_IDS = new Set(
  RHIZOH_REPLY_SCHEMA_REGISTRY_V1.entries
    .filter((e) => e.lifecycle === "current" || e.lifecycle === "deprecated")
    .map((e) => e.id)
);

/**
 * @param {string} schemaId
 * @returns {RhizohSchemaLifecycleV1 | "unknown"}
 */
export function resolveSchemaLifecycleV1(schemaId) {
  const id = String(schemaId || "").trim();
  const hit = RHIZOH_REPLY_SCHEMA_REGISTRY_V1.entries.find((e) => e.id === id);
  return hit ? hit.lifecycle : "unknown";
}

export function activeSchemaLifecycleSnapshotV1() {
  const current = RHIZOH_REPLY_SCHEMA_REGISTRY_V1.current;
  return Object.freeze({
    currentId: current,
    lifecycle: resolveSchemaLifecycleV1(current)
  });
}

/**
 * @param {string} schemaId
 */
function negotiationStatusForSchemaId(schemaId) {
  const lifecycle = resolveSchemaLifecycleV1(schemaId);
  if (lifecycle === "retired") return "retired_requested";
  if (lifecycle === "deprecated") return "legacy_compat";
  if (lifecycle === "current") return "matched";
  return "unsupported_requested";
}

function withLifecycleMeta(base) {
  return Object.freeze({
    ...base,
    lifecycle: activeSchemaLifecycleSnapshotV1()
  });
}

/**
 * Gateway-only version negotiation (+ optional cohort pin).
 * @param {unknown} requestedVersion — context.replySchemaPreference (deprecated; cohort wins)
 * @param {{ cohortId?: unknown }} [opts]
 */
export function negotiateReplySchemaV1(requestedVersion, opts = {}) {
  const cohortPin = resolveCohortPinV1(opts.cohortId);
  const active = currentSchemaV1();

  if (cohortPin?.observationOnly) {
    return withLifecycleMeta({
      requested: cohortPin.pinnedSchema,
      active,
      status: "cohort_shadow",
      cohortPin,
      registrySchema: RHIZOH_REPLY_SCHEMA_REGISTRY_SCHEMA_V1,
      observationOnly: true
    });
  }

  if (cohortPin?.pinnedSchema && !cohortPin.unknownCohort) {
    const pinned = cohortPin.pinnedSchema;
    if (pinned === active) {
      return withLifecycleMeta({
        requested: pinned,
        active,
        status: "cohort_pinned",
        cohortPin,
        registrySchema: RHIZOH_REPLY_SCHEMA_REGISTRY_SCHEMA_V1
      });
    }
    const reqLifecycle = resolveSchemaLifecycleV1(pinned);
    if (reqLifecycle === "retired") {
      return withLifecycleMeta({
        requested: pinned,
        active,
        status: "retired_requested",
        cohortPin,
        registrySchema: RHIZOH_REPLY_SCHEMA_REGISTRY_SCHEMA_V1
      });
    }
    if (KNOWN_IDS.has(pinned)) {
      return withLifecycleMeta({
        requested: pinned,
        active,
        status: "cohort_pinned",
        cohortPin,
        registrySchema: RHIZOH_REPLY_SCHEMA_REGISTRY_SCHEMA_V1
      });
    }
    return withLifecycleMeta({
      requested: pinned,
      active,
      status: "unsupported_requested",
      cohortPin,
      registrySchema: RHIZOH_REPLY_SCHEMA_REGISTRY_SCHEMA_V1
    });
  }

  const requested = String(requestedVersion ?? "").trim() || null;

  if (!requested) {
    return withLifecycleMeta({
      requested: null,
      active,
      status: "downgraded_to_current",
      cohortPin: cohortPin?.unknownCohort ? cohortPin : null,
      registrySchema: RHIZOH_REPLY_SCHEMA_REGISTRY_SCHEMA_V1
    });
  }
  if (requested === active) {
    return withLifecycleMeta({
      requested,
      active,
      status: "matched",
      cohortPin: cohortPin?.unknownCohort ? cohortPin : null,
      registrySchema: RHIZOH_REPLY_SCHEMA_REGISTRY_SCHEMA_V1
    });
  }
  const reqLifecycle = resolveSchemaLifecycleV1(requested);
  if (reqLifecycle === "retired") {
    return withLifecycleMeta({
      requested,
      active,
      status: "retired_requested",
      cohortPin: cohortPin?.unknownCohort ? cohortPin : null,
      registrySchema: RHIZOH_REPLY_SCHEMA_REGISTRY_SCHEMA_V1
    });
  }
  if (KNOWN_IDS.has(requested)) {
    return withLifecycleMeta({
      requested,
      active,
      status: negotiationStatusForSchemaId(requested),
      cohortPin: cohortPin?.unknownCohort ? cohortPin : null,
      registrySchema: RHIZOH_REPLY_SCHEMA_REGISTRY_SCHEMA_V1
    });
  }
  if (RHIZOH_REPLY_SCHEMA_REGISTRY_V1.legacyIds.includes(requested)) {
    return withLifecycleMeta({
      requested,
      active,
      status: "legacy_compat",
      cohortPin: cohortPin?.unknownCohort ? cohortPin : null,
      registrySchema: RHIZOH_REPLY_SCHEMA_REGISTRY_SCHEMA_V1
    });
  }
  return withLifecycleMeta({
    requested,
    active,
    status: "unsupported_requested",
    cohortPin: cohortPin?.unknownCohort ? cohortPin : null,
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

  if (negotiation.status === "unsupported_requested" || negotiation.status === "retired_requested") {
    return "breaking";
  }
  if (negotiation.status === "cohort_shadow") return "informative";
  if (negotiation.status === "legacy_compat") return "legacy_only";

  if (deliveryKind === "empty_reply") return "breaking";

  const formatDrift =
    deliveryKind === "unstructured_reply" ||
    extractPath === "plain_text_fallback" ||
    extractPath === "json.alt_field" ||
    (Number.isFinite(driftScore) && driftScore >= 0.35);

  if (formatDrift) return "informative";

  if (negotiation.status === "matched" || negotiation.status === "downgraded_to_current" || negotiation.status === "cohort_pinned") {
    return "ok";
  }

  return "legacy_only";
}

/**
 * Attach registry + negotiation + drift class to gateway success body.
 * @param {Record<string, unknown>} body
 * @param {unknown} requestedVersion
 * @param {unknown} [cohortId]
 */
export function attachReplySchemaContractV1(body, requestedVersion, cohortId) {
  const negotiation = negotiateReplySchemaV1(requestedVersion, { cohortId });
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
