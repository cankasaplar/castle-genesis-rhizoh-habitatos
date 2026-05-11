/**
 * Constitutional Closure Engine — pure fold: Execution → Trace → Proof → Drift → Mutation → Reschedule.
 * next = closeConstitution(prev, input)  (no I/O, no globals)
 */

import { chronosReschedule } from "../chronos/chronosConstitutionBridge.js";
import { observe } from "../epistemic/observeKernel.js";
import { verify } from "../epistemic/verifyKernel.js";
import { measureDiscomfort } from "../epistemic/discomfortKernel.js";
import { computeMemoryResonance } from "../epistemic/resonanceKernel.js";
import { resonanceWeightedNorm, solveResonanceField } from "../memory/resonanceIndex.js";
import { createMemoryArtifactsFromClosure } from "../memory/provenanceGraph.js";
import { mapConstitutionToOrbSignals } from "../ui/RhizohEpistemicOrbSignals.js";
import { driftImpulse, emaScalar, nudgeConstitutionVector } from "./constitutionalReducers.js";
import { proofPressure, stepConfidence } from "./constitutionalMetrics.js";
import { createSeal, tierToSovereignScalar } from "./constitutionalSeals.js";
import { cloneConstitutionalState, clamp01 } from "./constitutionalState.js";
import { canonicalInputString } from "./constitutionalLedger.js";
import { createMutationIntent } from "./constitutionalMutationIntent.js";
import { runConstitutionalReview } from "./constitutionalReview.js";
import { verifyMutation } from "./constitutionalMutationVerify.js";
import { createMutationSeal } from "./constitutionalMutationSeal.js";
import { applyMutation } from "./constitutionalMutationApply.js";

/**
 * @typedef {object} ClosureInput
 * @property {Record<string, unknown>} [worldState]
 * @property {Record<string, unknown>} [memoryState]
 * @property {Record<string, unknown>} [interactionState]
 * @property {Record<string, unknown>} [agentState]
 * @property {{ tier?: number, chronosBudgetMs?: number, provenanceHint?: number }} [verifyOptions]
 * @property {Parameters<typeof measureDiscomfort>[0]} [discomfortSignals]
 * @property {import('../memory/hyperEdgeStore.js').HyperEdgeStore} [hyperEdgeStore]
 * @property {import('../sovereignChronos.js').CapabilityToken | null} [capability]
 * @property {number} simTime
 * @property {number} now
 * @property {import('../chronos/chronosConstitutionBridge.js').ChronosSchedule | null} [prevSchedule]
 * @property {{ alpha?: number, beta?: number, gamma?: number, delta?: number }} [coef]
 * @property {number} [mutationEpsilon]
 * @property {string} [mutationReason]
 * @property {string[]} [allowedMutationPolicies]
 * @property {number} [mutationCadenceCycles]
 * @property {boolean} [forceUnsealedMutation]
 * @property {{ coherenceLift?: number, uncertaintyDamp?: number, salienceBoost?: number, noveltyDamp?: number, conflictDamp?: number }} [observationFilter]
 */

function deriveSealId(proof, tier, ts) {
  return `seal_${canonicalInputString({ c: proof.confidence, l: proof.legality, p: proof.provenance, x: proof.contradiction, tier, ts })}`;
}

/**
 * @param {import('./constitutionalState.js').ConstitutionalState} prev
 * @param {ClosureInput} input
 */
