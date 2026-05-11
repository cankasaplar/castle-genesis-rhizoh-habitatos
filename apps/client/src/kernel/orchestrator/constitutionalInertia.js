/**
 * Constitutional Inertia Constraint — anti–resonance-runaway gate.
 * ΔC_max = κ · (1 − sealEntropy); weak seal → slow confidence motion.
 * High contradiction + memory pressure → damp aggressive feedback.
 */

import { clamp01, cloneConstitutionalState } from "../constitutional/constitutionalState.js";

/**
 * @param {object} o
 * @param {import('../constitutional/constitutionalState.js').ConstitutionalState} o.prevState
 * @param {import('../constitutional/constitutionalState.js').ConstitutionalState} o.nextState
 * @param {ReturnType<import('./constitutionalFeedbackInjector.js').injectConstitutionalFeedback>} o.feedback
 * @param {number} [o.kappa] max confidence step coefficient (typ. 0.15–0.25)
 * @param {number[]} [o.pressureVector] orchestrator pressure (memory slot index 3)
 */
export function applyInertiaConstraint(o) {
  const kappa = o.kappa ?? 0.2;
  const h = clamp01(o.nextState.sealEntropy);
  const maxDeltaConf = kappa * (1 - h);

  const adjustedState = cloneConstitutionalState(o.nextState);
  const d = adjustedState.confidence - o.prevState.confidence;
  if (Math.abs(d) > maxDeltaConf) {
    adjustedState.confidence = clamp01(o.prevState.confidence + Math.sign(d || 1) * maxDeltaConf);
  }

  const kContr = clamp01(o.nextState.contradiction);
  const memP = clamp01(o.pressureVector?.[3] ?? 0.5);
  const runawayRisk = clamp01(kContr * 0.42 + memP * 0.38 + h * 0.2);
  const feedbackScale = clamp01((1 - runawayRisk * 0.62) * (0.28 + (1 - h) * 0.72));

  const f = o.feedback;
  const scaledMemory = Object.freeze({
    salienceBoost: clamp01(f.memoryBiasShift.salienceBoost * feedbackScale),
    coherenceTilt: clamp01(f.memoryBiasShift.coherenceTilt * feedbackScale),
    noveltyGate: clamp01(f.memoryBiasShift.noveltyGate * (1 - (1 - feedbackScale) * 0.35)),
    sealEcho: clamp01(f.memoryBiasShift.sealEcho * feedbackScale)
  });
  const scaledPressure = Object.freeze(
    f.pressureRebalance.map((x) => clamp01(x * feedbackScale))
  );
  const scaledTopo = Object.freeze({
    sovereignPull: clamp01(f.topologyReinjection.sovereignPull * feedbackScale),
    clusterTighten: clamp01(f.topologyReinjection.clusterTighten * feedbackScale),
    wakeScale: clamp01(f.topologyReinjection.wakeScale * feedbackScale + (1 - feedbackScale))
  });
  const scaledSched = Object.freeze({
    urgencyBias: clamp01(f.schedulerReweight.urgencyBias * feedbackScale),
    calmBias: clamp01(f.schedulerReweight.calmBias * (0.85 + 0.15 * feedbackScale))
  });
  const scaledObs = Object.freeze({
    coherenceLift: clamp01(f.observationFilterUpdate.coherenceLift * feedbackScale),
    uncertaintyDamp: clamp01(f.observationFilterUpdate.uncertaintyDamp * feedbackScale),
    salienceBoost: clamp01(f.observationFilterUpdate.salienceBoost * feedbackScale),
    noveltyDamp: clamp01(f.observationFilterUpdate.noveltyDamp * feedbackScale),
    conflictDamp: clamp01(f.observationFilterUpdate.conflictDamp * feedbackScale)
  });

  const feedback = Object.freeze({
    memoryBiasShift: scaledMemory,
    pressureRebalance: scaledPressure,
    topologyReinjection: scaledTopo,
    schedulerReweight: scaledSched,
    observationFilterUpdate: scaledObs
  });

  const meta = Object.freeze({
    maxDeltaConf,
    feedbackScale,
    runawayRisk,
    confidenceClamped: Math.abs(d) > maxDeltaConf
  });

  return Object.freeze({ adjustedState, feedback, meta });
}
