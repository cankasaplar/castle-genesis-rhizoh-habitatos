/**
 * Ticket Kernel Facade V0 — orchestrates validator + admission + mutation record + defer queue.
 *
 * interpretationOnly · nonExecutive · no CubeState write; admission commit is external
 * @see docs/RHIZOH_REALITY_TRANSITION_ENGINE_V1.md
 */

import { evaluateClosedAdmissionV0 } from "../ingress/closedUserAdmissionEngineV0.js";
import { emitMutationRecordV0 } from "./mutationRecordEmitterV0.js";
import { enqueueDeferredIntentV0 } from "./recDeferredIntentQueueV0.js";
import { TICKET_REJECT_REASON_V0, TICKET_VALIDATION_DECISION_V0 } from "./ticketSecurityConstantsV0.js";
import { validateTicketTransitionV0 } from "./ticketSecurityValidatorV0.js";
import { registerActiveTicketV0 } from "./ticketTombstoneLayerV0.js";

/**
 * @typedef {import('./ticketTransitionIntentV1.js').TicketTransitionIntentV1} TicketTransitionIntentV1
 * @typedef {import('./ticketSecurityValidatorV0.js').TicketPacketLikeV0} TicketPacketLikeV0
 * @typedef {import('./ticketSecurityValidatorV0.js').TicketTransitionActorV0} TicketTransitionActorV0
 */

/**
 * @param {{
 *   intent: TicketTransitionIntentV1,
 *   ticket: TicketPacketLikeV0,
 *   actor: TicketTransitionActorV0,
 *   epochWindow?: string,
 *   epochId?: string,
 *   nowMs?: number,
 *   temporalContract?: object | null,
 *   admissionSignals?: object,
 *   subjectRef?: string,
 *   skipAdmission?: boolean,
 *   directTicketExecution?: boolean,
 *   deferOnEpochClosed?: boolean,
 *   targetRecEpoch?: string
 * }} input
 */
export function submitTicketTransitionV0(input) {
  registerActiveTicketV0(input.ticket.ticketId);

  let validation = validateTicketTransitionV0({
    intent: input.intent,
    ticket: input.ticket,
    actor: input.actor,
    targetCube: input.intent.targetCube,
    executionClass: input.intent.executionClass,
    epochWindow: input.epochWindow ?? input.intent.epochWindow,
    nowMs: input.nowMs,
    temporalContract: input.temporalContract,
    directTicketExecution: input.directTicketExecution,
    intentId: input.intent.intentId
  });

  let deferredEntry = null;
  if (
    !validation.valid &&
    input.deferOnEpochClosed === true &&
    validation.reasons.includes(TICKET_REJECT_REASON_V0.EPOCH_CLOSED) &&
    input.intent.intentId
  ) {
    deferredEntry = enqueueDeferredIntentV0({
      intent: input.intent,
      validation,
      deferReason: TICKET_REJECT_REASON_V0.EPOCH_CLOSED,
      targetRecEpoch: input.targetRecEpoch ?? input.intent.intentEpoch,
      enqueuedAtMs: input.nowMs
    });
    validation = Object.freeze({
      ...validation,
      valid: false,
      deferred: true,
      decision: TICKET_VALIDATION_DECISION_V0.REJECTED
    });
  }

  let admission = null;
  if (
    validation.valid &&
    !input.skipAdmission &&
    input.subjectRef &&
    (input.intent.executionClass === "mutate_l1" || input.intent.executionClass === "mutate_l2")
  ) {
    admission = evaluateClosedAdmissionV0({
      subjectRef: input.subjectRef,
      signals: input.admissionSignals || {}
    });
    if (admission.verdict !== "admit") {
      validation = Object.freeze({
        ...validation,
        valid: false,
        reasons: Object.freeze([...validation.reasons, `admission_${admission.verdict}`]),
        decision: TICKET_VALIDATION_DECISION_V0.REJECTED,
        mutationClass: "denied"
      });
    }
  }

  const decision =
    validation.decision ||
    (validation.valid ? TICKET_VALIDATION_DECISION_V0.ACCEPTED : TICKET_VALIDATION_DECISION_V0.REJECTED);

  const mutationRecord = emitMutationRecordV0({
    decision,
    validation,
    intent: input.intent,
    ticket: input.ticket,
    actor: input.actor,
    epochId: input.epochId ?? input.intent.intentEpoch,
    cubeId: input.ticket.contextNodeCube,
    issuedAtMs: input.nowMs
  });

  return Object.freeze({
    interpretationOnly: true,
    nonExecutive: true,
    validation,
    admission,
    mutationRecord,
    deferredEntry,
    cubeStateCommit: false,
    proposedCubeDelta: input.intent.proposedCubeDelta ?? null,
    auditChain: Object.freeze({
      ticketId: input.ticket.ticketId,
      intentId: input.intent.intentId,
      mutationId: mutationRecord.mutationId
    })
  });
}
