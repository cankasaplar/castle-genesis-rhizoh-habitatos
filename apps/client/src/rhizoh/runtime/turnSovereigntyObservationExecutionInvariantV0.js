/**
 * Observation ↔ Execution invariant — observation must NEVER influence authority selection.
 * Prevents over-observation drift (consistency field > execution field).
 * @see apps/client/docs/RHIZOH_BEHAVIORAL_TURN_SOVEREIGNTY_V0.md §14
 */

import { logCastleLifecycleV0 } from "./rhizohProductionLogNamespacesV0.js";
import { RHIZOH_OBSERVATION_EXECUTION_BOUNDARY_V0 } from "./rhizohInfluenceObservabilityFirewallV0.js";

export const TURN_SOVEREIGNTY_OBSERVATION_EXECUTION_INVARIANT_V0 =
  "castle.rhizoh.turn_sovereignty.observation_execution_invariant.v0";

/** Fields that must never feed resolveTurnSovereigntyV0 / authority selection. */
export const FORBIDDEN_AUTHORITY_INPUT_KEYS_V0 = Object.freeze([
  "consistencyField",
  "behaviorConsistency",
  "driftEngine",
  "driftReport",
  "influenceFeedback",
  "layerWeights",
  "driftSignals",
  "conflictHeatmap",
  "silentOverrideHeatmap",
  "boundaryViolations",
  "fromObservationLayer"
]);

export const SOVEREIGNTY_LAYER_WEIGHT_POLICY_V0 = Object.freeze({
  executionFieldWeight: 1,
  observationFieldWeight: 0,
  observationInfluencesAuthority: false,
  alignment: RHIZOH_OBSERVATION_EXECUTION_BOUNDARY_V0
});

/**
 * Strip observation artifacts from sovereignty input envelope.
 * @param {object} input
 */
export function sanitizeTurnSovereigntyInputV0(input = {}) {
  const src = input && typeof input === "object" ? input : {};
  /** @type {string[]} */
  const stripped = [];

  const out = { ...src };
  for (const key of FORBIDDEN_AUTHORITY_INPUT_KEYS_V0) {
    if (key in out) {
      stripped.push(key);
      delete out[key];
    }
  }

  if (out.candidates && typeof out.candidates === "object") {
    const c = { ...out.candidates };
    for (const key of FORBIDDEN_AUTHORITY_INPUT_KEYS_V0) {
      if (key in c) {
        stripped.push(`candidates.${key}`);
        delete c[key];
      }
    }
    out.candidates = c;
  }

  if (out.runtime && typeof out.runtime === "object") {
    const r = { ...out.runtime };
    for (const key of ["driftSignals", "consistencyRates", "influenceFeedback"]) {
      if (key in r) {
        stripped.push(`runtime.${key}`);
        delete r[key];
      }
    }
    out.runtime = r;
  }

  return Object.freeze({
    input: out,
    stripped: Object.freeze(stripped),
    observationInfluencesAuthority: false
  });
}

/**
 * @param {object} input
 * @param {string} [caller]
 */
export function assertObservationDoesNotInfluenceAuthorityV0(input = {}, caller = "resolveTurnSovereignty") {
  const { input: sanitized, stripped } = sanitizeTurnSovereigntyInputV0(input);
  if (stripped.length) {
    logCastleLifecycleV0("TURN_SOVEREIGNTY_OBSERVATION_STRIP", {
      caller,
      stripped,
      invariant: TURN_SOVEREIGNTY_OBSERVATION_EXECUTION_INVARIANT_V0
    });
  }
  return sanitized;
}
