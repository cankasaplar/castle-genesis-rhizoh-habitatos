/**
 * vNext-565 — Constraint Equilibrium Anchor Layer
 *
 * v564 adaptasyonu ile çekirdek politika arasındaki dolaylı geri beslemeyi sönümler:
 * hedef her zaman sabit `baseline` üzerinden üretilir (control ping-pong / drift birikimini keser),
 * denge durumu yumuşatılır, tick başına değişim tavanlanır, baseline’a sürekli hafif çekim vardır.
 *
 * Önerilen üretim yolu: `createAnchoredAdaptivePhaseConstraintPipeline565`.
 *
 * v566: `phaseAnchorPlasticityV566` — baseline’a meta-zaman ölçeğinde çok yavaş kayma (`plasticNudgeBaselineToward566`).
 *
 * Mimari rol (hızlı döngü): **equilibrium guard** — anlık hatalı sapmayı / dağılmayı sınırlar (runtime safety).
 * v566 yavaş döngüde referansı canlı tutar; üst/alt bant birlikte **epistemik sürüklenmeyi** tırmıklar.
 * v567: `phaseObservationControlCouplingV567` — `applyObservationCoupling567` ile gözlem → hızlı guard ince ayarı.
 */

import { createPhaseConstraintAdaptationLayer564 } from "./phaseConstraintAdaptationV564.js";
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

/** @readonly */
export const DEFAULT_EQUILIBRIUM_ANCHOR565 = Object.freeze({
  /** Hedefe doğru oransal yaklaşım (üstüne max delta uygulanır). */
  equilibriumSmoothing01: 0.2,
  /** Her tick’te baseline’a doğru çekim — tam serbest drifti sınırlar. */
  anchorPullTowardBaseline01: 0.038,
  maxPolicyDeltaPerTick: Object.freeze({
    collapseStressLock01: 0.014,
    maxDispersion01ForCollapseEnter: 0.018,
    collapseViralFloor01: 0.012,
    maxPhaseStepPerTick01: 0.01,
    couplingSoftenAtHighViral01: 0.022
  }),
  /** `collapseMaxEntersPerWindow` için tick başına en fazla ± adım */
  collapseMaxEntersPerTick: 1
});

/** v566 meta adımında baseline kayması için varsayılan tavanlar (hızlı tick’ten daha küçük). */
export const DEFAULT_BASELINE_PLASTICITY_CAPS565 = Object.freeze({
  collapseStressLock01: 0.004,
  maxDispersion01ForCollapseEnter: 0.005,
  collapseViralFloor01: 0.004,
  maxPhaseStepPerTick01: 0.003,
  couplingSoftenAtHighViral01: 0.005
});

/** v564 hedefi / v566 EMA ile uyumlu kayan politika alanları */
export const ANCHOR_POLICY_FLOAT_KEYS565 = Object.freeze([
  "collapseStressLock01",
  "maxDispersion01ForCollapseEnter",
  "collapseViralFloor01",
  "maxPhaseStepPerTick01",
  "couplingSoftenAtHighViral01"
]);

function cloneFullPolicy(partial) {
  return { ...DEFAULT_PHASE_CONSTRAINT_POLICY, ...partial };
}

function stepIntToward(current, target, maxStep) {
  const ci = Math.round(Number(current) || 3);
  const ti = Math.round(Number(target) || 3);
  const cap = Math.max(1, Math.floor(maxStep ?? 1));
  if (ti > ci) return Math.min(ti, ci + cap);
  if (ti < ci) return Math.max(ti, ci - cap);
  return ci;
}

/**
 * @param {{
 *   baselinePolicy?: Partial<typeof DEFAULT_PHASE_CONSTRAINT_POLICY>,
 *   equilibriumSmoothing01?: number,
 *   anchorPullTowardBaseline01?: number,
 *   maxPolicyDeltaPerTick?: Partial<typeof DEFAULT_EQUILIBRIUM_ANCHOR565.maxPolicyDeltaPerTick>,
 *   collapseMaxEntersPerTick?: number
 * }} [opts]
 */
