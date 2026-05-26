/**
 * Replay corruption taxonomy — failure classes, not generic errors.
 * RESEARCH-ONLY policy doc: REPLAY_CORRUPTION_TAXONOMY_V0.md
 */

export const REPLAY_CORRUPTION_BREACH_V0 = Object.freeze({
  STALE_REPLAY: "STALE_REPLAY",
  DUPLICATE_APPEND: "DUPLICATE_APPEND",
  PARTIAL_WRITE: "PARTIAL_WRITE",
  OUT_OF_ORDER_REPLAY: "OUT_OF_ORDER_REPLAY",
  HASH_CHAIN_MUTATION: "HASH_CHAIN_MUTATION",
  EPOCH_REGRESSION: "EPOCH_REGRESSION",
  PROFILE_SWITCH: "PROFILE_SWITCH"
});

export const CORRUPTION_AXIS_V0 = Object.freeze({
  TIME: "time",
  INTEGRITY: "integrity",
  IDENTITY: "identity"
});

/** @type {Record<string, string>} */
export const BREACH_TO_AXIS_V0 = Object.freeze({
  [REPLAY_CORRUPTION_BREACH_V0.STALE_REPLAY]: CORRUPTION_AXIS_V0.TIME,
  [REPLAY_CORRUPTION_BREACH_V0.OUT_OF_ORDER_REPLAY]: CORRUPTION_AXIS_V0.TIME,
  [REPLAY_CORRUPTION_BREACH_V0.EPOCH_REGRESSION]: CORRUPTION_AXIS_V0.TIME,
  [REPLAY_CORRUPTION_BREACH_V0.DUPLICATE_APPEND]: CORRUPTION_AXIS_V0.INTEGRITY,
  [REPLAY_CORRUPTION_BREACH_V0.PARTIAL_WRITE]: CORRUPTION_AXIS_V0.INTEGRITY,
  [REPLAY_CORRUPTION_BREACH_V0.HASH_CHAIN_MUTATION]: CORRUPTION_AXIS_V0.INTEGRITY,
  [REPLAY_CORRUPTION_BREACH_V0.PROFILE_SWITCH]: CORRUPTION_AXIS_V0.IDENTITY
});

export const SUBSTRATE_BOOT_PHASE_V0 = Object.freeze({
  RUN: "RUN",
  QUARANTINE_ISOLATION: "QUARANTINE_ISOLATION"
});

/** Epistemic past modes — authority object, not log format. */
export const EPISTEMIC_PAST_V0 = Object.freeze({
  CANONICAL_CHAIN: "canonical_chain",
  REPAIRED_CHAIN: "repaired_chain",
  TRUNCATED_TAIL: "truncated_tail",
  NO_TRUSTED_PAST: "no_trusted_past"
});

/** Execution permission gate (not hydrate boolean state). */
export const REHYDRATE_GATE_V0 = Object.freeze({
  OPEN: "open",
  CLOSED: "closed"
});

/**
 * Map low-level substrate codes → taxonomy breach.
 * @param {string} code
 * @returns {string | null}
 */
export function mapIssueCodeToBreachV0(code) {
  const c = String(code || "");
  switch (c) {
    case "cursor_regressed":
      return REPLAY_CORRUPTION_BREACH_V0.STALE_REPLAY;
    case "duplicate_segment":
      return REPLAY_CORRUPTION_BREACH_V0.DUPLICATE_APPEND;
    case "segment_integrity_failed":
    case "segment_malformed":
      return REPLAY_CORRUPTION_BREACH_V0.PARTIAL_WRITE;
    case "replay_order_violation":
      return REPLAY_CORRUPTION_BREACH_V0.OUT_OF_ORDER_REPLAY;
    case "cursor_hash_segment_mismatch":
    case "hash_chain_break":
    case "cursor_segment_id_mismatch":
      return REPLAY_CORRUPTION_BREACH_V0.HASH_CHAIN_MUTATION;
    case "epoch_regressed":
      return REPLAY_CORRUPTION_BREACH_V0.EPOCH_REGRESSION;
    case "disk_key_mismatch":
      return REPLAY_CORRUPTION_BREACH_V0.PROFILE_SWITCH;
    default:
      return null;
  }
}

/**
 * Recovery hint by axis (detection-only in Faz 2.1; recovery layer later).
 * @param {string} breach
 */
export function suggestRecoveryPolicyV0(breach) {
  const axis = BREACH_TO_AXIS_V0[breach];
  if (axis === CORRUPTION_AXIS_V0.TIME) return "rollback_protection";
  if (axis === CORRUPTION_AXIS_V0.INTEGRITY) return "quarantine_replay_halt";
  if (axis === CORRUPTION_AXIS_V0.IDENTITY) return "disk_key_isolation";
  return "quarantine_replay_halt";
}
