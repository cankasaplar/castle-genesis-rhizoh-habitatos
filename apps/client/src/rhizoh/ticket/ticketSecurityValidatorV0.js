/**
 * Ticket Security Validator V0 — single source of truth for "may this transition occur?"
 *
 * interpretationOnly · nonExecutive · validates only; does not mutate state
 * @see docs/RHIZOH_SECURITY_BOUNDARY_V1.md (SC-01, SC-02, SC-03)
 */

import { assertNodeExecutionJurisdictionV0 } from "../runtime/continuity/temporalIdentityBindingV0.js";
import { isTombstonedTicketV0 } from "./ticketTombstoneLayerV0.js";
import {
  CORE_EPOCH_WINDOWS_V0,
  EXECUTION_CLASS_RANK_V0,
  MUTATE_EPOCH_WINDOWS_V0,
  TICKET_REJECT_REASON_V0,
  TICKET_SECURITY_VALIDATOR_VERSION_V0,
  TICKET_VALIDATION_DECISION_V0
} from "./ticketSecurityConstantsV0.js";
import {
  TICKET_EXECUTION_CLASS_V0,
  TICKET_EPOCH_WINDOW_V0,
  TRANSITION_REQUIRED_CLASS_V0
} from "./ticketTransitionIntentV0.js";

/**
 * @typedef {Object} TicketPacketLikeV0
 * @property {string} ticketId
 * @property {string} [capabilityScope]
 * @property {string} [contextNodeCube]
 * @property {string} [traceGraphLink]
 * @property {string} [executionClass]
 * @property {{ usageLimit?: number, usageCount?: number, expiresAt?: string }} [quota]
 * @property {{ continuityAnchor?: string }} [journey]
 * @property {string} [parentCapabilityScope]
 */

/**
 * @typedef {Object} TicketTransitionActorV0
 * @property {string} actorId
 * @property {boolean} [userSigned]
 * @property {boolean} [frozenDagVerified]
 * @property {boolean} [admissionCommit]
 */

/**
 * @param {string} expiresAt
 * @param {number} nowMs
 */
function isTicketExpiredV0(expiresAt, nowMs) {
  if (!expiresAt) return true;
  const t = Date.parse(expiresAt);
  if (!Number.isFinite(t)) return true;
  return nowMs >= t;
}

/**
 * @param {string} requested
 * @param {string} required
 */
function classMeetsRequirementV0(requested, required) {
  const rReq = EXECUTION_CLASS_RANK_V0[required] ?? -1;
  const rGot = EXECUTION_CLASS_RANK_V0[requested] ?? -1;
  if (required === TICKET_EXECUTION_CLASS_V0.MUTATE_L1) {
    return requested === TICKET_EXECUTION_CLASS_V0.MUTATE_L1 || requested === TICKET_EXECUTION_CLASS_V0.MUTATE_L2;
  }
  return rGot >= rReq;
}

/**
 * @param {string} executionClass
 * @param {string} [epochWindow]
 */
function epochAllowsClassV0(executionClass, epochWindow) {
  const epoch = epochWindow || TICKET_EPOCH_WINDOW_V0.REC_SOFT;
  if (executionClass === TICKET_EXECUTION_CLASS_V0.READ_ONLY || executionClass === TICKET_EXECUTION_CLASS_V0.SUGGEST) {
    return epoch === TICKET_EPOCH_WINDOW_V0.REC_SOFT || MUTATE_EPOCH_WINDOWS_V0.includes(epoch);
  }
  if (executionClass === TICKET_EXECUTION_CLASS_V0.SYSTEM_RECONCILE) {
    return CORE_EPOCH_WINDOWS_V0.includes(epoch);
  }
  if (
    executionClass === TICKET_EXECUTION_CLASS_V0.MUTATE_L1 ||
    executionClass === TICKET_EXECUTION_CLASS_V0.MUTATE_L2
  ) {
    return MUTATE_EPOCH_WINDOWS_V0.includes(epoch);
  }
  return false;
}

