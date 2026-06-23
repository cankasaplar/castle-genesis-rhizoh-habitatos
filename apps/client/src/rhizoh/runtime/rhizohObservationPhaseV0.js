/**
 * Rhizoh observation phase gate — controls when learning may influence policy.
 * RESEARCH-ONLY governance: observer before learner.
 */

export const RHIZOH_OBSERVATION_PHASE_V0 = Object.freeze({
  /** Phase 1: UGE passive observer — drift log only, zero policy influence */
  SILENT_OBSERVER: "silent_observer",
  /** Phase 2: memory formation (counterfactual archive) — still no move influence */
  MEMORY_FORMATION: "memory_formation",
  /** Phase 3: ChessRegretEngine + adaptive weighting may activate */
  LEARNING_ACTIVATION: "learning_activation"
});

/** Active phase — memory formation default: counterfactual archive + cluster weight closure. */
let activePhaseV0 = RHIZOH_OBSERVATION_PHASE_V0.MEMORY_FORMATION;

export function readRhizohObservationPhaseV0() {
  return activePhaseV0;
}

export function isLearningActivationEnabledV0() {
  return activePhaseV0 === RHIZOH_OBSERVATION_PHASE_V0.LEARNING_ACTIVATION;
}

export function isMemoryFormationEnabledV0() {
  return (
    activePhaseV0 === RHIZOH_OBSERVATION_PHASE_V0.MEMORY_FORMATION ||
    activePhaseV0 === RHIZOH_OBSERVATION_PHASE_V0.LEARNING_ACTIVATION
  );
}

export function isPolicyInfluenceForbiddenV0() {
  return activePhaseV0 !== RHIZOH_OBSERVATION_PHASE_V0.LEARNING_ACTIVATION;
}

/** @param {string} phase */
export function setRhizohObservationPhaseForTestV0(phase) {
  activePhaseV0 = phase;
}

export function resetRhizohObservationPhaseForTestV0() {
  activePhaseV0 = RHIZOH_OBSERVATION_PHASE_V0.MEMORY_FORMATION;
}
