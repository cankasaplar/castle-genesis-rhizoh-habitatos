/**
 * vNext-570 — Epistemic Error Semantics Layer
 *
 * v567–v569 çıktısı + v566 anlık görüntü + v569 öncesi drift → hata sınıfı:
 * benign (ölçüm/yol gürültüsü, yumuşatma kayması) vs harmful (gerçek histerezis churn).
 * `benign01` / `correctionPriority01` → `recordCouplingOutcome569` ölçekleri.
 */

import { createTrustLearningObservationPipeline569 } from "./phaseTrustCalibrationDriftV569.js";

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

/** @readonly */
export const EPISTEMIC_ERROR_KIND570 = Object.freeze({
  NEUTRAL: "neutral",
  SKIPPED_OBSERVATION: "skipped_observation",
  BENIGN_DRIFT: "benign_drift",
  PATH_NOISE: "path_noise",
  HARMFUL_FLIP_PRESSURE: "harmful_flip_pressure"
});

/** @readonly */
export const DEFAULT_EPISTEMIC_ERROR_SEMANTICS570 = Object.freeze({
  /** raw–smoothed bütçe farkı; üstü “yol gürültüsü” kredisi */
  gapLo01: 0.02,
  gapHi01: 0.14,
  /** pencereli flip basıncı eşikleri (driftState569.recentFlipPressure01) */
  flipLo01: 0.12,
  flipHi01: 0.42
});

/**
 * @param {{
 *   snap566: { budget01?: number | null },
 *   result567: { skipped?: boolean, smoothedBudget01?: number, rawBudget01?: number },
 *   driftState569: { recentFlipPressure01?: number }
 * }} ctx
 * @param {Partial<typeof DEFAULT_EPISTEMIC_ERROR_SEMANTICS570>} [policy]
 * @returns {{ kind: string, benign01: number, correctionPriority01: number }}
 */
export function classifyEpistemicObservation570(ctx, policy = {}) {
  const p = { ...DEFAULT_EPISTEMIC_ERROR_SEMANTICS570, ...policy };
  const skipped = !!ctx?.result567?.skipped;
  if (skipped) {
    return Object.freeze({
      kind: EPISTEMIC_ERROR_KIND570.SKIPPED_OBSERVATION,
      benign01: 0.62,
      correctionPriority01: 0.36
    });
  }

  const raw = ctx?.result567?.rawBudget01;
  const sm = ctx?.result567?.smoothedBudget01;
  let gap01 = 0;
  if (raw != null && sm != null && Number.isFinite(raw) && Number.isFinite(sm)) {
    gap01 = clamp01(Math.abs(raw - sm));
  }

  const gLo = clamp01(p.gapLo01 ?? 0.02);
  const gHi = Math.max(gLo + 1e-4, clamp01(p.gapHi01 ?? 0.14));
  const artifact01 = clamp01((gap01 - gLo) / (gHi - gLo));

  const flipP = clamp01(ctx?.driftState569?.recentFlipPressure01 ?? 0);
  const fLo = clamp01(p.flipLo01 ?? 0.12);
  const fHi = Math.max(fLo + 1e-4, clamp01(p.flipHi01 ?? 0.42));
  const flipSeverity01 = clamp01((flipP - fLo) / (fHi - fLo));

  /** Büyük gap: flip’ler kısmen yumuşatma artefaktı — benign yükselir, öncelik düşer */
  const harmfulCore = clamp01(flipSeverity01 * (1 - 0.72 * artifact01));
  const benign01 = clamp01(0.34 + 0.66 * (1 - harmfulCore) + 0.22 * artifact01);
  const correctionPriority01 = clamp01(0.22 + 0.78 * harmfulCore);

  let kind = EPISTEMIC_ERROR_KIND570.NEUTRAL;
  if (artifact01 >= 0.58 && flipSeverity01 >= 0.35) kind = EPISTEMIC_ERROR_KIND570.PATH_NOISE;
  else if (artifact01 >= 0.52 && flipSeverity01 < 0.38) kind = EPISTEMIC_ERROR_KIND570.BENIGN_DRIFT;
  else if (harmfulCore >= 0.52) kind = EPISTEMIC_ERROR_KIND570.HARMFUL_FLIP_PRESSURE;

  return Object.freeze({ kind, benign01, correctionPriority01 });
}

/**
 * @param {Partial<typeof DEFAULT_EPISTEMIC_ERROR_SEMANTICS570>} [policy]
 * @returns {(ctx: object) => { kind: string, benign01: number, correctionPriority01: number }}
 */
export function createEpistemicSemanticsClassifier570(policy = {}) {
  const merged = { ...DEFAULT_EPISTEMIC_ERROR_SEMANTICS570, ...policy };
  return (ctx) => classifyEpistemicObservation570(ctx, merged);
}

/**
 * v570 + v569 birleşik boru hattı (`semanticsClassify570` enjekte).
 * @param {Parameters<typeof createTrustLearningObservationPipeline569>[0] & { epistemicSemantics570?: Partial<typeof DEFAULT_EPISTEMIC_ERROR_SEMANTICS570> }} [opts]
 */
export function createSemanticEpistemicObservationPipeline570(opts = {}) {
  const { epistemicSemantics570, ...rest } = opts ?? {};
  const semanticsClassify570 = createEpistemicSemanticsClassifier570(epistemicSemantics570 ?? {});
  return createTrustLearningObservationPipeline569({
    ...rest,
    semanticsClassify570
  });
}
