/**
 * Constitutional Time Slice — one atomic epistemic step:
 * perception → constitution → memory → feedback → inertia.
 * Pure: no I/O; caller persists store / ledger.
 */

import { observe } from "../epistemic/observeKernel.js";
import { closeConstitution } from "../constitutional/constitutionalClosure.js";
import { orchestrateMemory } from "./memoryOrchestrator.js";
import { injectConstitutionalFeedback } from "./constitutionalFeedbackInjector.js";
import { applyInertiaConstraint } from "./constitutionalInertia.js";

/**
 * @typedef {object} EpochAtomicSnapshot
 * @property {import('../constitutional/constitutionalState.js').ConstitutionalState} constitution
 * @property {string} storeHash
 * @property {number[]} pressure
 * @property {{ truthResonance: number, contradictionResonance: number, memoryResonance: number, legitimacyResonance: number, noveltyResonance: number }} resonanceField
 */

/**
 * @typedef {object} EpochLineage
 * @property {string} previousEpochHash
 * @property {string} lineageBranchId
 * @property {readonly string[]} mergeAncestry merged parent epoch hashes (empty if linear)
 * @property {string} mutationDeltaHash numeric + semantic “why changed” fingerprint
 * @property {readonly number[]} identityDriftVector length 9 — + ΔmemoryLegitimacyResonance
 */

function fnv1a32Hex(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return `0x${h.toString(16)}`;
}

/**
 * Policy / mutation step fingerprint for lineage (numeric deltas + semantic “why”).
 * @param {import('../constitutional/constitutionalState.js').ConstitutionalState} prev
 * @param {import('../constitutional/constitutionalState.js').ConstitutionalState} next
 * @param {{ applied: boolean, deltaMax?: number, rejectedReason?: string | null }} policyMutation
 * @param {object} [semantics]
 * @param {{ reason?: string, id?: string } | null} [semantics.mutationIntent]
 * @param {{ tier?: number } | null} [semantics.mutationSeal]
 * @param {{ reviewScore?: number, pass?: boolean } | null} [semantics.mutationReview]
 */
export function hashMutationDelta(prev, next, policyMutation, semantics = {}) {
  const deltas = [];
  for (let i = 0; i < prev.policyWeights.length; i++) {
    deltas.push(Number((next.policyWeights[i] - prev.policyWeights[i]).toFixed(8)));
  }
  const reason = (semantics.mutationIntent && semantics.mutationIntent.reason) || "";
  const reasonHash = fnv1a32Hex(reason);
  const sealTier =
    semantics.mutationSeal && typeof semantics.mutationSeal.tier === "number"
      ? semantics.mutationSeal.tier
      : -1;
  const reviewScoreBucket =
    semantics.mutationReview && typeof semantics.mutationReview.reviewScore === "number"
      ? Math.floor(semantics.mutationReview.reviewScore * 10) / 10
      : -1;
  const canonical = JSON.stringify({
    applied: policyMutation.applied,
    deltaMax: policyMutation.deltaMax ?? 0,
    rejectedReason: policyMutation.rejectedReason ?? null,
    reasonHash,
    sealTier,
    reviewScoreBucket,
    deltas
  });
  return fnv1a32Hex(canonical);
}

/**
 * Cross-epoch identity continuity — bounded deltas in constitutional coordinates.
 * @param {import('../constitutional/constitutionalState.js').ConstitutionalState} prev
 * @param {import('../constitutional/constitutionalState.js').ConstitutionalState} next
 * @param {object} [opts]
 * @param {number} [opts.legitimacyResonanceDelta] Δ legitimacyResonance on memory field (substrate identity)
 * @returns {readonly number[]}
 */
export function computeIdentityDriftVector(prev, next, opts = {}) {
  const v = [
    next.confidence - prev.confidence,
    next.contradiction - prev.contradiction,
    next.sealEntropy - prev.sealEntropy,
    next.resonance - prev.resonance,
    next.drift - prev.drift,
    next.sovereignTier - prev.sovereignTier
  ];
  let pwAcc = 0;
  const nP = prev.policyWeights.length;
  for (let i = 0; i < nP; i++) pwAcc += next.policyWeights[i] - prev.policyWeights[i];
  v.push(Number((pwAcc / Math.max(1, nP)).toFixed(8)));
  let cvAcc = 0;
  const nC = prev.constitutionVector.length;
  for (let i = 0; i < nC; i++) cvAcc += Math.abs(next.constitutionVector[i] - prev.constitutionVector[i]);
  v.push(Number((cvAcc / Math.max(1, nC)).toFixed(8)));
  const legDelta =
    typeof opts.legitimacyResonanceDelta === "number"
      ? opts.legitimacyResonanceDelta
      : 0;
  v.push(Number(legDelta.toFixed(8)));
  return Object.freeze(v.map((x) => Number(x.toFixed(8))));
}

/**
 * Chained epoch identity — commits to parent hash + atomic slice + mutation + drift.
 * @param {object} o
 * @param {string} o.previousEpochHash
 * @param {string} o.atomicHash from hashEpochAtomicSnapshot
 * @param {string} o.mutationDeltaHash
 * @param {readonly number[]} o.identityDriftVector
 */
export function hashChainedEpoch(o) {
  const canonical = JSON.stringify({
    parent: o.previousEpochHash,
    branch: o.lineageBranchId ?? "main",
    merge: o.mergeAncestry ?? [],
    atom: o.atomicHash,
    mut: o.mutationDeltaHash,
    drift: o.identityDriftVector
  });
  return fnv1a32Hex(canonical);
}

