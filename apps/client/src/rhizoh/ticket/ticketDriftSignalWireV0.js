/**
 * Ticket Drift Signal Wire V0 — publishes drift suggestions to nervous network Signal bucket.
 *
 * DR-01: suggest-only messages; never mutate_l1/l2 from drift layer.
 * @see docs/RHIZOH_TICKET_NETWORK_SCHEMA_V1.md §6
 */

import { DRIFT_SUGGESTION_SCHEMA_V0 } from "./driftAnalyticsEngineV0.js";

export const RHIZOH_TICKET_SIGNAL_EVENT_V0 = "rhizoh:ticket-signal-v0";
export const TICKET_NERVOUS_MESSAGE_SCHEMA_V0 = "castle.rhizoh.ticket_message.v1";

let messageSeqV0 = 0;

/** @type {object[]} */
const signalInboxV0 = [];

/**
 * @param {{
 *   suggestion: object,
 *   traceGraphLink?: string,
 *   ticketId?: string
 * }} input
 */
export function buildNervousSignalMessageV0(input) {
  const suggestion = input.suggestion;
  if (suggestion?.executionClass && suggestion.executionClass !== "suggest") {
    throw new Error("DR-01: nervous Signal bucket accepts suggest class only");
  }

  return Object.freeze({
    schemaVersion: 1,
    schema: TICKET_NERVOUS_MESSAGE_SCHEMA_V0,
    messageId: `msg_sig_${++messageSeqV0}_${Date.now()}`,
    messageKind: "signal",
    executionClass: "suggest",
    from: Object.freeze({
      sourceKind: "system",
      sourceRef: "drift_analytics_engine_v0"
    }),
    traceGraphLink: input.traceGraphLink ? String(input.traceGraphLink) : undefined,
    ticketId: input.ticketId ? String(input.ticketId) : undefined,
    payload: Object.freeze({
      suggestionSchema: DRIFT_SUGGESTION_SCHEMA_V0,
      suggestionId: suggestion?.suggestionId,
      suggestion: suggestion?.suggestion,
      confidence: suggestion?.confidence,
      invariantAtRisk: suggestion?.invariantAtRisk,
      basedOn: suggestion?.basedOn
    }),
    issuedAt: new Date().toISOString(),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {{
 *   suggestions: object[],
 *   traceGraphLink?: string,
 *   ticketId?: string,
 *   dispatchEvent?: boolean
 * }} input
 */
export function wireDriftSuggestionsToNervousNetworkV0(input) {
  const messages = (input.suggestions || []).map((s) =>
    buildNervousSignalMessageV0({
      suggestion: s,
      traceGraphLink: input.traceGraphLink,
      ticketId: input.ticketId
    })
  );

  for (const msg of messages) {
    signalInboxV0.push(msg);
    if (input.dispatchEvent !== false && typeof globalThis !== "undefined" && globalThis.dispatchEvent) {
      globalThis.dispatchEvent(
        new CustomEvent(RHIZOH_TICKET_SIGNAL_EVENT_V0, {
          detail: Object.freeze({ ...msg })
        })
      );
    }
  }

  return Object.freeze({
    schema: TICKET_NERVOUS_MESSAGE_SCHEMA_V0,
    bucket: "signal",
    messages: Object.freeze(messages),
    count: messages.length,
    interpretationOnly: true,
    nonExecutive: true
  });
}

export function listNervousSignalInboxV0(limit = 50) {
  return signalInboxV0.slice(-limit);
}

/** Test only. */
export function clearNervousSignalInboxForTestV0() {
  signalInboxV0.length = 0;
  messageSeqV0 = 0;
}
