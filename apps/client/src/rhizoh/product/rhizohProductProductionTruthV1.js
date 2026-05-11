/**
 * Üretim truth anchor + kohort ayrımı + counterfactual doğrulama (finalize öncesi son güven katmanı).
 * Sunucu A/B değildir; L11 süreklilik sözleşmesiyle uyumlu yerel kanıt çerçevesi.
 *
 * Not: `truth_anchor.v1` yalnızca **aynı profildeki rollup’un sıkıştırılmış hafızasıdır**;
 * nüfus düzeyinde “gerçek” için `rhizohExternalGroundTruthV1` + analitik bağlantısı gerekir.
 */

import { RHIZOH_EPISTEMIC_LAYER } from "../epistemic/rhizohLayersV529.js";
import { getRhizohBehaviorMetricsSnapshot } from "../telemetry/rhizohBehaviorMetricsAggregatorV1.js";
import {
  dismissTotal,
  sliceRollupForEffectiveness
} from "./rhizohDecisionEffectivenessV1.js";
import {
  isRhizohPolicyLearningHoldout,
  readRhizohPolicyLearningShadowMode,
  readRhizohPolicyShadowFinalize,
  getRhizohPolicyLearningGuardSummary
} from "./rhizohProductPolicyStoreV1.js";
import { getRhizohExternalGroundTruthCachedSync } from "./rhizohExternalGroundTruthV1.js";
import { getRhizohExternalLossLearningRateMultiplier, getRhizohExternalLossSummary } from "./rhizohExternalLossFunctionV1.js";

export const RHIZOH_PRODUCT_PRODUCTION_TRUTH_VERSION = "1.0.0";

const LS_TRUTH_ANCHOR = "rhizoh.product.truth_anchor.v1";
const LS_STRICT_COUNTERFACTUAL = "rhizoh.policy.strict_counterfactual.v1";
const LS_ANCHOR_FINALIZE = "rhizoh.policy.anchor_finalize.v1";

/** @param {ReturnType<typeof sliceRollupForEffectiveness>} slice */
export function quantizeRollupSliceForTruthAnchor(slice) {
  const pe =
    slice.phaseEnterCount && typeof slice.phaseEnterCount === "object"
      ? slice.phaseEnterCount
      : {};
  const c = Math.max(0, Math.floor(Number(slice.closureVisibleMsCount) || 0));
  const visAvg = c >= 1 ? Number(slice.closureVisibleMsSum) / c : 0;
  return {
    turnDepthCountQ: Math.max(0, Math.floor(Number(slice.turnDepthCount) || 0)),
    dismissSumQ: dismissTotal(slice),
    phaseTrustEnterQ: Math.max(0, Math.floor(Number(pe.TRUST_BUILD) || 0)),
    phaseNormEnterQ: Math.max(0, Math.floor(Number(pe.NORMAL_CHAT) || 0)),
    closureVisibleAvgBucketQ: Math.round(Math.max(0, visAvg) / 2500) * 2500
  };
}

/**
 * @param {Record<string, number>} anchorQ
 * @param {Record<string, number>} currentQ
 */
export function truthAnchorDrift01(anchorQ, currentQ) {
  const keys = Object.keys(anchorQ);
  if (!keys.length) return 0;
  let sum = 0;
  for (const k of keys) {
    const a = Number(anchorQ[k]) || 0;
    const b = Number(currentQ[k]) || 0;
    const denom = Math.max(8, Math.abs(a) + Math.abs(b));
    sum += Math.min(1, Math.abs(a - b) / denom);
  }
  return Math.min(1, sum / keys.length);
}

export function readRhizohProductionTruthAnchor() {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(LS_TRUTH_ANCHOR);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || typeof p !== "object" || !p.quantized || typeof p.quantized !== "object") return null;
    return p;
  } catch {
    return null;
  }
}

/**
 * İlk yazılıştaki rollup özütünü dondurur (aynı tarayıcı profili için “production anchor”).
 */
