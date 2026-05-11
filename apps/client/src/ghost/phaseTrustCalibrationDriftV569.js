/**
 * vNext-569 — Trust Learning / Calibration Drift Layer
 *
 * v567–v568 güven ipucu zaman içinde yanlış kalabilir: histerezis “churn” (sık armed flip)
 * epistemik bias biriktirir; çıkış `trustHint` gecikmeli ölçeklenir (self-calibrating epistemic control).
 *
 * v570: `phaseEpistemicErrorSemanticsV570` — hata sınıfı / benign vs zararlı → `recordCouplingOutcome569` ağırlıkları.
 */

import { createPhaseConstraintAdaptationLayer564 } from "./phaseConstraintAdaptationV564.js";
import {
  createAnchorPlasticityLayer566,
  readTriaxialStabilitySnapshot566
} from "./phaseAnchorPlasticityV566.js";
import { createConstraintEquilibriumAnchorV565 } from "./phaseConstraintEquilibriumAnchorV565.js";
import { createObservationControlCoupling567 } from "./phaseObservationControlCouplingV567.js";
import {
  createObservationTrustCalibration568,
  createTrustCalibratedObservationPipeline568
} from "./phaseObservationTrustCalibrationV568.js";
import {
  createPhaseConstraintKernel,
  DEFAULT_PHASE_CONSTRAINT_POLICY,
  normalizePhaseConstraintPolicyInPlace
} from "./phaseConstraintKernelV563.js";

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

function cloneFullPolicy(partial) {
  return { ...DEFAULT_PHASE_CONSTRAINT_POLICY, ...partial };
}

/** @readonly */
export const DEFAULT_TRUST_DRIFT569 = Object.freeze({
  flipWindow: 18,
  flipsForBiasBump: 3,
  biasBump01: 0.028,
  biasDecayPerTick01: 0.008,
  biasMax01: 0.42,
  /** Gecikmeli güven ölçeği EMA — düşük = daha yavaş güvene dönüş */
  hintLearnGamma01: 0.11,
  trustScaleMaxReduction: 0.52,
  bypassScaleMaxReduction: 0.4
});

/**
 * @param {Partial<typeof DEFAULT_TRUST_DRIFT569>} [opts]
 */
export function createTrustCalibrationDrift569(opts = {}) {
  const c = { ...DEFAULT_TRUST_DRIFT569, ...opts };
  let epistemicBias01 = 0;
  let delayedTrustScale01 = 1;
  /** @type {number[]} */
  let recentFlip01 = [];
  let prevLow = /** @type {boolean | null} */ (null);
  let prevHigh = /** @type {boolean | null} */ (null);

  return {
    reset() {
      epistemicBias01 = 0;
      delayedTrustScale01 = 1;
      recentFlip01 = [];
      prevLow = null;
      prevHigh = null;
    },

    getDriftState569() {
      const flipPressure =
        recentFlip01.length > 0 ? recentFlip01.reduce((a, b) => a + b, 0) / recentFlip01.length : 0;
      return Object.freeze({
        epistemicBias01,
        delayedTrustScale01,
        recentFlipPressure01: flipPressure
      });
    },

    /**
     * v568 `getCouplingHint568` çıktısını bias + gecikmeli ölçek ile düzeltir.
     * @param {{ trust01?: number, bypassUrgency01?: number }} hint568
     */
    adjustCouplingHint569(hint568) {
      const trustIn = clamp01(hint568?.trust01 ?? 1);
      const bypassIn = clamp01(hint568?.bypassUrgency01 ?? 0);
      const instantScale = clamp01(1 - epistemicBias01 * c.trustScaleMaxReduction);
      const gamma = clamp01(c.hintLearnGamma01 ?? 0.11);
      delayedTrustScale01 = delayedTrustScale01 * (1 - gamma) + instantScale * gamma;
      delayedTrustScale01 = clamp(delayedTrustScale01, 0.35, 1);
      return Object.freeze({
        trust01: clamp01(trustIn * delayedTrustScale01),
        bypassUrgency01: clamp01(bypassIn * clamp01(1 - epistemicBias01 * c.bypassScaleMaxReduction))
      });
    },

    /**
     * v567 `tick567` dönüşü — churn ile bias öğrenimi.
     * @param {ReturnType<ReturnType<typeof createObservationControlCoupling567>["tick567"]>} result567
     * @param {{ benign01?: number, correctionPriority01?: number }} [semantics570] v570 sınıflandırması
     */
    recordCouplingOutcome569(result567, semantics570) {
      const benign01 = clamp01(semantics570?.benign01 ?? 0.5);
      const correctionPriority01 = clamp01(semantics570?.correctionPriority01 ?? 0.5);
      const decayMul = 0.38 + 0.62 * benign01;
      const bumpMul = 0.22 + 0.78 * correctionPriority01;

      if (!result567 || result567.skipped) {
        epistemicBias01 = Math.max(0, epistemicBias01 - c.biasDecayPerTick01 * decayMul);
        return;
      }

      const low = !!result567.lowArmed;
      const high = !!result567.highArmed;
      let flip = 0;
      if (prevLow !== null && prevLow !== low) flip = 1;
      if (prevHigh !== null && prevHigh !== high) flip = Math.max(flip, 1);
      prevLow = low;
      prevHigh = high;

      recentFlip01.push(flip);
      const w = Math.max(5, Math.floor(c.flipWindow ?? 18));
      while (recentFlip01.length > w) recentFlip01.shift();

      const flips = recentFlip01.reduce((a, b) => a + b, 0);
      epistemicBias01 = Math.max(0, epistemicBias01 - c.biasDecayPerTick01 * decayMul);
      if (flips >= Math.max(2, Math.floor(c.flipsForBiasBump ?? 3))) {
        const bump = (c.biasBump01 ?? 0.028) * bumpMul;
        epistemicBias01 = Math.min(c.biasMax01 ?? 0.42, epistemicBias01 + bump);
      }
    }
  };
}