/**
 * @param {{
 *   intent: import('./ticketTransitionIntentV0.js').TicketTransitionIntentV0,
 *   ticket?: TicketPacketLikeV0 | null,
 *   actor?: TicketTransitionActorV0 | null,
 *   targetCube?: string | null,
 *   executionClass?: string,
 *   epochWindow?: string,
 *   nowMs?: number,
 *   temporalContract?: object | null,
 *   childCapabilityScope?: string | null,
 *   directTicketExecution?: boolean,
 *   intentId?: string | null
 * }} input
 */
export function validateTicketTransitionV0(input) {
  const reasons = [];
  const intent = input.intent;
  const ticket = input.ticket ?? null;
  const actor = input.actor ?? null;
  const nowMs = Number.isFinite(input.nowMs) ? input.nowMs : Date.now();
  const executionClass = String(input.executionClass || intent.executionClass || "");
  const epochWindow = String(input.epochWindow || intent.epochWindow || TICKET_EPOCH_WINDOW_V0.REC_SOFT);
  const targetCube = input.targetCube ?? intent.targetCube ?? null;
  const intentId = String(input.intentId || intent.intentId || "");

  if (input.directTicketExecution === true) {
    reasons.push(TICKET_REJECT_REASON_V0.TICKET_PACKET_DIRECT_EXECUTION);
  }

  if (
    executionClass !== TICKET_EXECUTION_CLASS_V0.READ_ONLY &&
    executionClass !== TICKET_EXECUTION_CLASS_V0.SUGGEST &&
    !intentId
  ) {
    reasons.push(TICKET_REJECT_REASON_V0.INTENT_ID_REQUIRED);
  }

  if (!ticket?.ticketId) {
    reasons.push(TICKET_REJECT_REASON_V0.TICKET_MISSING);
    return buildValidationResultV0(false, reasons, executionClass, TICKET_VALIDATION_DECISION_V0.REJECTED);
  }

  if (isTombstonedTicketV0(ticket.ticketId)) {
    reasons.push(TICKET_REJECT_REASON_V0.TICKET_TOMBSTONED);
    return buildValidationResultV0(false, reasons, executionClass, TICKET_VALIDATION_DECISION_V0.REJECTED);
  }

  if (isTicketExpiredV0(ticket.quota?.expiresAt, nowMs)) {
    if (executionClass === TICKET_EXECUTION_CLASS_V0.READ_ONLY) {
      return buildValidationResultV0(true, [], executionClass, TICKET_VALIDATION_DECISION_V0.ACCEPTED, {
        mutationClass: "read_only_restore"
      });
    }
    reasons.push(TICKET_REJECT_REASON_V0.TICKET_EXPIRED);
    return buildValidationResultV0(false, reasons, executionClass, TICKET_VALIDATION_DECISION_V0.EXPIRED);
  }

  const usageLimit = Number(ticket.quota?.usageLimit ?? 0);
  const usageCount = Number(ticket.quota?.usageCount ?? 0);
  if (usageLimit > 0 && usageCount >= usageLimit) {
    reasons.push(TICKET_REJECT_REASON_V0.QUOTA_EXCEEDED);
    return buildValidationResultV0(false, reasons, executionClass, TICKET_VALIDATION_DECISION_V0.QUOTA_DENIED);
  }

  if (!epochAllowsClassV0(executionClass, epochWindow)) {
    reasons.push(TICKET_REJECT_REASON_V0.EPOCH_CLOSED);
  }

  const traceGraphLink = intent.traceGraphLink || ticket.traceGraphLink;
  const continuityAnchor = intent.continuityAnchor || ticket.journey?.continuityAnchor;
  const contextNodeCube = ticket.contextNodeCube || intent.sourceCube;
  if (!traceGraphLink || !continuityAnchor || !contextNodeCube) {
    reasons.push(TICKET_REJECT_REASON_V0.ORPHAN_EDGE);
  }

  const requiredClass = TRANSITION_REQUIRED_CLASS_V0[intent.transitionType];
  if (requiredClass && !classMeetsRequirementV0(executionClass, requiredClass)) {
    reasons.push(TICKET_REJECT_REASON_V0.CLASS_INSUFFICIENT);
  }

  if (
    ticket.executionClass === TICKET_EXECUTION_CLASS_V0.SUGGEST &&
    (executionClass === TICKET_EXECUTION_CLASS_V0.MUTATE_L1 ||
      executionClass === TICKET_EXECUTION_CLASS_V0.MUTATE_L2)
  ) {
    reasons.push(TICKET_REJECT_REASON_V0.SUGGEST_MUTATE_FORBIDDEN);
  }

  if (executionClass === TICKET_EXECUTION_CLASS_V0.SYSTEM_RECONCILE) {
    if (!CORE_EPOCH_WINDOWS_V0.includes(epochWindow)) {
      reasons.push(TICKET_REJECT_REASON_V0.SYSTEM_RECONCILE_OUTSIDE_CORE);
    }
    if (intent.directCubeMutation === true || targetCube) {
      reasons.push(TICKET_REJECT_REASON_V0.SYSTEM_RECONCILE_CUBE_WRITE_FORBIDDEN);
    }
  }

  const isMutate =
    executionClass === TICKET_EXECUTION_CLASS_V0.MUTATE_L1 ||
    executionClass === TICKET_EXECUTION_CLASS_V0.MUTATE_L2;

  if (isMutate) {
    const signed = actor?.userSigned === true;
    const dag = actor?.frozenDagVerified === true;
    const admission = actor?.admissionCommit === true;
    if (!signed && !dag && !admission) {
      reasons.push(TICKET_REJECT_REASON_V0.UNSIGNED_MUTATE);
    }
    if (!admission && targetCube && !signed && !dag) {
      reasons.push(TICKET_REJECT_REASON_V0.DIRECT_CUBE_MUTATE_FORBIDDEN);
    }
    const jurisdiction = assertNodeExecutionJurisdictionV0(input.temporalContract ?? null);
    if (!jurisdiction.ok) {
      reasons.push(TICKET_REJECT_REASON_V0.NO_EXECUTION_RIGHT);
    }
  }

  if (input.childCapabilityScope && ticket.capabilityScope) {
    if (!isCapabilitySubsetV0(input.childCapabilityScope, ticket.capabilityScope)) {
      reasons.push(TICKET_REJECT_REASON_V0.AUTHORITY_ESCALATION);
    }
  }

  const valid = reasons.length === 0;
  const decision = valid
    ? TICKET_VALIDATION_DECISION_V0.ACCEPTED
    : reasons.includes(TICKET_REJECT_REASON_V0.QUOTA_EXCEEDED)
      ? TICKET_VALIDATION_DECISION_V0.QUOTA_DENIED
      : reasons.includes(TICKET_REJECT_REASON_V0.TICKET_EXPIRED)
        ? TICKET_VALIDATION_DECISION_V0.EXPIRED
        : TICKET_VALIDATION_DECISION_V0.REJECTED;

  return buildValidationResultV0(valid, reasons, executionClass, decision, {
    mutationClass: valid && isMutate ? "allowed" : valid ? "read_only" : "denied",
    intentId: intentId || null
  });
}

/**
 * @param {string} child
 * @param {string} parent
 */
function isCapabilitySubsetV0(child, parent) {
  if (child === parent) return true;
  return child.startsWith(`${parent}.`) || child.startsWith(`${parent}:`);
}

/**
 * @param {boolean} valid
 * @param {string[]} reasons
 * @param {string} executionClass
 * @param {string} decision
 * @param {{ mutationClass?: string }} [extra]
 */
function buildValidationResultV0(valid, reasons, executionClass, decision, extra = {}) {
  return Object.freeze({
    interpretationOnly: true,
    nonExecutive: true,
    validatorVersion: TICKET_SECURITY_VALIDATOR_VERSION_V0,
    valid,
    reasons: Object.freeze([...reasons]),
    mutationClass: extra.mutationClass ?? (valid ? "allowed" : "denied"),
    executionClass,
    decision,
    intentId: extra.intentId ?? null,
    deferred: extra.deferred === true
  });
}
