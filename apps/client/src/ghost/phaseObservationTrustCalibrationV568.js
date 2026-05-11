/**
 * vNext-568 — Observation Trust Calibration Layer
 *
 * Triaxial readout güveni: bütçe oynaklığı + iç tutarlılık (p×α vs budget01).
 * v567’ye `trustHint568` — düşük güven → daha ağır yumuşatma; stabil + tutarlı → sınırlı bypass.
 * v569: `phaseTrustCalibrationDriftV569` — güven yanlışını churn ile öğrenen gecikmeli düzeltme.
 */

import { createPhaseConstraintAdaptationLayer564 } from "./phaseConstraintAdaptationV564.js";
import {
  createAnchorPlasticityLayer566,
  readTriaxialStabilitySnapshot566
} from "./phaseAnchorPlasticityV566.js";
import { createConstraintEquilibriumAnchorV565 } from "./phaseConstraintEquilibriumAnchorV565.js";
import { createObservationControlCoupling567 } from "./phaseObservationControlCouplingV567.js";
import {
  createPhaseConstraintKernel,
  DEFAULT_PHASE_CONSTRAINT_POLICY,
  normalizePhaseConstraintPolicyInPlace
} from "./phaseConstraintKernelV563.js";

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function cloneFullPolicy(partial) {
  return { ...DEFAULT_PHASE_CONSTRAINT_POLICY, ...partial };
}

function sampleStd01(vals) {
  if (vals.length < 2) return 0;
  const m = vals.reduce((a, b) => a + b, 0) / vals.length;
  let v = 0;
  for (const x of vals) v += (x - m) ** 2;
  return Math.sqrt(v / vals.length);
}

/** @readonly */
export const DEFAULT_TRUST_CALIBRATION568 = Object.freeze({
  budgetHistoryMax: 14,
  volatilityRef01: 0.02,
  stableVolThreshold01: 0.004,
  stableTicksForBypass: 8,
  maxBypassUrgency01: 0.85
});

/**
 * @param {Partial<typeof DEFAULT_TRUST_CALIBRATION568>} [opts]
 */
export function createObservationTrustCalibration568(opts = {}) {
  const c = { ...DEFAULT_TRUST_CALIBRATION568, ...opts };
  /** @type {number[]} */
  let budgetHistory = [];
  let stableLowVolTicks = 0;

  const api = {
    reset() {
      budgetHistory = [];
      stableLowVolTicks = 0;
    },

    /**
     * @param {ReturnType<typeof readTriaxialStabilitySnapshot566>} snap566
     */
    recordTriaxial566(snap566) {
      const b = snap566?.budget01;
      if (b == null || !Number.isFinite(b)) return;
      budgetHistory.push(clamp01(b));
      const cap = Math.max(4, Math.floor(c.budgetHistoryMax ?? 14));
      while (budgetHistory.length > cap) budgetHistory.shift();

      const vol = sampleStd01(budgetHistory);
      if (vol < clamp01(c.stableVolThreshold01 ?? 0.004)) stableLowVolTicks += 1;
      else stableLowVolTicks = 0;
    },

    /**
     * @param {ReturnType<typeof readTriaxialStabilitySnapshot566>} [snap566]
     */
    getTrustReadout568(snap566) {
      const vol = sampleStd01(budgetHistory);
      const volRef = Math.max(1e-6, c.volatilityRef01 ?? 0.02);
      const volTrust = clamp01(1 - vol / volRef);

      let coherence01 = 0.75;
      if (snap566 && snap566.budget01 != null && snap566.plasticityRate01 != null && snap566.equilibriumEmaAlpha01 != null) {
        const b = Number(snap566.budget01);
        const p = Number(snap566.plasticityRate01);
        const a = Number(snap566.equilibriumEmaAlpha01);
        if (Number.isFinite(b) && Number.isFinite(p) && Number.isFinite(a)) {
          const expected = clamp01(p) * clamp01(a);
          const err = Math.abs(expected - b);
          coherence01 = clamp01(1 - err / Math.max(1e-6, b + 0.02));
        }
      }

      const trust01 = clamp01(volTrust * (0.52 + 0.48 * coherence01));
      const need = Math.max(2, Math.floor(c.stableTicksForBypass ?? 8));
      const bypassBase = clamp01(stableLowVolTicks / need);
      const bypassUrgency01 = clamp01(
        bypassBase * trust01 * clamp01(c.maxBypassUrgency01 ?? 0.85)
      );

      return Object.freeze({
        trust01,
        budgetVolatility01: vol,
        coherence01,
        bypassUrgency01
      });
    },

    /** v567 `tick567` 4. argümanı */
    getCouplingHint568(snap566) {
      const r = api.getTrustReadout568(snap566);
      return Object.freeze({
        trust01: r.trust01,
        bypassUrgency01: r.bypassUrgency01
      });
    }
  };

  return api;
}

/**
 * v563–v568
 * @param {object} [opts]
 */
export function createTrustCalibratedObservationPipeline568(opts = {}) {
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

  return {
    kernel,
    adaptation,
    anchor,
    plasticity,
    coupling,
    trust,

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
      const hint = trust.getCouplingHint568(snap);
      coupling.tick567(anchor, plasticity, snap, hint);
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
    }
  };
}
