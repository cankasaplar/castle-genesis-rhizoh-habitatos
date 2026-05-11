/**
 * vNext-564 — Constraint Adaptation Layer
 *
 * v563 kısıtları sabit değil: veto baskısı → gevşeme, sık collapse → sıkılaşma,
 * viral durgunluğu → coupling / faz adımı ince ayarı. Deterministik; rastgele yok.
 *
 * Kullanım: `createPhaseConstraintAdaptationLayer564` ile ölçümleri kaydet;
 * üretimde tam zincir için `createAnchoredAdaptivePhaseConstraintPipeline565` tercih edin.
 *
 * ⚠️ `createAdaptivePhaseConstraintPipeline564` her tick’te hedefi `kernel.getPolicy()` üzerinden üretir;
 * uzun süreçte politika birikimli sürüklenme verebilir. Sönüm için v565 denge ankrajı kullanın.
 */

import {
  createPhaseConstraintKernel,
  DEFAULT_PHASE_CONSTRAINT_POLICY
} from "./phaseConstraintKernelV563.js";

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function clamp(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

/** @readonly */
export const DEFAULT_CONSTRAINT_ADAPTATION564 = Object.freeze({
  windowMs: 120_000,
  viralSampleCap: 56,
  vetoRelaxOnset: 4,
  enterTightenOnset: 2,
  /** std bu referansın altına inince stagnation01 → 1’e yaklaşır */
  stagnationStdRef01: 0.11,
  stagnationCouplingStrength: 0.07
});

/**
 * @param {Partial<typeof DEFAULT_CONSTRAINT_ADAPTATION564>} [opts]
 */
export function createPhaseConstraintAdaptationLayer564(opts = {}) {
  const p = { ...DEFAULT_CONSTRAINT_ADAPTATION564, ...opts };
  /** @type {{ t: number, v: number }[]} */
  let viralSamples = [];
  /** @type {number[]} */
  let vetoTimes = [];
  /** @type {number[]} */
  let enterMetricTimes = [];

  function prune(nowMs) {
    const t = Number(nowMs) || Date.now();
    const w = Math.max(5000, p.windowMs);
    viralSamples = viralSamples.filter((x) => t - x.t <= w);
    vetoTimes = vetoTimes.filter((ts) => t - ts <= w);
    enterMetricTimes = enterMetricTimes.filter((ts) => t - ts <= w);
  }

  /**
   * @param {number} nowMs
   * @returns {{ meanViral01: number, stagnation01: number, vetoRelax01: number, enterTighten01: number, viralSampleCount: number }}
   */
  function adaptationMetrics(nowMs) {
    const t = Number(nowMs) || Date.now();
    prune(t);
    let meanV = 0.5;
    let stagnation01 = 0;
    const nV = viralSamples.length;
    if (nV >= 4) {
      meanV = viralSamples.reduce((a, x) => a + x.v, 0) / nV;
      let varr = 0;
      for (const x of viralSamples) varr += (x.v - meanV) ** 2;
      varr /= nV;
      const std = Math.sqrt(varr);
      stagnation01 = clamp01(1 - std / Math.max(1e-6, p.stagnationStdRef01));
    }
    const vetoRelax01 = clamp01((vetoTimes.length - p.vetoRelaxOnset) / 10);
    const enterTighten01 = clamp01((enterMetricTimes.length - p.enterTightenOnset) / 8);
    return {
      meanViral01: meanV,
      stagnation01,
      vetoRelax01,
      enterTighten01,
      viralSampleCount: nV
    };
  }

  return {
    recordViralSample(viralSync01, nowMs) {
      const t = Number(nowMs) || Date.now();
      prune(t);
      viralSamples.push({ t, v: clamp01(viralSync01) });
      const cap = Math.max(8, Math.floor(p.viralSampleCap ?? 56));
      while (viralSamples.length > cap) viralSamples.shift();
    },

    recordCollapseVeto(nowMs) {
      const t = Number(nowMs) || Date.now();
      prune(t);
      vetoTimes.push(t);
    },

    /** v562 collapse enter gerçekleştiğinde (veya kernel commit sonrası) metrik için */
    recordCollapseEnterMetric(nowMs) {
      const t = Number(nowMs) || Date.now();
      prune(t);
      enterMetricTimes.push(t);
    },

    reset() {
      viralSamples = [];
      vetoTimes = [];
      enterMetricTimes = [];
    },

    snapshot(nowMs) {
      const m = adaptationMetrics(nowMs);
      return Object.freeze({
        viralSampleCount: m.viralSampleCount,
        vetoCount: vetoTimes.length,
        enterMetricCount: enterMetricTimes.length,
        meanViral01: m.meanViral01,
        stagnation01: m.stagnation01,
        vetoRelax01: m.vetoRelax01,
        enterTighten01: m.enterTighten01
      });
    },

    /**
     * @param {typeof DEFAULT_PHASE_CONSTRAINT_POLICY} basePolicy
     * @param {number} [nowMs]
     * @returns {Partial<typeof DEFAULT_PHASE_CONSTRAINT_POLICY>}
     */
    computePolicyPatch(basePolicy, nowMs) {
      const { meanViral01: meanV, stagnation01, vetoRelax01, enterTighten01 } = adaptationMetrics(
        nowMs ?? Date.now()
      );
      const base = basePolicy || DEFAULT_PHASE_CONSTRAINT_POLICY;

      const stress = clamp(
        base.collapseStressLock01 + enterTighten01 * 0.058 - vetoRelax01 * 0.068,
        0.7,
        0.95
      );

      const maxDisp = clamp(
        base.maxDispersion01ForCollapseEnter + vetoRelax01 * 0.055 - enterTighten01 * 0.045,
        0.22,
        0.58
      );

      const viralFloor = clamp(
        base.collapseViralFloor01 - vetoRelax01 * 0.035 + enterTighten01 * 0.028,
        0.64,
        0.84
      );

      const stagnationStepNudge =
        stagnation01 * 0.012 * (meanV < 0.52 ? 1 : meanV > 0.62 ? -0.35 : 0);
      const maxStep = clamp(
        base.maxPhaseStepPerTick01 +
          vetoRelax01 * 0.018 -
          enterTighten01 * 0.012 +
          stagnationStepNudge,
        0.12,
        0.28
      );

      let couplingSoften = base.couplingSoftenAtHighViral01;
      couplingSoften +=
        stagnation01 * (p.stagnationCouplingStrength ?? 0.07) * (meanV > 0.58 ? 1 : -0.65);
      couplingSoften += enterTighten01 * 0.04;
      couplingSoften -= vetoRelax01 * 0.03;
      couplingSoften = clamp(couplingSoften, 0.12, 0.82);

      let maxE = Math.floor(Number(base.collapseMaxEntersPerWindow) || 3);
      if (enterTighten01 >= 0.85) maxE = Math.max(1, maxE - 1);
      if (vetoRelax01 >= 0.85) maxE = Math.min(8, maxE + 1);

      return Object.freeze({
        collapseStressLock01: stress,
        maxDispersion01ForCollapseEnter: maxDisp,
        collapseViralFloor01: viralFloor,
        maxPhaseStepPerTick01: maxStep,
        couplingSoftenAtHighViral01: couplingSoften,
        collapseMaxEntersPerWindow: maxE
      });
    }
  };
}

/**
 * v563 çekirdeği + v564 adaptörü; her tick’te politika yama uygular.
 * @param {{ initialPolicy?: Partial<typeof DEFAULT_PHASE_CONSTRAINT_POLICY>, adaptation?: Partial<typeof DEFAULT_CONSTRAINT_ADAPTATION564> }} [opts]
 */
export function createAdaptivePhaseConstraintPipeline564(opts = {}) {
  const kernel = createPhaseConstraintKernel(opts.initialPolicy ?? {});
  const adaptation = createPhaseConstraintAdaptationLayer564(opts.adaptation ?? {});

  return {
    kernel,
    adaptation,

    tick(nowMs) {
      const t = Number(nowMs) || Date.now();
      const patch = adaptation.computePolicyPatch(kernel.getPolicy(), t);
      kernel.applyPolicyMerge(patch);
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
    }
  };
}
