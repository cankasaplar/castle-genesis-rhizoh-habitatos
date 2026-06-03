/**
 * STT origin confidence EMA — temporal smoothing across segments (3–5 window).
 * Single-frame leak spikes do not hard-drop; persistent elevation does.
 */

export const RHIZOH_STT_ORIGIN_CONFIDENCE_EMA_SCHEMA_V0 =
  "castle.rhizoh.stt_origin_confidence_ema.v0";

export const ORIGIN_CONFIDENCE_EMA_WINDOW_V0 = 4;
export const ORIGIN_CONFIDENCE_EMA_ALPHA_V0 = 2 / (ORIGIN_CONFIDENCE_EMA_WINDOW_V0 + 1);

/** @type {{ speech: number, uiLeak: number, subtitleLeak: number, languageMatch: number, templateScore: number, samples: number } | null} */
let emaState = null;

function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * @param {{ speech?: number, uiLeak?: number, subtitleLeak?: number, languageMatch?: number, templateScore?: number }} raw
 */
export function applyOriginConfidenceEmaV0(raw = {}) {
  const instant = Object.freeze({
    speech: clamp01(raw.speech),
    uiLeak: clamp01(raw.uiLeak),
    subtitleLeak: clamp01(raw.subtitleLeak),
    languageMatch: clamp01(raw.languageMatch),
    templateScore: clamp01(raw.templateScore)
  });

  if (!emaState) {
    emaState = { ...instant, samples: 1 };
  } else {
    const a = ORIGIN_CONFIDENCE_EMA_ALPHA_V0;
    emaState = {
      speech: clamp01(emaState.speech * (1 - a) + instant.speech * a),
      uiLeak: clamp01(emaState.uiLeak * (1 - a) + instant.uiLeak * a),
      subtitleLeak: clamp01(emaState.subtitleLeak * (1 - a) + instant.subtitleLeak * a),
      languageMatch: clamp01(emaState.languageMatch * (1 - a) + instant.languageMatch * a),
      templateScore: clamp01(emaState.templateScore * (1 - a) + instant.templateScore * a),
      samples: Math.min(ORIGIN_CONFIDENCE_EMA_WINDOW_V0, emaState.samples + 1)
    };
  }

  const originConfidenceStable = Object.freeze({
    speech: emaState.speech,
    uiLeak: emaState.uiLeak,
    subtitleLeak: emaState.subtitleLeak,
    languageMatch: emaState.languageMatch,
    templateScore: emaState.templateScore
  });

  return Object.freeze({
    schema: RHIZOH_STT_ORIGIN_CONFIDENCE_EMA_SCHEMA_V0,
    instant,
    originConfidenceStable,
    samples: emaState.samples,
    window: ORIGIN_CONFIDENCE_EMA_WINDOW_V0
  });
}

export function resetOriginConfidenceEmaForTestV0() {
  emaState = null;
}

export function endOriginConfidenceEmaSessionV0() {
  emaState = null;
}
