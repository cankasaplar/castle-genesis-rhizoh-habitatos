/**
 * Invited User Authority Gate v0 — quarantine cohort epistemic authority lock.
 * Invited users may observe + sandbox interact + emit feedback; not graph/council/stress authority.
 * RESEARCH-ONLY
 */

import { resolveInvitedUserQuarantineCohortV0 } from "./rhizohExecutionGovernanceSwitchboardV0.js";

export const INVITED_USER_AUTHORITY_GATE_SCHEMA_V0 = "castle.rhizoh.invited_user_authority_gate.v0";

export const EPISTEMIC_AUTHORITY_KIND_V0 = Object.freeze({
  GRAPH_WRITE: "graph_write",
  COUNCIL_TRIGGER: "council_trigger",
  STRESS_INJECTION: "stress_injection"
});

export const GOVERNANCE_ACTOR_V0 = Object.freeze({
  SYSTEM: "system",
  USER: "user"
});

const QUARANTINE_BLOCKED_AUTHORITIES_V0 = Object.freeze([
  EPISTEMIC_AUTHORITY_KIND_V0.GRAPH_WRITE,
  EPISTEMIC_AUTHORITY_KIND_V0.COUNCIL_TRIGGER,
  EPISTEMIC_AUTHORITY_KIND_V0.STRESS_INJECTION
]);

/**
 * @param {string} authorityKind
 * @param {{ actor?: string, subjectRef?: string|null }} [opts]
 */
export function assertInvitedUserEpistemicAuthorityV0(authorityKind, opts = {}) {
  const actor = String(opts.actor || GOVERNANCE_ACTOR_V0.USER).toLowerCase();
  const kind = String(authorityKind || "").trim();

  if (actor === GOVERNANCE_ACTOR_V0.SYSTEM) {
    return Object.freeze({
      schema: INVITED_USER_AUTHORITY_GATE_SCHEMA_V0,
      permitted: true,
      blocked: false,
      authorityKind: kind,
      actor,
      reason: null
    });
  }

  const cohort = resolveInvitedUserQuarantineCohortV0(
    opts.subjectRef != null ? { subjectRef: opts.subjectRef } : {}
  );

  if (!cohort.inQuarantineCohort) {
    return Object.freeze({
      schema: INVITED_USER_AUTHORITY_GATE_SCHEMA_V0,
      permitted: true,
      blocked: false,
      authorityKind: kind,
      actor,
      quarantineCohort: cohort,
      reason: null
    });
  }

  if (QUARANTINE_BLOCKED_AUTHORITIES_V0.includes(kind)) {
    return Object.freeze({
      schema: INVITED_USER_AUTHORITY_GATE_SCHEMA_V0,
      permitted: false,
      blocked: true,
      authorityKind: kind,
      actor,
      quarantineCohort: cohort,
      reason: `quarantine_cohort_no_${kind}`
    });
  }

  return Object.freeze({
    schema: INVITED_USER_AUTHORITY_GATE_SCHEMA_V0,
    permitted: true,
    blocked: false,
    authorityKind: kind,
    actor,
    quarantineCohort: cohort,
    reason: null
  });
}

/**
 * @param {string} authorityKind
 * @param {{ actor?: string }} [opts]
 * @returns {boolean}
 */
export function isInvitedUserEpistemicAuthorityPermittedV0(authorityKind, opts = {}) {
  return assertInvitedUserEpistemicAuthorityV0(authorityKind, opts).permitted;
}
