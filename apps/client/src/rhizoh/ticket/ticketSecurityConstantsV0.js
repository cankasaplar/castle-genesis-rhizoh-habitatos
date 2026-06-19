/**
 * Ticket security constants V0 — shared validator / emitter vocabulary.
 * @see docs/RHIZOH_SECURITY_BOUNDARY_V1.md
 */

export const TICKET_SECURITY_VALIDATOR_VERSION_V0 = "v1";

export const TICKET_VALIDATION_DECISION_V0 = Object.freeze({
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  EXPIRED: "expired",
  QUOTA_DENIED: "quota_denied"
});

export const TICKET_REJECT_REASON_V0 = Object.freeze({
  TICKET_MISSING: "ticket_missing",
  TICKET_EXPIRED: "ticket_expired",
  QUOTA_EXCEEDED: "quota_exceeded",
  EPOCH_CLOSED: "epoch_closed",
  ORPHAN_EDGE: "orphan_edge",
  SUGGEST_MUTATE_FORBIDDEN: "suggest_mutate_forbidden",
  CLASS_INSUFFICIENT: "execution_class_insufficient",
  NO_EXECUTION_RIGHT: "no_execution_right",
  AUTHORITY_ESCALATION: "authority_escalation",
  SYSTEM_RECONCILE_CUBE_WRITE_FORBIDDEN: "system_reconcile_cube_write_forbidden",
  SYSTEM_RECONCILE_OUTSIDE_CORE: "system_reconcile_outside_core",
  UNSIGNED_MUTATE: "unsigned_mutate",
  DIRECT_CUBE_MUTATE_FORBIDDEN: "direct_cube_mutate_without_admission"
});

/** Partial order rank for class comparison (higher = more authority). */
export const EXECUTION_CLASS_RANK_V0 = Object.freeze({
  read_only: 0,
  suggest: 1,
  mutate_l1: 2,
  mutate_l2: 2,
  system_reconcile: 3
});

export const CORE_EPOCH_WINDOWS_V0 = Object.freeze([
  "rec_core_morning",
  "rec_core_evening"
]);

export const MUTATE_EPOCH_WINDOWS_V0 = Object.freeze(["rec_burst", "rec_core_morning", "rec_core_evening"]);
