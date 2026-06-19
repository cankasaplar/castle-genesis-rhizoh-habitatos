/**
 * Rhizoh Mutation Reason Code Ontology V1.
 *
 * interpretationOnly · nonExecutive
 * @see docs/RHIZOH_MUTATION_REASON_CODE_ONTOLOGY_V1.md
 */

export const MUTATION_REASON_CATEGORY_V1 = Object.freeze({
  SC: "SC",
  REC: "REC",
  QUOTA: "QUOTA",
  SIG: "SIG",
  INTENT: "INTENT",
  SYS: "SYS",
  ADMIT: "ADMIT"
});

export const MUTATION_REASON_CODE_V1 = Object.freeze({
  SC_01_FROZEN_CORE_VIOLATION: "SC_01_FROZEN_CORE_VIOLATION",
  SC_02_INVALID_MUTATION_SOURCE: "SC_02_INVALID_MUTATION_SOURCE",
  SC_03_TICKET_EXECUTION_DIRECT: "SC_03_TICKET_EXECUTION_DIRECT",
  SC_04_SELF_PRIVILEGE_ESCALATION: "SC_04_SELF_PRIVILEGE_ESCALATION",
  SC_05_CROSS_PRISM_UNAUTHORIZED_WRITE: "SC_05_CROSS_PRISM_UNAUTHORIZED_WRITE",
  REC_WINDOW_CLOSED: "REC_WINDOW_CLOSED",
  REC_WINDOW_NOT_ACTIVE: "REC_WINDOW_NOT_ACTIVE",
  REC_TICKET_EXPIRED: "REC_TICKET_EXPIRED",
  REC_TICKET_NOT_EPOCH_ALIGNED: "REC_TICKET_NOT_EPOCH_ALIGNED",
  REC_CONTINUITY_BREAK: "REC_CONTINUITY_BREAK",
  QUOTA_EXHAUSTED: "QUOTA_EXHAUSTED",
  QUOTA_LIMIT_REACHED: "QUOTA_LIMIT_REACHED",
  QUOTA_RATE_LIMITED: "QUOTA_RATE_LIMITED",
  QUOTA_TIER_BLOCKED: "QUOTA_TIER_BLOCKED",
  QUOTA_LIFETIME_CAP: "QUOTA_LIFETIME_CAP",
  SIG_MISMATCH: "SIG_MISMATCH",
  SIG_MISSING: "SIG_MISSING",
  SIG_FROZEN_DAG_INVALID: "SIG_FROZEN_DAG_INVALID",
  SIG_TEMPORAL_BINDING_FAILED: "SIG_TEMPORAL_BINDING_FAILED",
  SIG_ACTOR_NOT_AUTHORIZED: "SIG_ACTOR_NOT_AUTHORIZED",
  INTENT_MALFORMED: "INTENT_MALFORMED",
  INTENT_UNKNOWN_TRANSITION: "INTENT_UNKNOWN_TRANSITION",
  INTENT_MISSING_EXECUTION_CLASS: "INTENT_MISSING_EXECUTION_CLASS",
  INTENT_INVALID_CUBE_BINDING: "INTENT_INVALID_CUBE_BINDING",
  INTENT_PRISM_UNDEFINED: "INTENT_PRISM_UNDEFINED",
  SYS_RECONCILE_CONFLICT: "SYS_RECONCILE_CONFLICT",
  SYS_GRAPH_LOCKED: "SYS_GRAPH_LOCKED",
  SYS_SCHEDULER_DEFERRED: "SYS_SCHEDULER_DEFERRED",
  SYS_ENGINE_CONTENTION: "SYS_ENGINE_CONTENTION",
  SYS_UNKNOWN_ERROR: "SYS_UNKNOWN_ERROR",
  ADMIT_REJECTED_POLICY: "ADMIT_REJECTED_POLICY",
  ADMIT_PRISM_DENIED: "ADMIT_PRISM_DENIED",
  ADMIT_CAPABILITY_NOT_FOUND: "ADMIT_CAPABILITY_NOT_FOUND",
  ADMIT_CUBE_LOCKED: "ADMIT_CUBE_LOCKED",
  ADMIT_RATE_CONTROLLED: "ADMIT_RATE_CONTROLLED"
});

