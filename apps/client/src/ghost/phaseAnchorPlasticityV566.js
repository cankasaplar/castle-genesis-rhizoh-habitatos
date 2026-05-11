/**
 * vNext-566 — Anchor Plasticity Layer
 *
 * v565 baseline’ı “ölü setpoint” değil: denge politikasının yavaş EMA’sına doğru meta-zaman
 * ölçeğinde kayar. Anchor rigidity riskini azaltır; öğrenme iki bantta (hızlı v564, yavaş v566).
 *
 * Mimari rol (yavaş döngü): **equilibrium evolution** — v565 dengeyi korurken v566 denge *nerede olmalı*
 * sorusunu uzun vadede yeniden tarif eder; **dual-timescale**: hızlı adaptasyon vs baseline plastisitesi.
 *
 * **Meta-stability observer:** `computeMetaStabilityBudget01` / `getMetaStabilityReadout566` / `readTriaxialStabilitySnapshot566`
 * — durum okuması; v567–v569 zincirinde güven ipucu ve öğrenmeli düzeltme.
 */

import { createPhaseConstraintAdaptationLayer564 } from "./phaseConstraintAdaptationV564.js";
import {
  ANCHOR_POLICY_FLOAT_KEYS565,
  createConstraintEquilibriumAnchorV565,
  DEFAULT_BASELINE_PLASTICITY_CAPS565,
  DEFAULT_EQUILIBRIUM_ANCHOR565
} from "./phaseConstraintEquilibriumAnchorV565.js";
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
export const DEFAULT_ANCHOR_PLASTICITY566 = Object.freeze({
  equilibriumEmaAlpha01: 0.055,
  plasticityRate01: 0.006,
  metaIntervalMs: 45_000,
  maxPlasticDeltaPerMeta: Object.freeze({ ...DEFAULT_BASELINE_PLASTICITY_CAPS565 })
});

/**
 * İki zaman ölçeği bağlantısının grof skaleri: üst bant (EMA) ile baseline plastisitesinin çarpımı.
 * **Durum / gözlem ekseni** (tuning tek başına değil): “yavaş öğrenme ile referans güncellemesi ne kadar sıkı bağlı?”
 * Yüksek → öğrenilen denge referansa hızlı işlenir (aşırısı: epistemik drift); düşük → donuk referans.
 * `metaIntervalMs` ve v565 `anchorPullTowardBaseline01` üçüncü eksende birlikte okunur (`readTriaxialStabilitySnapshot566`).
 */
export function computeMetaStabilityBudget01(plasticityRate01, equilibriumEmaAlpha01) {
  return clamp01(plasticityRate01) * clamp01(equilibriumEmaAlpha01);
}

/**
 * Hızlı guard (v565 çekimi) + yavaş evrim (v566) + meta bütçe — tek nesnede salt okuma.
 * @param {{ plasticity?: { getMetaStabilityReadout566: () => object }, anchor?: { getFastGuardTuning565: () => { anchorPullTowardBaseline01: number } }, anchorPullTowardBaseline01?: number }} opts
 */
export function readTriaxialStabilitySnapshot566(opts = {}) {
  let pull = opts.anchorPullTowardBaseline01;
  if (pull == null && opts.anchor && typeof opts.anchor.getFastGuardTuning565 === "function") {
    pull = opts.anchor.getFastGuardTuning565().anchorPullTowardBaseline01;
  }
  pull = clamp01(pull ?? DEFAULT_EQUILIBRIUM_ANCHOR565.anchorPullTowardBaseline01);
  const plasticity = opts.plasticity;
  if (!plasticity || typeof plasticity.getMetaStabilityReadout566 !== "function") {
    return Object.freeze({
      anchorPullTowardBaseline01: pull,
      budget01: null,
      plasticityRate01: null,
      equilibriumEmaAlpha01: null,
      metaIntervalMs: null
    });
  }
  const r = plasticity.getMetaStabilityReadout566();
  return Object.freeze({
    anchorPullTowardBaseline01: pull,
    ...r
  });
}

/**
 * @param {Partial<typeof DEFAULT_ANCHOR_PLASTICITY566>} [opts]
 */