/**
 * v563–v569: güven öğrenmeli epistemik boru hattı.
 * @param {object} [opts]
 * @param {(ctx: { snap566: object, result567: object, driftState569: object }) => { benign01?: number, correctionPriority01?: number } | void} [opts.semanticsClassify570] v570
 */
export function createTrustLearningObservationPipeline569(opts = {}) {
  const baseline = cloneFullPolicy(opts.initialPolicy ?? {});
  normalizePhaseConstraintPolicyInPlace(baseline);

  const anchorOpts = opts.anchor ?? {};
  const kernel = createPhaseConstraintKernel(opts.initialPolicy ?? {});
  const adaptation = createPhaseConstraintAdaptationLayer564(opts.adaptation ?? {});
  const anchor = createConstraintEquilibriumAnchorV565({
    baselinePolicy: baseline,
    ...anchorOpts
  });
  const plasticity = createAnchorPlasticityLayer566(opts.plasticity ?? {});
  const coupling = createObservationControlCoupling567(opts.observationCoupling ?? {});
  const trust = createObservationTrustCalibration568(opts.trustCalibration ?? {});
  const drift = createTrustCalibrationDrift569(opts.trustDrift ?? {});
  const semanticsClassify570 =
    typeof opts.semanticsClassify570 === "function" ? opts.semanticsClassify570 : null;

  return {
    kernel,
    adaptation,
    anchor,
    plasticity,
    coupling,
    trust,
    drift,

    readStabilitySnapshot566() {
      return readTriaxialStabilitySnapshot566({
        plasticity,
        anchor,
        anchorPullTowardBaseline01: anchorOpts.anchorPullTowardBaseline01
      });
    },

    tick(nowMs) {
      const t = Number(nowMs) || Date.now();
      const eq = anchor.step(adaptation, t);
      kernel.applyPolicyMerge(eq);
      plasticity.step(anchor, t);
      const snap = readTriaxialStabilitySnapshot566({
        plasticity,
        anchor,
        anchorPullTowardBaseline01: anchorOpts.anchorPullTowardBaseline01
      });
      trust.recordTriaxial566(snap);
      const hint568 = trust.getCouplingHint568(snap);
      const hint = drift.adjustCouplingHint569(hint568);
      const preDrift = drift.getDriftState569();
      const r567 = coupling.tick567(anchor, plasticity, snap, hint);
      const sem =
        semanticsClassify570?.({
          snap566: snap,
          result567: r567,
          driftState569: preDrift
        }) ?? null;
      drift.recordCouplingOutcome569(r567, sem ?? undefined);
    },

    recordViralSample(viralSync01, nowMs) {
      adaptation.recordViralSample(viralSync01, nowMs ?? Date.now());
    },

    recordCollapseVeto(nowMs) {
      adaptation.recordCollapseVeto(nowMs ?? Date.now());
    },

    recordCollapseEnterMetric(nowMs) {
      adaptation.recordCollapseEnterMetric(nowMs ?? Date.now());
    },

    resetAdaptation() {
      adaptation.reset();
    },

    resetAnchor() {
      anchor.reset();
    },

    resetPlasticity() {
      plasticity.reset();
    },

    resetObservationCoupling567() {
      coupling.reset();
    },

    resetObservationTrust568() {
      trust.reset();
    },

    resetTrustDrift569() {
      drift.reset();
    }
  };
}

export { createTrustCalibratedObservationPipeline568 };