/** @type {Record<string, string>} */
const REASON_MESSAGES_V1 = Object.freeze({
  [MUTATION_REASON_CODE_V1.SC_01_FROZEN_CORE_VIOLATION]: "Mutation path violates frozen core boundary",
  [MUTATION_REASON_CODE_V1.SC_02_INVALID_MUTATION_SOURCE]: "Invalid mutation source for target layer",
  [MUTATION_REASON_CODE_V1.SC_03_TICKET_EXECUTION_DIRECT]: "Direct TicketPacket execution forbidden (SC-03)",
  [MUTATION_REASON_CODE_V1.SC_04_SELF_PRIVILEGE_ESCALATION]: "Ticket attempted self privilege escalation",
  [MUTATION_REASON_CODE_V1.SC_05_CROSS_PRISM_UNAUTHORIZED_WRITE]: "Unauthorized cross-prism write",
  [MUTATION_REASON_CODE_V1.REC_WINDOW_CLOSED]: "REC epoch window is closed",
  [MUTATION_REASON_CODE_V1.REC_WINDOW_NOT_ACTIVE]: "REC window not active for execution class",
  [MUTATION_REASON_CODE_V1.REC_TICKET_EXPIRED]: "Ticket lifetime expired",
  [MUTATION_REASON_CODE_V1.REC_TICKET_NOT_EPOCH_ALIGNED]: "Ticket not aligned to active epoch",
  [MUTATION_REASON_CODE_V1.REC_CONTINUITY_BREAK]: "TraceGraph continuity anchor broken",
  [MUTATION_REASON_CODE_V1.QUOTA_EXHAUSTED]: "Ticket quota exhausted",
  [MUTATION_REASON_CODE_V1.QUOTA_LIMIT_REACHED]: "Quota hard limit reached",
  [MUTATION_REASON_CODE_V1.QUOTA_RATE_LIMITED]: "Rate limit exceeded",
  [MUTATION_REASON_CODE_V1.QUOTA_TIER_BLOCKED]: "Tier blocks this operation",
  [MUTATION_REASON_CODE_V1.QUOTA_LIFETIME_CAP]: "Lifetime quota cap reached",
  [MUTATION_REASON_CODE_V1.SIG_MISMATCH]: "Signature mismatch",
  [MUTATION_REASON_CODE_V1.SIG_MISSING]: "Required signature missing",
  [MUTATION_REASON_CODE_V1.SIG_FROZEN_DAG_INVALID]: "Frozen DAG verification failed",
  [MUTATION_REASON_CODE_V1.SIG_TEMPORAL_BINDING_FAILED]: "Temporal identity binding failed",
  [MUTATION_REASON_CODE_V1.SIG_ACTOR_NOT_AUTHORIZED]: "Actor not authorized",
  [MUTATION_REASON_CODE_V1.INTENT_MALFORMED]: "Transition intent malformed",
  [MUTATION_REASON_CODE_V1.INTENT_UNKNOWN_TRANSITION]: "Unknown transition type",
  [MUTATION_REASON_CODE_V1.INTENT_MISSING_EXECUTION_CLASS]: "Execution class insufficient",
  [MUTATION_REASON_CODE_V1.INTENT_INVALID_CUBE_BINDING]: "Invalid CubeState binding",
  [MUTATION_REASON_CODE_V1.INTENT_PRISM_UNDEFINED]: "Prism projection undefined",
  [MUTATION_REASON_CODE_V1.SYS_RECONCILE_CONFLICT]: "System reconcile conflict",
  [MUTATION_REASON_CODE_V1.SYS_GRAPH_LOCKED]: "TraceGraph locked",
  [MUTATION_REASON_CODE_V1.SYS_SCHEDULER_DEFERRED]: "Scheduler deferred intent to REC",
  [MUTATION_REASON_CODE_V1.SYS_ENGINE_CONTENTION]: "Engine contention",
  [MUTATION_REASON_CODE_V1.SYS_UNKNOWN_ERROR]: "Unknown system error",
  [MUTATION_REASON_CODE_V1.ADMIT_REJECTED_POLICY]: "Admission policy rejected",
  [MUTATION_REASON_CODE_V1.ADMIT_PRISM_DENIED]: "Admission denied prism access",
  [MUTATION_REASON_CODE_V1.ADMIT_CAPABILITY_NOT_FOUND]: "Required capability not found",
  [MUTATION_REASON_CODE_V1.ADMIT_CUBE_LOCKED]: "Cube locked by admission",
  [MUTATION_REASON_CODE_V1.ADMIT_RATE_CONTROLLED]: "Admission rate controlled"
});