export function createConstraintEquilibriumAnchorV565(opts = {}) {
  const p = { ...DEFAULT_EQUILIBRIUM_ANCHOR565, ...opts };
  const baseSmooth = clamp01(p.equilibriumSmoothing01 ?? 0.2);
  const basePull = clamp01(p.anchorPullTowardBaseline01 ?? 0.038);
  const baseMaxD = { ...DEFAULT_EQUILIBRIUM_ANCHOR565.maxPolicyDeltaPerTick, ...opts.maxPolicyDeltaPerTick };
  const intStepCap = Math.max(1, Math.floor(p.collapseMaxEntersPerTick ?? 1));

  const tuning = {
    smooth: baseSmooth,
    pull: basePull,
    maxD: { ...baseMaxD }
  };

  const baseline = cloneFullPolicy(opts.baselinePolicy ?? {});
  normalizePhaseConstraintPolicyInPlace(baseline);

  let equilibrium = cloneFullPolicy(baseline);

  return {
    getBaseline() {
      return cloneFullPolicy(baseline);
    },

    getEquilibrium() {
      return cloneFullPolicy(equilibrium);
    },

    /** v567 / telemetri: anlık hızlı guard parametreleri */
    getFastGuardTuning565() {
      return Object.freeze({
        equilibriumSmoothing01: tuning.smooth,
        anchorPullTowardBaseline01: tuning.pull,
        maxPolicyDeltaPerTick: Object.freeze({ ...tuning.maxD })
      });
    },

    /**
     * v567 — gözlemden gelen histerezisli ince ayar (taban değerlere göre sınırlı).
     * @param {{ maxDeltaScale?: number, smoothScale?: number, pullOffset01?: number }} [patch]
     */
    applyObservationCoupling567(patch = {}) {
      const maxDeltaScale = Number(patch.maxDeltaScale);
      const smoothScale = Number(patch.smoothScale);
      const pullOff = Number(patch.pullOffset01);
      const m = Number.isFinite(maxDeltaScale) ? clamp(maxDeltaScale, 0.65, 1.35) : 1;
      const s = Number.isFinite(smoothScale) ? clamp(smoothScale, 0.72, 1.2) : 1;
      const po = Number.isFinite(pullOff) ? clamp(pullOff, -0.02, 0.04) : 0;
      for (const key of ANCHOR_POLICY_FLOAT_KEYS565) {
        const bk = /** @type {number} */ (baseMaxD[key] ?? 0.015);
        tuning.maxD[key] = clamp(bk * m, bk * 0.65, bk * 1.35);
      }
      tuning.smooth = clamp(baseSmooth * s, 0.08, 0.38);
      tuning.pull = clamp(basePull + po, 0.02, 0.12);
    },

    reset() {
      equilibrium = cloneFullPolicy(baseline);
    },

    /**
     * @param {ReturnType<typeof createPhaseConstraintAdaptationLayer564>} adaptationLayer
     * @param {number} [nowMs]
     * @returns {typeof DEFAULT_PHASE_CONSTRAINT_POLICY}
     */
    step(adaptationLayer, nowMs) {
      const target = adaptationLayer.computePolicyPatch(baseline, nowMs ?? Date.now());
      const next = cloneFullPolicy(equilibrium);

      for (const key of ANCHOR_POLICY_FLOAT_KEYS565) {
        const tk = /** @type {number} */ (target[key]);
        const ek = /** @type {number} */ (next[key]);
        const bk = /** @type {number} */ (baseline[key]);
        let v = ek + (tk - ek) * tuning.smooth;
        const cap = /** @type {number} */ (tuning.maxD[key] ?? 0.015);
        v = ek + clamp(v - ek, -cap, cap);
        v = v + (bk - v) * tuning.pull;
        next[key] = v;
      }

      next.collapseMaxEntersPerWindow = stepIntToward(
        equilibrium.collapseMaxEntersPerWindow,
        target.collapseMaxEntersPerWindow,
        intStepCap
      );

      next.collapseRateWindowMs = equilibrium.collapseRateWindowMs;
      next.maxCouplingPullScale01 = equilibrium.maxCouplingPullScale01;

      normalizePhaseConstraintPolicyInPlace(next);
      equilibrium = next;
      return equilibrium;
    },

    /**
     * v566 — baseline’ı hedefe doğru çok yavaş kaydırır (referans plastisitesi).
     * @param {Partial<typeof DEFAULT_PHASE_CONSTRAINT_POLICY>} targetPolicy genelde denge EMA’sı
     * @param {{ plasticityRate01?: number, maxPlasticDeltaPerMeta?: Partial<typeof DEFAULT_BASELINE_PLASTICITY_CAPS565> }} [plasticityOpts]
     */
    plasticNudgeBaselineToward566(targetPolicy, plasticityOpts = {}) {
      if (!targetPolicy || typeof targetPolicy !== "object") return;
      const rate = clamp01(plasticityOpts.plasticityRate01 ?? 0.006);
      const maxP = {
        ...DEFAULT_BASELINE_PLASTICITY_CAPS565,
        ...plasticityOpts.maxPlasticDeltaPerMeta
      };

      for (const key of ANCHOR_POLICY_FLOAT_KEYS565) {
        const tt = /** @type {unknown} */ (targetPolicy[key]);
        if (typeof tt !== "number" || !Number.isFinite(tt)) continue;
        const b = /** @type {number} */ (baseline[key]);
        let delta = (tt - b) * rate;
        const cap = /** @type {number} */ (maxP[key] ?? 0.004);
        delta = clamp(delta, -cap, cap);
        baseline[key] = b + delta;
      }

      const te = targetPolicy.collapseMaxEntersPerWindow;
      if (typeof te === "number" && Number.isFinite(te)) {
        const ti = Math.round(te);
        const bi = Math.round(Number(baseline.collapseMaxEntersPerWindow) || 3);
        if (ti > bi) baseline.collapseMaxEntersPerWindow = Math.min(ti, bi + 1);
        else if (ti < bi) baseline.collapseMaxEntersPerWindow = Math.max(ti, bi - 1);
      }

      normalizePhaseConstraintPolicyInPlace(baseline);
    }
  };
}

/**
 * v563 + v564 + v565: adaptasyon ölçülür, denge yumuşatılır, çekirdeğe uygulanır.
 * @param {{ initialPolicy?: Partial<typeof DEFAULT_PHASE_CONSTRAINT_POLICY>, adaptation?: object, anchor?: Partial<typeof DEFAULT_EQUILIBRIUM_ANCHOR565> }} [opts]
 */
export function createAnchoredAdaptivePhaseConstraintPipeline565(opts = {}) {
  const baseline = cloneFullPolicy(opts.initialPolicy ?? {});
  normalizePhaseConstraintPolicyInPlace(baseline);

  const kernel = createPhaseConstraintKernel(opts.initialPolicy ?? {});
  const adaptation = createPhaseConstraintAdaptationLayer564(opts.adaptation ?? {});
  const anchor = createConstraintEquilibriumAnchorV565({
    baselinePolicy: baseline,
    ...opts.anchor
  });

  return {
    kernel,
    adaptation,
    anchor,

    tick(nowMs) {
      const t = Number(nowMs) || Date.now();
      const eq = anchor.step(adaptation, t);
      kernel.applyPolicyMerge(eq);
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
    }
  };
}
