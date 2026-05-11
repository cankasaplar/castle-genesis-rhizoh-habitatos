/**
 * RHIZOH CONSTITUTIONAL STACK v2.2.0 (V) — θ zaman evrimi fonktör olarak; denklik sınıfları davranış özdeşliği.
 */

import { resolveRhizohThetaPhase } from "./thetaPhaseTransitionV1.js";

export const RHIZOH_THETA_FUNCTOR_VERSION = "2.2.0";

/** İfade düzeyi teorem özeti (çalışır tanım + denklik kotası). */
export const RHIZOH_THETA_FUNCTOR_EQUIVALENCE_THEOREM_NOTE = Object.freeze({
  statement:
    "Ayrık şemada F: ℕ_disc → ConstitutionalPhaseSketch, n ↦ (θₙ, Φ(θₙ)); iki yörünge aynı denklik sınıfındadır ⇔ son θ ve Φ(θ) ∈ ε komşuluğu içindedir (θ için), faz etiketi özdeş.",
  scope: "finite_paths_numeric_quotient",
  formalProof: "external"
});

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * @typedef {{
 *   step: number,
 *   theta: number,
 *   phase?: string | null,
 *   stressIndex?: number | null
 * }} RhizohThetaFunctorStage
 */

/**
 * Durum dizisinden ayrık fonktör görüntüsü.
 * @param {RhizohThetaFunctorStage[]} sequence kronolojik
 */
export function buildRhizohThetaEvolutionFunctor(sequence) {
  const seq = [...(sequence || [])].map((s, i) => ({
    step: typeof s.step === "number" ? s.step : i,
    theta: clamp01(s.theta),
    phase: s.phase ?? resolveRhizohThetaPhase(clamp01(s.theta)).phase,
    stressIndex: typeof s.stressIndex === "number" ? clamp01(s.stressIndex) : null
  }));

  const objects = seq.map((s) => ({
    id: `T_${s.step}`,
    imageTheta: s.theta,
    imagePhase: s.phase
  }));

  /** @type {{ src: string, tgt: string, deltaTheta: number }[]} */
  const morphisms = [];
  for (let i = 0; i < seq.length - 1; i++) {
    morphisms.push({
      src: `T_${seq[i].step}`,
      tgt: `T_${seq[i + 1].step}`,
      deltaTheta: Math.round((seq[i + 1].theta - seq[i].theta) * 10000) / 10000
    });
  }

  return {
    functorVersion: RHIZOH_THETA_FUNCTOR_VERSION,
    theoremNote: RHIZOH_THETA_FUNCTOR_EQUIVALENCE_THEOREM_NOTE,
    discreteCategory: "N_linear_chain",
    objects,
    morphisms,
    terminalImage:
      seq.length > 0
        ? {
            theta: seq[seq.length - 1].theta,
            phase: seq[seq.length - 1].phase
          }
        : null
  };
}

/**
 * Son θ ve faz üzerinden ε-denklik sınıfı anahtarı.
 */
export function thetaPathRhizohEquivalenceKey(pathSummary, epsilon = 0.025) {
  const eps = Math.max(1e-6, Number(epsilon) || 0.025);
  const theta = clamp01(pathSummary.finalTheta ?? pathSummary.theta ?? 0);
  const phase = String(
    pathSummary.terminalPhase || pathSummary.phase || resolveRhizohThetaPhase(theta).phase
  );
  const bucket = Math.round(theta / eps);
  return `${phase}|${bucket}`;
}

/**
 * Yolların kümesini denklik sınıflarına böler.
 * @param {ReadonlyArray<{ finalTheta: number, terminalPhase: string }>} paths
 */
export function quotientRhizohThetaPathsByEquivalence(paths, epsilon = 0.025) {
  /** @type {Record<string, number>} */
  const buckets = {};
  for (const p of paths || []) {
    const key = thetaPathRhizohEquivalenceKey(p, epsilon);
    buckets[key] = (buckets[key] || 0) + 1;
  }
  const classes = Object.entries(buckets).map(([key, count]) => ({ key, count }));
  classes.sort((a, b) => b.count - a.count);
  return {
    epsilon,
    equivalenceClasses: classes,
    classCount: classes.length
  };
}

/**
 * İki evrimin global denklik özeti (aynı sınıfta mı + θ ayrımı).
 */
export function theoremRhizohThetaFunctorEquivalenceSummary(pathA, pathB, epsilon = 0.025) {
  const ka = thetaPathRhizohEquivalenceKey(pathA, epsilon);
  const kb = thetaPathRhizohEquivalenceKey(pathB, epsilon);
  const sameClass = ka === kb;
  const dTheta = Math.abs(
    clamp01(pathA.finalTheta ?? pathA.theta ?? 0) - clamp01(pathB.finalTheta ?? pathB.theta ?? 0)
  );
  return {
    sameEquivalenceClass: sameClass,
    keyA: ka,
    keyB: kb,
    thetaSeparation: Math.round(dTheta * 10000) / 10000,
    epsilonUsed: epsilon,
    narrative: sameClass
      ? "Yollar aynı ε–faz kotası içinde (fonktör görüntüsü denklik sınıfında)."
      : "Yollar ayrı ε–faz kotasında; global kanonik temsil farklı."
  };
}

/**
 * Zaman adımlarında faz etiketi ile θ çözümlemesi uyumu (yerel tutarlılık).
 */
export function verifyRhizohThetaFunctorSequentialConsistency(sequence) {
  const seq = [...(sequence || [])];
  let ok = true;
  /** @type {{ step: number, theta: number, resolvedPhase: string, labelPhase: string }[]} */
  const rows = [];
  for (let i = 0; i < seq.length; i++) {
    const theta = clamp01(seq[i].theta);
    const resolved = resolveRhizohThetaPhase(theta).phase;
    const label = seq[i].phase ?? resolved;
    if (label !== resolved) ok = false;
    rows.push({ step: i, theta, resolvedPhase: resolved, labelPhase: label });
  }
  return {
    ok,
    rows,
    note: "Etiket faz ile θ üzerinden çözümlenen faz uyumlu olmalı."
  };
}