/** Maps validator legacy slug → ontology code. */
export const LEGACY_REJECT_TO_REASON_V1 = Object.freeze({
  ticket_missing: MUTATION_REASON_CODE_V1.INTENT_MALFORMED,
  ticket_expired: MUTATION_REASON_CODE_V1.REC_TICKET_EXPIRED,
  quota_exceeded: MUTATION_REASON_CODE_V1.QUOTA_EXHAUSTED,
  epoch_closed: MUTATION_REASON_CODE_V1.REC_WINDOW_CLOSED,
  orphan_edge: MUTATION_REASON_CODE_V1.REC_CONTINUITY_BREAK,
  suggest_mutate_forbidden: MUTATION_REASON_CODE_V1.SC_02_INVALID_MUTATION_SOURCE,
  execution_class_insufficient: MUTATION_REASON_CODE_V1.INTENT_MISSING_EXECUTION_CLASS,
  no_execution_right: MUTATION_REASON_CODE_V1.SIG_TEMPORAL_BINDING_FAILED,
  authority_escalation: MUTATION_REASON_CODE_V1.SC_04_SELF_PRIVILEGE_ESCALATION,
  system_reconcile_cube_write_forbidden: MUTATION_REASON_CODE_V1.SC_02_INVALID_MUTATION_SOURCE,
  system_reconcile_outside_core: MUTATION_REASON_CODE_V1.REC_WINDOW_NOT_ACTIVE,
  unsigned_mutate: MUTATION_REASON_CODE_V1.SIG_MISSING,
  direct_cube_mutate_without_admission: MUTATION_REASON_CODE_V1.SC_02_INVALID_MUTATION_SOURCE,
  ticket_packet_direct_execution: MUTATION_REASON_CODE_V1.SC_03_TICKET_EXECUTION_DIRECT,
  intent_id_required: MUTATION_REASON_CODE_V1.INTENT_MALFORMED,
  ticket_tombstoned: MUTATION_REASON_CODE_V1.REC_TICKET_EXPIRED
});

/** @type {Set<string>} */
const QUOTA_CODES = new Set([
  MUTATION_REASON_CODE_V1.QUOTA_EXHAUSTED,
  MUTATION_REASON_CODE_V1.QUOTA_LIMIT_REACHED,
  MUTATION_REASON_CODE_V1.QUOTA_RATE_LIMITED,
  MUTATION_REASON_CODE_V1.QUOTA_TIER_BLOCKED,
  MUTATION_REASON_CODE_V1.QUOTA_LIFETIME_CAP
]);

/** @type {Set<string>} */
const EXPIRED_CODES = new Set([
  MUTATION_REASON_CODE_V1.REC_TICKET_EXPIRED,
  MUTATION_REASON_CODE_V1.REC_WINDOW_CLOSED
]);

/**
 * @param {string} primary
 * @param {string} [message]
 */
export function buildMutationReasonV1(primary, message) {
  const code = String(primary || MUTATION_REASON_CODE_V1.SYS_UNKNOWN_ERROR);
  const category = code.split("_")[0] || "SYS";
  const shortCode = code.includes("_") ? `${category}_${code.split("_")[1]}` : category;
  return Object.freeze({
    primary: code,
    category,
    code: shortCode,
    message: message || REASON_MESSAGES_V1[code] || code
  });
}

/**
 * @param {string} legacySlug
 */
export function mapLegacyRejectReasonV1(legacySlug) {
  const slug = String(legacySlug || "");
  if (slug.startsWith("admission_")) {
    if (slug.includes("reject")) return buildMutationReasonV1(MUTATION_REASON_CODE_V1.ADMIT_REJECTED_POLICY);
    if (slug.includes("hold")) return buildMutationReasonV1(MUTATION_REASON_CODE_V1.ADMIT_RATE_CONTROLLED);
    return buildMutationReasonV1(MUTATION_REASON_CODE_V1.ADMIT_REJECTED_POLICY);
  }
  const mapped = LEGACY_REJECT_TO_REASON_V1[slug];
  return buildMutationReasonV1(mapped || MUTATION_REASON_CODE_V1.SYS_UNKNOWN_ERROR);
}

/**
 * @param {string[]} legacyReasons
 */
export function mapLegacyReasonsToOntologyV1(legacyReasons) {
  return (legacyReasons || []).map((r) => mapLegacyRejectReasonV1(r));
}

/**
 * @param {string} primaryCode
 * @param {string} [decision]
 */
export function inferStatusFromReasonV1(primaryCode, decision) {
  if (decision === "accepted") return "accepted";
  if (QUOTA_CODES.has(primaryCode) || decision === "quota_denied") return "quota_denied";
  if (EXPIRED_CODES.has(primaryCode) || decision === "expired") return "expired";
  return "rejected";
}

/**
 * @param {string} actorId
 */
export function inferActorTypeV1(actorId) {
  const id = String(actorId || "");
  if (id.startsWith("system:")) return "system";
  if (id.startsWith("service:")) return "agent";
  return "user";
}

/**
 * @param {string[]} legacyReasons
 * @param {string} [decision]
 */
export function pickPrimaryReasonV1(legacyReasons, decision) {
  const mapped = mapLegacyReasonsToOntologyV1(legacyReasons);
  if (mapped.length === 0) {
    if (decision === "accepted") return null;
    return buildMutationReasonV1(MUTATION_REASON_CODE_V1.SYS_UNKNOWN_ERROR);
  }
  return mapped[0];
}