export function ensureRhizohProductionTruthAnchor(snapshot) {
  try {
    if (typeof window === "undefined") return null;
    const existing = readRhizohProductionTruthAnchor();
    if (existing?.quantized) return existing;
    const slice = sliceRollupForEffectiveness(snapshot?.rollup);
    const quantized = quantizeRollupSliceForTruthAnchor(slice);
    const next = {
      schemaVersion: "1.0.0",
      truthVersion: RHIZOH_PRODUCT_PRODUCTION_TRUTH_VERSION,
      capturedAtMs: Date.now(),
      quantized
    };
    window.localStorage.setItem(LS_TRUTH_ANCHOR, JSON.stringify(next));
    return next;
  } catch {
    return null;
  }
}

export function computeRhizohProductionTruthDrift(snapshot) {
  const anchor = readRhizohProductionTruthAnchor();
  const slice = sliceRollupForEffectiveness(snapshot?.rollup);
  const curQ = quantizeRollupSliceForTruthAnchor(slice);
  if (!anchor?.quantized) return { drift01: 0, currentQuantized: curQ, hasAnchor: false };
  return {
    drift01: truthAnchorDrift01(anchor.quantized, curQ),
    currentQuantized: curQ,
    hasAnchor: true,
    anchorCapturedAtMs: anchor.capturedAtMs ?? null
  };
}

/** LS `rhizoh.policy.strict_counterfactual.v1` === "1" → öğrenilmiş merge reactive’a göre bant dışıysa düşürülür. */
export function readRhizohPolicyStrictCounterfactual() {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(LS_STRICT_COUNTERFACTUAL) === "1";
  } catch {
    return false;
  }
}

/** LS `rhizoh.policy.anchor_finalize.v1` === "1" → finalize’da yalnızca reactive yüzey (truth kohort ayrımı). */
export function readRhizohPolicyAnchorFinalize() {
  try {
    return typeof window !== "undefined" && window.localStorage.getItem(LS_ANCHOR_FINALIZE) === "1";
  } catch {
    return false;
  }
}

/**
 * @param {Record<string, unknown> | null | undefined} continuityMeta
 */
export function resolveRhizohProductionPolicyCohort(continuityMeta) {
  const holdout = isRhizohPolicyLearningHoldout(continuityMeta);
  const shadowPromote = readRhizohPolicyLearningShadowMode();
  const shadowFinalize = readRhizohPolicyShadowFinalize();
  const anchorFinalize = readRhizohPolicyAnchorFinalize();
  const ext = getRhizohExternalGroundTruthCachedSync();
  const serverPopulationCohort =
    ext.status === "fresh" && ext.bundle?.populationCohort ? String(ext.bundle.populationCohort) : null;
  const externalPromotionEligible =
    ext.status === "fresh" && ext.bundle ? Boolean(ext.bundle.promotionEligible) : null;

  return {
    learningBucket: holdout ? "HOLDOUT" : "TREATMENT",
    promoteLane: holdout ? "blocked_holdout" : shadowPromote ? "shadow" : "live",
    finalizeTruthLane:
      shadowFinalize ? "shadow_reactive" : anchorFinalize ? "anchor_reactive" : "merged_when_patch",
    separatedObservationCohort: holdout,
    epistemicContinuityLayerRef: RHIZOH_EPISTEMIC_LAYER.L11,
    serverPopulationCohort,
    externalPromotionEligible
  };
}

const CLOSURE_MAX_DELTA_MS = 8000;
const TUNING_DELTA_LIMS = Object.freeze({
  trustBondForNormal: 0.08,
  trustTurnsForNormal: 4,
  introTurnsForTrust: 3,
  introSeenTurnsForTrust: 2
});

/**
 * Reactive ile öğrenilmiş merge arasında sapmayı ölçer; strict finalize kapısı için kullanılır.
 * @param {ReturnType<import("./rhizohProductDecisionLayerV1.js").computeRhizohProductDecisionOverlay>} reactiveOverlay
 * @param {ReturnType<import("./rhizohProductDecisionLayerV1.js").computeRhizohProductDecisionOverlay>} mergedOverlay
 */
