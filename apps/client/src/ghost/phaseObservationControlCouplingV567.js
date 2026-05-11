/**
 * vNext-567 — Observation-to-Control Coupling Layer
 *
 * v566 triaxial readout’taki `budget01` (p×α) histerezis + yumuşatma ile hızlı/yavaş döngüye
 * gecikmeli geri besleme: düşük bütçe → v565 sıkılaşır; yüksek bütçe → v566 plastisitesi kısılır.
 *
 * v568: `phaseObservationTrustCalibrationV568` — `trustHint568` ile yumuşatma / histerezis seçici bypass.
 * v569: `phaseTrustCalibrationDriftV569` — ipucu gecikmeli ölçekleme + churn sonrası bias.
 */

import { createPhaseConstraintAdaptationLayer564 } from "./phaseConstraintAdaptationV564.js";
import {
  createAnchorPlasticityLayer566,
  readTriaxialStabilitySnapshot566
} from "./phaseAnchorPlasticityV566.js";
import { createConstraintEquilibriumAnchorV565 } from "./phaseConstraintEquilibriumAnchorV565.js";
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
export const DEFAULT_OBSERVATION_COUPLING567 = Object.freeze({
  budgetSmoothing01: 0.11,
  lowBudgetEnter01: 0.011,
  lowBudgetExit01: 0.017,
  highBudgetEnter01: 0.046,
  highBudgetExit01: 0.036,
  fastMaxDeltaScaleTight: 0.87,
  fastSmoothScaleTight: 0.9,
  fastPullOffsetTight01: 0.007,
  slowPlasticityScaleRelax: 0.74,
  slowEmaScaleRelax: 0.8
});

/**
 * @param {Partial<typeof DEFAULT_OBSERVATION_COUPLING567>} [opts]
 */
export function createObservationControlCoupling567(opts = {}) {
  const c = { ...DEFAULT_OBSERVATION_COUPLING567, ...opts };
  let smoothedBudget01 = 0.025;
  let lowArmed = false;
  let highArmed = false;
  let seeded = false;

  return {
    reset() {
      smoothedBudget01 = 0.025;
      lowArmed = false;
      highArmed = false;
      seeded = false;
    },

    getState567() {
      return Object.freeze({ smoothedBudget01, lowArmed, highArmed });
    },

    /**
     * @param {ReturnType<typeof createConstraintEquilibriumAnchorV565>} anchor
     * @param {ReturnType<typeof createAnchorPlasticityLayer566>} plasticity
     * @param {ReturnType<typeof readTriaxialStabilitySnapshot566>} snap566
     * @param {{ trust01?: number, bypassUrgency01?: number }} [trustHint568] v568 güven kalibrasyonu
     */
    tick567(anchor, plasticity, snap566, trustHint568) {
      const b = snap566?.budget01;
      const trust01 = clamp01(trustHint568?.trust01 ?? 1);
      const bypass01 = clamp01(trustHint568?.bypassUrgency01 ?? 0);
      const betaBase = clamp01(c.budgetSmoothing01 ?? 0.11);
      const betaTrust = betaBase * clamp(0.4 + 0.6 * trust01, 0.26, 1);
      const beta = clamp01(betaTrust * (1 + 0.4 * bypass01 * trust01));

      if (b == null || !Number.isFinite(b)) {
        anchor.applyObservationCoupling567({ maxDeltaScale: 1, smoothScale: 1, pullOffset01: 0 });
        plasticity.applyObservationCoupling567({ plasticityScale: 1, emaAlphaScale: 1 });
        return Object.freeze({
          lowArmed: false,
          highArmed: false,
          smoothedBudget01,
          skipped: true,
          effectiveBeta01: beta,
          trust01,
          bypassUrgency01: bypass01
        });
      }

      if (!seeded) {
        smoothedBudget01 = b;
        seeded = true;
      } else {
        smoothedBudget01 = smoothedBudget01 * (1 - beta) + b * beta;
      }

      const nudge = 0.0026 * bypass01 * trust01;
      let lowEnter = clamp01(c.lowBudgetEnter01 ?? 0.011);
      let lowExit = clamp(Math.max(lowEnter + 0.002, c.lowBudgetExit01 ?? 0.017), 0, 1);
      let highExit = clamp01(c.highBudgetExit01 ?? 0.036);
      let highEnter = clamp(Math.min(c.highBudgetEnter01 ?? 0.046, highExit - 0.002), 0, 1);

      lowEnter = clamp01(lowEnter + nudge);
      lowExit = clamp01(lowExit - nudge);
      highEnter = clamp01(highEnter - nudge);
      highExit = clamp01(highExit + nudge);
      if (lowExit <= lowEnter + 0.001) lowExit = clamp01(lowEnter + 0.002);
      if (highEnter <= highExit + 0.001) highEnter = clamp01(highExit + 0.002);

      if (!lowArmed && smoothedBudget01 < lowEnter) lowArmed = true;
      if (lowArmed && smoothedBudget01 > lowExit) lowArmed = false;
      if (!highArmed && smoothedBudget01 > highEnter) highArmed = true;
      if (highArmed && smoothedBudget01 < highExit) highArmed = false;

      anchor.applyObservationCoupling567({
        maxDeltaScale: lowArmed ? /** @type {number} */ (c.fastMaxDeltaScaleTight) : 1,
        smoothScale: lowArmed ? /** @type {number} */ (c.fastSmoothScaleTight) : 1,
        pullOffset01: lowArmed ? /** @type {number} */ (c.fastPullOffsetTight01) : 0
      });

      plasticity.applyObservationCoupling567({
        plasticityScale: highArmed ? /** @type {number} */ (c.slowPlasticityScaleRelax) : 1,
        emaAlphaScale: highArmed ? /** @type {number} */ (c.slowEmaScaleRelax) : 1
      });

      return Object.freeze({
        lowArmed,
        highArmed,
        smoothedBudget01,
        rawBudget01: b,
        skipped: false,
        effectiveBeta01: beta,
        trust01,
        bypassUrgency01: bypass01
      });
    }
  };
}

/**
 * v563–v567: gözlem-güdümlü tam zincir.
 * @param {{
 *   initialPolicy?: Partial<typeof DEFAULT_PHASE_CONSTRAINT_POLICY>,
 *   adaptation?: object,
 *   anchor?: object,
 *   plasticity?: object,
 *   observationCoupling?: Partial<typeof DEFAULT_OBSERVATION_COUPLING567>
 * }} [opts]
 */
export function createObservationCoupledPhaseConstraintPipeline567(opts = {}) {
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

  return {
    kernel,
    adaptation,
    anchor,
    plasticity,
    coupling,

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
      coupling.tick567(anchor, plasticity, snap);
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
    }
  };
}
