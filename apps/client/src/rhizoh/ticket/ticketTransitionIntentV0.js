/**
 * Ticket Transition Intent V0 — normalized transition request before validation.
 *
 * interpretationOnly · nonExecutive · no execution authority
 * @see docs/RHIZOH_SECURITY_BOUNDARY_V1.md
 * @see docs/RHIZOH_STATE_TRANSITIONS_V1.md
 */

export const TICKET_TRANSITION_INTENT_SCHEMA_V0 = "castle.rhizoh.ticket_transition_intent.v0";

export const TICKET_TRANSITION_TYPE_V0 = Object.freeze({
  INVITE_JOIN: "invite_join",
  ARENA_ENTER: "arena_enter",
  GHOST_ATTACH: "ghost_attach",
  FLIGHT_DEPART: "flight_depart",
  CORPORATE_ADMISSION: "corporate_admission",
  SYSTEM_RECONCILE: "system_reconcile"
});

export const TICKET_EXECUTION_CLASS_V0 = Object.freeze({
  READ_ONLY: "read_only",
  SUGGEST: "suggest",
  MUTATE_L1: "mutate_l1",
  MUTATE_L2: "mutate_l2",
  SYSTEM_RECONCILE: "system_reconcile"
});

export const TICKET_EPOCH_WINDOW_V0 = Object.freeze({
  REC_CORE_MORNING: "rec_core_morning",
  REC_CORE_EVENING: "rec_core_evening",
  REC_SOFT: "rec_soft",
  REC_BURST: "rec_burst"
});

/** Minimum execution class per named transition. */
export const TRANSITION_REQUIRED_CLASS_V0 = Object.freeze({
  [TICKET_TRANSITION_TYPE_V0.INVITE_JOIN]: TICKET_EXECUTION_CLASS_V0.MUTATE_L1,
  [TICKET_TRANSITION_TYPE_V0.ARENA_ENTER]: TICKET_EXECUTION_CLASS_V0.MUTATE_L1,
  [TICKET_TRANSITION_TYPE_V0.GHOST_ATTACH]: TICKET_EXECUTION_CLASS_V0.READ_ONLY,
  [TICKET_TRANSITION_TYPE_V0.FLIGHT_DEPART]: TICKET_EXECUTION_CLASS_V0.MUTATE_L1,
  [TICKET_TRANSITION_TYPE_V0.CORPORATE_ADMISSION]: TICKET_EXECUTION_CLASS_V0.MUTATE_L1,
  [TICKET_TRANSITION_TYPE_V0.SYSTEM_RECONCILE]: TICKET_EXECUTION_CLASS_V0.SYSTEM_RECONCILE
});

/**
 * @typedef {Object} TicketTransitionIntentV0
 * @property {string} schema
 * @property {string} transitionType
 * @property {string} ticketId
 * @property {string} [sourceCube]
 * @property {string} [targetCube]
 * @property {string} executionClass
 * @property {string} [epochWindow]
 * @property {string} [traceGraphLink]
 * @property {string} [continuityAnchor]
 * @property {boolean} [directCubeMutation] — if true on system_reconcile → SC-01 violation
 * @property {object} [proposedCubeDelta] — reconcile output; admission commits
 */

/**
 * @param {Partial<TicketTransitionIntentV0>} raw
 * @returns {TicketTransitionIntentV0}
 */
export function normalizeTicketTransitionIntentV0(raw) {
  const transitionType = String(raw?.transitionType || "");
  if (!Object.values(TICKET_TRANSITION_TYPE_V0).includes(transitionType)) {
    throw new Error(`ticket_transition_intent: unknown transitionType ${transitionType}`);
  }
  const executionClass = String(raw?.executionClass || TICKET_EXECUTION_CLASS_V0.READ_ONLY);
  if (!Object.values(TICKET_EXECUTION_CLASS_V0).includes(executionClass)) {
    throw new Error(`ticket_transition_intent: unknown executionClass ${executionClass}`);
  }
  return Object.freeze({
    schema: TICKET_TRANSITION_INTENT_SCHEMA_V0,
    transitionType,
    ticketId: String(raw?.ticketId || ""),
    sourceCube: raw?.sourceCube != null ? String(raw.sourceCube) : undefined,
    targetCube: raw?.targetCube != null ? String(raw.targetCube) : undefined,
    executionClass,
    epochWindow: raw?.epochWindow != null ? String(raw.epochWindow) : undefined,
    traceGraphLink: raw?.traceGraphLink != null ? String(raw.traceGraphLink) : undefined,
    continuityAnchor: raw?.continuityAnchor != null ? String(raw.continuityAnchor) : undefined,
    directCubeMutation: raw?.directCubeMutation === true,
    proposedCubeDelta:
      raw?.proposedCubeDelta != null && typeof raw.proposedCubeDelta === "object"
        ? Object.freeze({ ...raw.proposedCubeDelta })
        : undefined
  });
}

/**
 * @param {Partial<TicketTransitionIntentV0>} partial
 * @returns {TicketTransitionIntentV0}
 */
export function buildTicketTransitionIntentV0(partial) {
  return normalizeTicketTransitionIntentV0(partial);
}