export function validateRhizohLearnedMergeCounterfactual(reactiveOverlay, mergedOverlay) {
  /** @type {string[]} */
  const violations = [];
  let penalty = 0;

  const rUx = reactiveOverlay.ux && typeof reactiveOverlay.ux === "object" ? reactiveOverlay.ux : {};
  const mUx = mergedOverlay.ux && typeof mergedOverlay.ux === "object" ? mergedOverlay.ux : {};
  const rClose = Number(rUx.closureBannerMs);
  const mClose = Number(mUx.closureBannerMs);
  if (Number.isFinite(rClose) && Number.isFinite(mClose)) {
    if (Math.abs(mClose - rClose) > CLOSURE_MAX_DELTA_MS) {
      violations.push("closure_banner_delta_exceeds_band");
      penalty += 0.35;
    }
  }

  const rPt =
    reactiveOverlay.phaseTuning && typeof reactiveOverlay.phaseTuning === "object"
      ? reactiveOverlay.phaseTuning
      : {};
  const mPt =
    mergedOverlay.phaseTuning && typeof mergedOverlay.phaseTuning === "object"
      ? mergedOverlay.phaseTuning
      : {};
  for (const k of Object.keys(TUNING_DELTA_LIMS)) {
    const lim = TUNING_DELTA_LIMS[k];
    const a = Number(rPt[k]);
    const b = Number(mPt[k]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    if (Math.abs(b - a) > lim) {
      violations.push(`phase_tuning_${k}_delta`);
      penalty += 0.18;
    }
  }

  const rG = reactiveOverlay.capabilityGates?.suppressGovernanceOpsBadgeUnlessBond01;
  const mG = mergedOverlay.capabilityGates?.suppressGovernanceOpsBadgeUnlessBond01;
  if (rG != null && mG != null && Number.isFinite(Number(rG)) && Number.isFinite(Number(mG))) {
    if (Math.abs(Number(mG) - Number(rG)) > 0.12) {
      violations.push("governance_gate_bond_delta");
      penalty += 0.22;
    }
  }

  const confidence01 = Math.max(0, Math.min(1, 1 - penalty));
  const passes = violations.length === 0;
  return { passes, confidence01, violations };
}

/**
 * Panel: kota/holdout/shadow + truth anchor drift + kohort tek nesnede.
 * @param {Record<string, unknown> | null | undefined} continuityMeta
 */
export function getRhizohPolicyProductionInsight(continuityMeta) {
  if (typeof window === "undefined") {
    return {
      ...getRhizohPolicyLearningGuardSummary(),
      cohort: null,
      truthAnchorPanel: null,
      strictCounterfactual: false,
      anchorFinalize: false,
      truthVersion: RHIZOH_PRODUCT_PRODUCTION_TRUTH_VERSION,
      externalGroundTruthPanel: null,
      externalLossLearningRate: null,
      externalLossSummary: null
    };
  }
  const base = getRhizohPolicyLearningGuardSummary();
  const snapshot = getRhizohBehaviorMetricsSnapshot();
  ensureRhizohProductionTruthAnchor(snapshot);
  const driftPack = computeRhizohProductionTruthDrift(snapshot);
  const cohort = resolveRhizohProductionPolicyCohort(continuityMeta);
  const extSnap = getRhizohExternalGroundTruthCachedSync();
  return {
    ...base,
    cohort,
    truthAnchorPanel: {
      drift01: driftPack.drift01,
      hasAnchor: driftPack.hasAnchor,
      anchorCapturedAtMs: driftPack.anchorCapturedAtMs ?? readRhizohProductionTruthAnchor()?.capturedAtMs ?? null
    },
    strictCounterfactual: readRhizohPolicyStrictCounterfactual(),
    anchorFinalize: readRhizohPolicyAnchorFinalize(),
    truthVersion: RHIZOH_PRODUCT_PRODUCTION_TRUTH_VERSION,
    externalGroundTruthPanel: {
      cacheStatus: extSnap.status,
      populationCohort: extSnap.bundle?.populationCohort ?? null,
      promotionEligible: extSnap.bundle?.promotionEligible ?? null
    },
    externalLossLearningRate: getRhizohExternalLossLearningRateMultiplier(),
    externalLossSummary: getRhizohExternalLossSummary()
  };
}