export function closeConstitution(prev, input) {
  const observation = observe({
    worldState: input.worldState,
    memoryState: input.memoryState,
    interactionState: input.interactionState,
    agentState: input.agentState,
    observationFilter: input.observationFilter ?? null
  });

  const { proof, tier, timedOut } = verify(observation, input.verifyOptions || {});

  const prevResonance = prev.resonance;
  let R = computeMemoryResonance(input.memoryState || {});
  let resonanceVector = {
    truthResonance: R,
    contradictionResonance: prev.contradiction,
    memoryResonance: R,
    legitimacyResonance: clamp01(1 - prev.sealEntropy),
    noveltyResonance: clamp01(observation.novelty)
  };
  if (input.hyperEdgeStore && input.hyperEdgeStore.edges && input.hyperEdgeStore.edges.size > 0) {
    resonanceVector = solveResonanceField(input.hyperEdgeStore);
    const normR = resonanceWeightedNorm(resonanceVector);
    R = clamp01(0.45 * R + 0.55 * normR);
  }

  const D = measureDiscomfort(input.discomfortSignals || {});

  const P = proofPressure(proof);
  const K = proof.contradiction;

  const prevConf = prev.confidence;
  const nextConf = stepConfidence(prevConf, P, K, D, R, input.coef || {});

  const next = cloneConstitutionalState(prev);
  next.version = prev.version + 1;
  next.confidence = nextConf;
  next.lastVerifiedAt = input.now;

  const deltaConf = nextConf - prevConf;
  const impulse = driftImpulse(deltaConf, proof.contradiction);
  next.drift = emaScalar(prev.drift, impulse, 0.22);

  next.contradiction = emaScalar(prev.contradiction, proof.contradiction, 0.35);
  next.resonance = emaScalar(prev.resonance, R, 0.28);

  const targetSov = tierToSovereignScalar(tier);
  next.sovereignTier = emaScalar(prev.sovereignTier, targetSov, 0.3);

  nudgeConstitutionVector(next.constitutionVector, observation, 0.06 + next.drift * 0.04);

  /** @type {import('./constitutionalState.js').Seal | null} */
  let seal = null;
  if (!timedOut && proof.confidence >= 0.34) {
    const entropySeed = clamp01(1 - proof.confidence * proof.legality + proof.contradiction * 0.35);
    next.sealEntropy = emaScalar(prev.sealEntropy, entropySeed, 0.4);
    seal = createSeal({
      id: deriveSealId(proof, tier, input.now),
      tier,
      confidence: proof.confidence,
      entropy: next.sealEntropy,
      timestamp: input.now
    });
    next.activeSeal = seal;
  } else {
    next.sealEntropy = emaScalar(prev.sealEntropy, clamp01(prev.sealEntropy * 1.02 + proof.contradiction * 0.05), 0.18);
    next.activeSeal = prev.activeSeal ? { ...prev.activeSeal } : null;
  }

  const mutationEpsilon = input.mutationEpsilon ?? 0.04;
  const mutationIntentResult = createMutationIntent({
    policyWeights: next.policyWeights,
    driftSignal: next.drift,
    contradiction: next.contradiction,
    discomfort: D,
    resonance: next.resonance,
    proofPressure: P,
    now: input.now,
    simTime: input.simTime,
    capability: input.capability ?? null,
    reason: input.mutationReason || "closure_drift_adaptation"
  });

  let mutationReview = null;
  let mutationProof = null;
  /** @type {{ sealId: string, intentId: string, tier: number, confidence: number, reviewScore: number, timestamp: number } | null} */
  let mutationSeal = null;
  let policyMutation = {
    applied: false,
    rejectedReason: mutationIntentResult.rejectedReason || "mutation_not_attempted",
    nextWeights: new Float32Array(next.policyWeights),
    deltaMax: 0
  };

  if (mutationIntentResult.ok && mutationIntentResult.intent) {
    mutationReview = runConstitutionalReview({
      intent: mutationIntentResult.intent,
      epsilon: mutationEpsilon,
      allowedPolicies: input.allowedMutationPolicies || []
    });
    if (mutationReview.pass) {
      mutationProof = verifyMutation({
        currentValue: mutationIntentResult.current,
        delta: mutationIntentResult.intent.delta,
        contradiction: next.contradiction,
        drift: next.drift,
        resonance: next.resonance,
        stabilityHorizonMin: Math.max(3, (input.prevSchedule?.verificationCadence || 1) * 3)
      });
      if (mutationProof.pass && !input.forceUnsealedMutation) {
        mutationSeal = createMutationSeal({
          intentId: mutationIntentResult.intent.id,
          tier,
          confidence: mutationProof.confidence,
          reviewScore: mutationReview.reviewScore,
          timestamp: input.now
        });
      }
      const cadenceCycles = input.mutationCadenceCycles ?? 2;
      const minMutationInterval = (input.prevSchedule?.wakeCycle || 1) * cadenceCycles;
      policyMutation = applyMutation({
        policyWeights: next.policyWeights,
        intent: mutationIntentResult.intent,
        mutationSeal,
        now: input.now,
        lastMutationAt: prev.lastMutationAt,
        minMutationInterval
      });
    } else {
      policyMutation.rejectedReason = mutationReview.rejectedReason;
    }
    if (mutationProof && !mutationProof.pass) {
      policyMutation.rejectedReason = mutationProof.rejectedReason;
    }
  }

  if (policyMutation.applied) {
    next.policyWeights = policyMutation.nextWeights;
    next.lastMutationAt = input.now;
  }

  const chronosSchedule = chronosReschedule({
    prevSchedule: input.prevSchedule ?? null,
    mutationApplied: policyMutation.applied,
    sovereignTier: next.sovereignTier,
    now: input.now,
    drift: next.drift,
    contradiction: next.contradiction,
    discomfort: D
  });

  const memoryArtifacts = createMemoryArtifactsFromClosure({
    now: input.now,
    resonanceDelta: next.resonance - prevResonance,
    constitutionId: "constitution.default",
    mutationIntent: mutationIntentResult.intent || null,
    mutationReview,
    mutationProof,
    mutationSeal,
    seal,
    observation,
    proof,
    contradiction: next.contradiction
  });

  const orbSignals = mapConstitutionToOrbSignals(next, {
    discomfort: D,
    resonanceVector,
    mutationPending: !!mutationIntentResult.intent && !policyMutation.applied,
    mutationSealed: !!mutationSeal
  });

  return {
    state: next,
    observation,
    proof,
    tier,
    timedOut,
    seal,
    discomfort: D,
    resonance: R,
    resonanceVector,
    proofPressure: P,
    mutationIntent: mutationIntentResult.intent || null,
    mutationReview,
    mutationProof,
    mutationSeal,
    memoryArtifacts,
    policyMutation,
    chronosSchedule,
    orbSignals
  };
}

/**
 * @param {import('./constitutionalState.js').ConstitutionalState} s
 */
export function fingerprintConstitutionalState(s) {
  const cv = Array.from(s.constitutionVector, (x) => x.toFixed(5)).join(",");
  const pw = Array.from(s.policyWeights, (x) => x.toFixed(5)).join(",");
  const sealId = s.activeSeal ? s.activeSeal.id : "none";
  return [
    s.version,
    s.confidence.toFixed(5),
    s.contradiction.toFixed(5),
    s.sealEntropy.toFixed(5),
    s.resonance.toFixed(5),
    s.drift.toFixed(5),
    s.sovereignTier.toFixed(5),
    cv,
    pw,
    s.lastMutationAt.toFixed(3),
    s.lastVerifiedAt.toFixed(3),
    sealId
  ].join("|");
}
