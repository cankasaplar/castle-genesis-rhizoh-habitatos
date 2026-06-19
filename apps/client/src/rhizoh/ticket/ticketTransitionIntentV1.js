/**
 * Ticket Transition Intent V1 — intentId + intentEpoch; SC-03 execution surface.
 *
 * interpretationOnly · nonExecutive
 * @see docs/RHIZOH_REALITY_TRANSITION_ENGINE_V1.md
 * @see docs/RHIZOH_SECURITY_BOUNDARY_V1.md SC-03
 */

import {
  TICKET_EXECUTION_CLASS_V0,
  TICKET_TRANSITION_TYPE_V0,
  TRANSITION_REQUIRED_CLASS_V0,
  buildTicketTransitionIntentV0,
  normalizeTicketTransitionIntentV0
} from "./ticketTransitionIntentV0.js";

export const TICKET_TRANSITION_INTENT_SCHEMA_V1 = "castle.rhizoh.ticket_transition_intent.v1";

export {
  TICKET_TRANSITION_TYPE_V0,
  TICKET_EXECUTION_CLASS_V0,
  TRANSITION_REQUIRED_CLASS_V0
};

let intentSeqV1 = 0;

/**
 * @param {string} [prefix]
 * @returns {string}
 */
export function allocateIntentIdV1(prefix = "intent") {
  return `${prefix}_${++intentSeqV1}_${Date.now()}`;
}

/**
 * @param {Date | number} [at]
 * @param {"morning" | "evening"} [slot]
 * @returns {string} e.g. rec_2026_06_19_0644
 */
export function formatIntentEpochV1(at = Date.now(), slot = "morning") {
  const d = new Date(at);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const time = slot === "evening" ? "1844" : "0644";
  return `rec_${y}_${m}_${day}_${time}`;
}

/**
 * @typedef {import('./ticketTransitionIntentV0.js').TicketTransitionIntentV0 & {
 *   schemaVersion: 1,
 *   intentId: string,
 *   intentEpoch: string
 * }} TicketTransitionIntentV1
 */

/**
 * @param {Partial<TicketTransitionIntentV1>} raw
 * @returns {TicketTransitionIntentV1}
 */
export function normalizeTicketTransitionIntentV1(raw) {
  const base = normalizeTicketTransitionIntentV0(raw);
  const executionClass = base.executionClass;
  const intentId = String(raw?.intentId || "").trim() || allocateIntentIdV1();
  const intentEpoch =
    String(raw?.intentEpoch || "").trim() ||
    formatIntentEpochV1(Date.now(), "morning");

  if (
    executionClass !== TICKET_EXECUTION_CLASS_V0.READ_ONLY &&
    (!intentId || !intentEpoch)
  ) {
    throw new Error("ticket_transition_intent_v1: intentId and intentEpoch required for non-read_only");
  }

  return Object.freeze({
    ...base,
    schema: TICKET_TRANSITION_INTENT_SCHEMA_V1,
    schemaVersion: 1,
    intentId,
    intentEpoch
  });
}

/**
 * @param {Partial<TicketTransitionIntentV1>} partial
 * @returns {TicketTransitionIntentV1}
 */
export function buildTicketTransitionIntentV1(partial) {
  return normalizeTicketTransitionIntentV1(partial);
}

/** Upgrade v0-shaped intent to v1 with fresh ids if missing. */
export function upgradeTicketTransitionIntentToV1V0(intentV0) {
  return normalizeTicketTransitionIntentV1({
    ...intentV0,
    intentId: intentV0?.intentId,
    intentEpoch: intentV0?.intentEpoch
  });
}

/** Test only. */
export function resetIntentIdSequenceForTestV1() {
  intentSeqV1 = 0;
}
