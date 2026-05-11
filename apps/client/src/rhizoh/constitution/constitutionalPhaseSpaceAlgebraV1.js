/**
 * RHIZOH constitutional phase-space algebra — θ üzerindeki yerel operatörlerin bileşimi ve komütatör artığı.
 * Sürekli manifold yerine pratik operatör cebiri (semigrup benzeri bileşim).
 */

import { stepRhizohConstitutionalAdaptation } from "./constitutionalDynamicsV1.js";
import { computeRhizohThetaAttractorField } from "./thetaAttractorFieldV1.js";
import {
  RHIZOH_THETA_PHASE_ELASTIC_MAX,
  RHIZOH_THETA_PHASE_IMMUNE_MIN,
  resolveRhizohThetaPhase
} from "./thetaPhaseTransitionV1.js";

export const RHIZOH_PHASE_SPACE_ALGEBRA_VERSION = "1.0.0";

/** Bilinen yerel üreteç etiketleri (program içinde birlikte kullanılabilir). */
export const RHIZOH_PHASE_SPACE_OPERATOR_IDS_V1 = Object.freeze([
  "identity",
  "adapt_once",
  "attractor_step",
  "elastic_projection",
  "balanced_projection",
  "immune_projection",
  "theta_shift",
  "lift_phase_readout"
]);

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * @typedef {{
 *   theta: number,
 *   stressIndex: number,
 *   thetaPrev?: number,
 *   adaptation?: { disabled?: boolean }
 * }} RhizohPhaseSpaceState
 */

/**
 * @param {string} operatorId
 * @param {RhizohPhaseSpaceState} state
 * @param {Record<string, unknown>} [args]
 * @returns {RhizohPhaseSpaceState}
 */
export function applyRhizohPhaseSpaceOperator(operatorId, state, args = {}) {
  const theta = clamp01(state.theta);
  const stressIndex = clamp01(state.stressIndex ?? 0.4);

  if (operatorId === "identity") {
    return { ...state, theta, stressIndex };
  }

  if (operatorId === "adapt_once") {
    const step = stepRhizohConstitutionalAdaptation({
      thetaPrev: theta,
      stressIndex,
      targetStress: args.targetStress != null ? Number(args.targetStress) : undefined,
      alpha: args.alpha != null ? Number(args.alpha) : undefined,
      thetaMin: args.thetaMin != null ? Number(args.thetaMin) : undefined,
      thetaMax: args.thetaMax != null ? Number(args.thetaMax) : undefined,
      adaptation:
        args.adaptation && typeof args.adaptation === "object"
          ? /** @type {{ disabled?: boolean }} */ (args.adaptation)
          : state.adaptation
    });
    return {
      ...state,
      thetaPrev: theta,
      theta: clamp01(step.thetaNext),
      stressIndex
    };
  }

  if (operatorId === "attractor_step") {
    const eta = args.eta != null ? clamp01(Number(args.eta)) : 0.09;
    const field = computeRhizohThetaAttractorField(theta, args.fieldOpts || {});
    const thetaNext = clamp01(theta + eta * (field.compositeAttractorTheta - theta));
    return { ...state, thetaPrev: theta, theta: thetaNext, stressIndex };
  }

  if (operatorId === "elastic_projection") {
    const strength = args.strength != null ? clamp01(Number(args.strength)) : 0.18;
    const center = clamp01(args.center ?? RHIZOH_THETA_PHASE_ELASTIC_MAX * 0.45);
    return {
      ...state,
      thetaPrev: theta,
      theta: clamp01(theta + strength * (center - theta)),
      stressIndex
    };
  }

  if (operatorId === "balanced_projection") {
    const strength = args.strength != null ? clamp01(Number(args.strength)) : 0.15;
    const center = clamp01(args.center ?? 0.46);
    return {
      ...state,
      thetaPrev: theta,
      theta: clamp01(theta + strength * (center - theta)),
      stressIndex
    };
  }

  if (operatorId === "immune_projection") {
    const strength = args.strength != null ? clamp01(Number(args.strength)) : 0.16;
    const center = clamp01(args.center ?? (RHIZOH_THETA_PHASE_IMMUNE_MIN + 0.96) / 2);
    return {
      ...state,
      thetaPrev: theta,
      theta: clamp01(theta + strength * (center - theta)),
      stressIndex
    };
  }

  if (operatorId === "theta_shift") {
    const delta = Number(args.delta);
    return {
      ...state,
      thetaPrev: theta,
      theta: clamp01(theta + (Number.isFinite(delta) ? delta : 0)),
      stressIndex
    };
  }

  if (operatorId === "lift_phase_readout") {
    const phase = resolveRhizohThetaPhase(theta).phase;
    return {
      ...state,
      theta,
      stressIndex,
      phaseReadout: phase
    };
  }

  return { ...state, theta, stressIndex, algebraNote: `unknown_operator:${operatorId}` };
}

/**
 * @param {ReadonlyArray<{ id: string, args?: Record<string, unknown> }>} chain soldan sağa uygulanır
 * @param {RhizohPhaseSpaceState} state0
 */
export function composeRhizohPhaseSpaceOperators(chain, state0) {
  let s = { ...state0, theta: clamp01(state0.theta), stressIndex: clamp01(state0.stressIndex ?? 0.4) };
  /** @type {RhizohPhaseSpaceState[]} */
  const trace = [];
  for (const step of chain) {
    s = applyRhizohPhaseSpaceOperator(step.id, s, step.args || {});
    trace.push({ ...s });
  }
  return { finalState: s, trace };
}

/**
 * Diskret komütatör [A,B] ≈ |θ(AB) − θ(BA)| (θ bileşimi sırasına duyarlılık).
 */
export function commutatorRhizohPhaseSpaceResidual(opA, opB, state0) {
  const ab = composeRhizohPhaseSpaceOperators([opA, opB], state0).finalState.theta;
  const ba = composeRhizohPhaseSpaceOperators([opB, opA], state0).finalState.theta;
  return Math.round(Math.abs(ab - ba) * 10000) / 10000;
}

/**
 * Faz etiketleri için kaba Cayley özet tablosu (θ yerine faz projeksiyonu).
 */
export function summarizeRhizohPhaseSpaceDiscreteTable() {
  const phases = /** @type {const} */ (["elastic_trust", "constitutional_balanced", "immune_aggression"]);
  /** @type {Record<string, Record<string, string>>} */
  const stepAfterMeet = {};
  for (const p of phases) {
    stepAfterMeet[p] = {};
    const thetaSeed =
      p === "elastic_trust"
        ? RHIZOH_THETA_PHASE_ELASTIC_MAX * 0.35
        : p === "immune_aggression"
          ? RHIZOH_THETA_PHASE_IMMUNE_MIN + 0.05
          : 0.46;
    for (const q of phases) {
      const opId =
        q === "elastic_trust"
          ? "elastic_projection"
          : q === "immune_aggression"
            ? "immune_projection"
            : "balanced_projection";
      const op = { id: opId, args: { strength: 0.55 } };
      const out = composeRhizohPhaseSpaceOperators([op], {
        theta: thetaSeed,
        stressIndex: 0.42
      }).finalState;
      stepAfterMeet[p][q] = resolveRhizohThetaPhase(out.theta).phase;
    }
  }
  return { phases: [...phases], coarseCayleyMeet: stepAfterMeet };
}