export function createAnchorPlasticityLayer566(opts = {}) {
  const p = { ...DEFAULT_ANCHOR_PLASTICITY566, ...opts };
  const maxP = { ...DEFAULT_ANCHOR_PLASTICITY566.maxPlasticDeltaPerMeta, ...opts.maxPlasticDeltaPerMeta };
  const basePR = clamp01(p.plasticityRate01);
  const baseEma = clamp01(p.equilibriumEmaAlpha01);
  const baseMeta = Math.max(1000, Math.floor(p.metaIntervalMs ?? 45_000));
  const tuning = {
    plasticityRate01: basePR,
    equilibriumEmaAlpha01: baseEma,
    metaIntervalMs: baseMeta
  };
  /** @type {typeof DEFAULT_PHASE_CONSTRAINT_POLICY | null} */
  let equilibriumEma = null;
  /** @type {number | null} */
  let lastMetaMs = null;

  return {
    reset() {
      equilibriumEma = null;
      lastMetaMs = null;
    },

    getEquilibriumEma() {
      return equilibriumEma ? cloneFullPolicy(equilibriumEma) : null;
    },

    getMetaStabilityBudget01() {
      return computeMetaStabilityBudget01(tuning.plasticityRate01, tuning.equilibriumEmaAlpha01);
    },

    /**
     * Meta-stability observer çıktısı (v567 sonrası efektif oranlar dahil).
     * @returns {{ budget01: number, plasticityRate01: number, equilibriumEmaAlpha01: number, metaIntervalMs: number }}
     */
    getMetaStabilityReadout566() {
      const pr = clamp01(tuning.plasticityRate01);
      const ema = clamp01(tuning.equilibriumEmaAlpha01);
      const metaIntervalMs = Math.max(1000, Math.floor(tuning.metaIntervalMs ?? 45_000));
      return Object.freeze({
        budget01: pr * ema,
        plasticityRate01: pr,
        equilibriumEmaAlpha01: ema,
        metaIntervalMs
      });
    },

    /**
     * v567 — bütçe yüksekken yavaş döngüyü yumuşatır (taban oranlara göre sınırlı).
     * @param {{ plasticityScale?: number, emaAlphaScale?: number }} [patch]
     */
    applyObservationCoupling567(patch = {}) {
      const ps = Number(patch.plasticityScale);
      const es = Number(patch.emaAlphaScale);
      const pScale = Number.isFinite(ps) ? clamp(ps, 0.4, 1) : 1;
      const eScale = Number.isFinite(es) ? clamp(es, 0.4, 1) : 1;
      tuning.plasticityRate01 = clamp(basePR * pScale, basePR * 0.35, basePR * 1);
      tuning.equilibriumEmaAlpha01 = clamp(baseEma * eScale, baseEma * 0.35, baseEma * 1);
      tuning.metaIntervalMs = baseMeta;
    },

    /**
     * @param {ReturnType<typeof createConstraintEquilibriumAnchorV565>} anchor
     * @param {number} nowMs
     * @returns {{ didMeta: boolean }}
     */
    step(anchor, nowMs) {
      const t = Number(nowMs) || Date.now();
      const eq = anchor.getEquilibrium();
      const a = clamp01(tuning.equilibriumEmaAlpha01 ?? 0.055);

      if (!equilibriumEma) {
        equilibriumEma = cloneFullPolicy(eq);
      } else {
        for (const key of ANCHOR_POLICY_FLOAT_KEYS565) {
          const e = /** @type {number} */ (equilibriumEma[key]);
          const x = /** @type {number} */ (eq[key]);
          equilibriumEma[key] = e + (x - e) * a;
        }
        equilibriumEma.collapseMaxEntersPerWindow = Math.round(
          (1 - a) * equilibriumEma.collapseMaxEntersPerWindow + a * eq.collapseMaxEntersPerWindow
        );
        normalizePhaseConstraintPolicyInPlace(equilibriumEma);
      }

      let didMeta = false;
      if (lastMetaMs == null) {
        lastMetaMs = t;
        return { didMeta: false };
      }

      const interval = Math.max(1000, Math.floor(tuning.metaIntervalMs ?? 45_000));
      if (t - lastMetaMs >= interval) {
        lastMetaMs = t;
        anchor.plasticNudgeBaselineToward566(equilibriumEma, {
          plasticityRate01: tuning.plasticityRate01,
          maxPlasticDeltaPerMeta: maxP
        });
        didMeta = true;
      }

      return { didMeta };
    }
  };
}

/**
 * v563–v566: kernel + adaptasyon + ankraj + baseline plastisitesi.
 * @param {{
 *   initialPolicy?: Partial<typeof DEFAULT_PHASE_CONSTRAINT_POLICY>,
 *   adaptation?: object,
 *   anchor?: Partial<typeof DEFAULT_EQUILIBRIUM_ANCHOR565>,
 *   plasticity?: Partial<typeof DEFAULT_ANCHOR_PLASTICITY566>
 * }} [opts]
 */
export function createPlasticAnchoredPhaseConstraintPipeline566(opts = {}) {
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

  return {
    kernel,
    adaptation,
    anchor,
    plasticity,

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
    }
  };
}