/**
 * @param {object} o
 * @param {import('../constitutional/constitutionalState.js').ConstitutionalState} o.prevState
 * @param {Parameters<typeof closeConstitution>[1]} o.closureInput
 * @param {import('../memory/hyperEdgeStore.js').HyperEdgeStore | null} [o.prevStore]
 * @param {number[]} [o.prevPressure]
 * @param {number} [o.kappa]
 * @param {"LOW" | "NORMAL" | "URGENT" | "SOVEREIGN"} [o.basePriority]
 * @param {string | null} [o.previousEpochHash] genesis if omitted
 * @param {number} [o.previousLegitimacyResonance] prior epoch memory-field legitimacy (default 0.45)
 * @param {string} [o.lineageBranchId] e.g. main, fork-A
 * @param {string[]} [o.mergeAncestry] optional merged parent hashes
 */
export function runConstitutionalEpoch(o) {
  const closureInput = o.closureInput;
  const perception = observe({
    worldState: closureInput.worldState,
    memoryState: closureInput.memoryState,
    interactionState: closureInput.interactionState,
    agentState: closureInput.agentState,
    observationFilter: closureInput.observationFilter ?? null
  });

  const closeOut = closeConstitution(o.prevState, closureInput);

  const orch = orchestrateMemory({
    memoryArtifacts: closeOut.memoryArtifacts,
    prevStore: o.prevStore ?? null,
    prevPressure: o.prevPressure ?? null,
    basePriority: o.basePriority || "NORMAL",
    sovereignTier: closeOut.state.sovereignTier,
    contradiction: closeOut.state.contradiction,
    discomfort: closeOut.discomfort,
    constitutionSnapshot: closeOut.state
  });

  const rawFeedback = injectConstitutionalFeedback({
    seal: closeOut.seal,
    drift: closeOut.state.drift,
    policyMutation: closeOut.policyMutation,
    resonanceDelta: closeOut.memoryArtifacts.resonanceDelta ?? 0,
    pressureDelta: orch.pressureDelta,
    state: closeOut.state
  });

  const stabilized = applyInertiaConstraint({
    prevState: o.prevState,
    nextState: closeOut.state,
    feedback: rawFeedback,
    kappa: o.kappa ?? 0.2,
    pressureVector: orch.pressureVector
  });

  /** @type {EpochAtomicSnapshot} */
  const atomicSnapshot = Object.freeze({
    constitution: stabilized.adjustedState,
    storeHash: orch.storeHash,
    pressure: orch.pressureVector,
    resonanceField: orch.resonanceField
  });

  const previousEpochHash = o.previousEpochHash ?? "0xgenesis";
  const lineageBranchId = o.lineageBranchId ?? "main";
  const mergeAncestry = Object.freeze(o.mergeAncestry ? [...o.mergeAncestry] : []);

  const prevLeg = o.previousLegitimacyResonance ?? 0.45;
  const legNow = orch.resonanceField.legitimacyResonance;
  const legitimacyResonanceDelta = legNow - prevLeg;

  const mutationDeltaHash = hashMutationDelta(
    o.prevState,
    stabilized.adjustedState,
    closeOut.policyMutation,
    {
      mutationIntent: closeOut.mutationIntent,
      mutationSeal: closeOut.mutationSeal,
      mutationReview: closeOut.mutationReview
    }
  );
  const identityDriftVector = computeIdentityDriftVector(o.prevState, stabilized.adjustedState, {
    legitimacyResonanceDelta
  });

  /** @type {EpochLineage} */
  const lineage = Object.freeze({
    previousEpochHash,
    lineageBranchId,
    mergeAncestry,
    mutationDeltaHash,
    identityDriftVector
  });

  const atomicHash = hashEpochAtomicSnapshot(atomicSnapshot);
  const epochHash = hashChainedEpoch({
    previousEpochHash,
    lineageBranchId,
    mergeAncestry,
    atomicHash,
    mutationDeltaHash,
    identityDriftVector
  });

  const constitutionPhase = {
    ...closeOut,
    state: stabilized.adjustedState
  };

  return Object.freeze({
    perception,
    constitution: constitutionPhase,
    orchestration: orch,
    feedbackRaw: rawFeedback,
    feedback: stabilized.feedback,
    inertia: stabilized.meta,
    nextObservationFilter: stabilized.feedback.observationFilterUpdate,
    nextStore: orch.store,
    nextPressure: orch.pressureVector,
    atomicSnapshot,
    atomicHash,
    lineage,
    legitimacyResonance: legNow,
    epochHash
  });
}

/**
 * @param {EpochAtomicSnapshot} snap
 */
export function hashEpochAtomicSnapshot(snap) {
  const canonical = JSON.stringify({
    c: snap.constitution.confidence.toFixed(6),
    se: snap.constitution.sealEntropy.toFixed(6),
    k: snap.constitution.contradiction.toFixed(6),
    sh: snap.storeHash,
    p: snap.pressure.map((x) => x.toFixed(6)),
    rf: snap.resonanceField
  });
  let x = 5381;
  for (let i = 0; i < canonical.length; i++) x = ((x << 5) + x + canonical.charCodeAt(i)) >>> 0;
  return `0x${x.toString(16)}`;
}
