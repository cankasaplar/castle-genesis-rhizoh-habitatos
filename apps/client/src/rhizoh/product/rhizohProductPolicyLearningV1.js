/**
 * Reactive karar + öğrenilmiş (guard’lı) policy birleşimi — closed-loop’un policy yüzeyi.
 */

import { emitRhizohBehaviorSignal } from "../telemetry/rhizohBehaviorSignalsV1.js";
import { getRhizohBehaviorMetricsSnapshot } from "../telemetry/rhizohBehaviorMetricsAggregatorV1.js";
import { computeRhizohProductDecisionOverlay } from "./rhizohProductDecisionLayerV1.js";
import {
  externalTruthBlocksLearningMerge,
  getRhizohExternalGroundTruthCachedSync
} from "./rhizohExternalGroundTruthV1.js";
import { getRhizohExternalLossLearningRateMultiplier, getRhizohExternalLossMergeGate } from "./rhizohExternalLossFunctionV1.js";
import {
  guardClosureBannerMs,
  guardGovernanceGateBond01,
  guardIntroSeenTurnsForTrust,
  guardIntroTurnsForTrust,
  guardTrustBondForNormal,
  guardTrustTurnsForNormal,
  hasLearnedRhizohProductPatch,
  loadRhizohProductPolicyState,
  readRhizohPolicyShadowFinalize
} from "./rhizohProductPolicyStoreV1.js";
import {
  computeRhizohProductionTruthDrift,
  ensureRhizohProductionTruthAnchor,
  readRhizohPolicyAnchorFinalize,
  readRhizohPolicyStrictCounterfactual,
  resolveRhizohProductionPolicyCohort,
  validateRhizohLearnedMergeCounterfactual
} from "./rhizohProductProductionTruthV1.js";

export const RHIZOH_PRODUCT_POLICY_LEARNING_VERSION = "1.2.1";

/**
 * @param {ReturnType<computeRhizohProductDecisionOverlay>} reactive
 * @param {ReturnType<loadRhizohProductPolicyState>} state
 */
function buildOverlayWithLearnedMerge(reactive, state) {
  const p = state.patch || {};
  const pUx = p.ux && typeof p.ux === "object" ? p.ux : {};
  const pPt = p.phaseTuning && typeof p.phaseTuning === "object" ? p.phaseTuning : {};
  const pCg = p.capabilityGates && typeof p.capabilityGates === "object" ? p.capabilityGates : {};

  const learnedActive = hasLearnedRhizohProductPatch(state);
  const lrPack = getRhizohExternalLossLearningRateMultiplier();
  const lr = lrPack.multiplier01;

  const rUx = reactive.ux && typeof reactive.ux === "object" ? reactive.ux : {};
  const rPt = reactive.phaseTuning && typeof reactive.phaseTuning === "object" ? reactive.phaseTuning : {};
  const rCg = reactive.capabilityGates && typeof reactive.capabilityGates === "object" ? reactive.capabilityGates : {};

  /** @param {unknown} rVal @param {unknown} learnedVal */
  const blendLearned = (rVal, learnedVal) => {
    const r = Number(rVal);
    const t = Number(learnedVal);
    if (!Number.isFinite(t)) return rVal;
    if (!Number.isFinite(r)) return learnedVal;
    return r + lr * (t - r);
  };

  const ux = { ...reactive.ux };
  if (pUx.closureBannerMs != null && Number.isFinite(Number(pUx.closureBannerMs))) {
    ux.closureBannerMs = guardClosureBannerMs(blendLearned(rUx.closureBannerMs, Number(pUx.closureBannerMs)));
  }

  const phaseTuning = { ...reactive.phaseTuning };
  for (const key of ["introTurnsForTrust", "introSeenTurnsForTrust", "trustBondForNormal", "trustTurnsForNormal"]) {
    if (pPt[key] != null && Number.isFinite(Number(pPt[key]))) {
      const raw = blendLearned(rPt[key], Number(pPt[key]));
      if (key === "trustBondForNormal") {
        const g = guardTrustBondForNormal(raw);
        if (g != null) phaseTuning[key] = g;
      } else if (key === "trustTurnsForNormal") {
        const g = guardTrustTurnsForNormal(Math.round(Number(raw)));
        if (g != null) phaseTuning[key] = g;
      } else if (key === "introTurnsForTrust") {
        const g = guardIntroTurnsForTrust(Math.round(Number(raw)));
        if (g != null) phaseTuning[key] = g;
      } else {
        const g = guardIntroSeenTurnsForTrust(Math.round(Number(raw)));
        if (g != null) phaseTuning[key] = g;
      }
    }
  }

  const capabilityGates = { ...reactive.capabilityGates };
  if (Object.prototype.hasOwnProperty.call(pCg, "suppressGovernanceOpsBadgeUnlessBond01")) {
    const raw = blendLearned(rCg.suppressGovernanceOpsBadgeUnlessBond01, pCg.suppressGovernanceOpsBadgeUnlessBond01);
    const gv = guardGovernanceGateBond01(raw);
    if (gv != null) capabilityGates.suppressGovernanceOpsBadgeUnlessBond01 = gv;
  }

  /** @type {string[]} */
  const lrRationale = [];
  if (learnedActive && lr < 0.92) lrRationale.push("policy:external_loss_lr_scaled");

  const rationale = [...(reactive.rationale || []), ...(learnedActive ? ["policy:learned_guarded_merge"] : []), ...lrRationale];

  return {
    ...reactive,
    policyLearningVersion: RHIZOH_PRODUCT_POLICY_LEARNING_VERSION,
    ux,
    phaseTuning,
    capabilityGates,
    rationale,
    learnedPolicyActive: learnedActive,
    policyUpdatedAt: state.updatedAt || null,
    externalLossLearningRate: lrPack
  };
}

function attachExternalTruth(policyTruth) {
  const extSnap = getRhizohExternalGroundTruthCachedSync();
  return {
    ...policyTruth,
    externalGroundTruth: {
      cacheStatus: extSnap.status,
      populationCohort: extSnap.bundle?.populationCohort ?? null,
      promotionEligible: extSnap.bundle?.promotionEligible ?? null,
      learningMergeEligible: extSnap.bundle?.learningMergeEligible ?? null,
      cautions: Array.isArray(extSnap.bundle?.cautions) ? extSnap.bundle.cautions.slice(0, 4) : []
    }
  };
}

/**
 * Metrik temelli overlay + LS’te tutulan öğrenilmiş patch (tanımlı alanlar reactive üzerine yazar).
 * @param {{ rollup?: object, derived?: object } | null | undefined} snapshot
 * @param {Record<string, unknown> | null | undefined} continuityMeta — kohort çözümü için (ürün oturumu meta)
 */
export function finalizeRhizohProductOverlay(snapshot, continuityMeta) {
  const reactive = computeRhizohProductDecisionOverlay(snapshot);
  const state = loadRhizohProductPolicyState();

  ensureRhizohProductionTruthAnchor(snapshot);
  const driftPack = computeRhizohProductionTruthDrift(snapshot);
  const cohort = resolveRhizohProductionPolicyCohort(continuityMeta);

  /** @type {Record<string, unknown>} */
  let policyTruth = {
    truthVersion: "1.0.0",
    epistemicContinuityLayerRef: cohort.epistemicContinuityLayerRef,
    cohort,
    truthAnchor: {
      drift01: driftPack.drift01,
      hasAnchor: driftPack.hasAnchor,
      anchorCapturedAtMs: driftPack.anchorCapturedAtMs ?? null
    },
    evaluatedAt: Date.now()
  };

  policyTruth = attachExternalTruth(policyTruth);
  {
    const lrMeta = getRhizohExternalLossLearningRateMultiplier();
    policyTruth = {
      ...policyTruth,
      externalLossLearningRate: {
        multiplier01: lrMeta.multiplier01,
        externalLossScore01: lrMeta.externalLossScore01,
        gradientDisabled: lrMeta.gradientDisabled,
        externalLoopAsymmetry: lrMeta.externalLoopAsymmetry
      }
    };
  }

  const extSnap = getRhizohExternalGroundTruthCachedSync();
  const extMerge = externalTruthBlocksLearningMerge(extSnap);

  if (readRhizohPolicyShadowFinalize()) {
    const rationale = [...(reactive.rationale || []), "policy:shadow_finalize_only_reactive"];
    return {
      ...reactive,
      policyLearningVersion: RHIZOH_PRODUCT_POLICY_LEARNING_VERSION,
      rationale,
      learnedPolicyActive: false,
      policyUpdatedAt: state.updatedAt || null,
      policyTruth: { ...policyTruth, finalizeLane: "shadow_reactive" }
    };
  }

  if (readRhizohPolicyAnchorFinalize()) {
    const rationale = [...(reactive.rationale || []), "policy:anchor_finalize_reactive_only"];
    return {
      ...reactive,
      policyLearningVersion: RHIZOH_PRODUCT_POLICY_LEARNING_VERSION,
      rationale,
      learnedPolicyActive: false,
      policyUpdatedAt: state.updatedAt || null,
      policyTruth: { ...policyTruth, finalizeLane: "anchor_reactive" }
    };
  }

  const merged = buildOverlayWithLearnedMerge(reactive, state);

  if (!merged.learnedPolicyActive) {
    return {
      ...merged,
      policyTruth: { ...policyTruth, finalizeLane: "reactive_only_no_patch" }
    };
  }

  if (extMerge.blocked) {
    const rationale = [
      ...(reactive.rationale || []),
      "policy:external_truth_blocked_merge",
      extMerge.reason ? `policy:${extMerge.reason}` : "policy:external_truth_unknown"
    ];
    return {
      ...reactive,
      policyLearningVersion: RHIZOH_PRODUCT_POLICY_LEARNING_VERSION,
      rationale,
      learnedPolicyActive: false,
      policyUpdatedAt: state.updatedAt || null,
      policyTruth: {
        ...policyTruth,
        finalizeLane: "external_truth_blocked_merge",
        externalMergeBlock: extMerge.reason || "blocked"
      }
    };
  }

  const lossMerge = getRhizohExternalLossMergeGate();
  if (lossMerge.blocked) {
    const rationale = [
      ...(reactive.rationale || []),
      "policy:external_loss_blocked_merge",
      lossMerge.reason ? `policy:${lossMerge.reason}` : "policy:external_loss_unknown"
    ];
    return {
      ...reactive,
      policyLearningVersion: RHIZOH_PRODUCT_POLICY_LEARNING_VERSION,
      rationale,
      learnedPolicyActive: false,
      policyUpdatedAt: state.updatedAt || null,
      policyTruth: {
        ...policyTruth,
        finalizeLane: "external_loss_blocked_merge",
        externalLossMergeBlock: lossMerge.reason || "blocked"
      }
    };
  }

  const cf = validateRhizohLearnedMergeCounterfactual(reactive, merged);
  policyTruth.counterfactual = cf;

  if (readRhizohPolicyStrictCounterfactual() && !cf.passes) {
    try {
      emitRhizohBehaviorSignal("rhizoh.policy.counterfactual_blocked", {
        violations: cf.violations,
        confidence01: cf.confidence01
      });
    } catch {
      /* noop */
    }
    const rationale = [...(reactive.rationale || []), "policy:counterfactual_blocked_merge"];
    return {
      ...reactive,
      policyLearningVersion: RHIZOH_PRODUCT_POLICY_LEARNING_VERSION,
      rationale,
      learnedPolicyActive: false,
      policyUpdatedAt: state.updatedAt || null,
      policyTruth: { ...policyTruth, finalizeLane: "counterfactual_blocked" }
    };
  }

  let rationale = merged.rationale;
  if (!cf.passes) {
    rationale = [...rationale, "policy:counterfactual_soft_warning"];
  }

  return {
    ...merged,
    rationale,
    policyTruth: { ...policyTruth, finalizeLane: "learned_merge_ok" }
  };
}

export function getRhizohProductDecisionPackage() {
  const snapshot = getRhizohBehaviorMetricsSnapshot();
  return { snapshot, overlay: finalizeRhizohProductOverlay(snapshot) };
}
