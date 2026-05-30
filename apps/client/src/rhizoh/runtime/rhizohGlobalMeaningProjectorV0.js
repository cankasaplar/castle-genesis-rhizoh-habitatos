/**
 * Language projection layer — meaning frame → discourse rhythm (not translation).
 */

import { MF0_DETECTED_LANGUAGE_V0 } from "./rhizohMeaningFrameV0.js";

export const RHIZOH_GLOBAL_PROJECTION_SCHEMA_V0 = "castle.rhizoh.global_meaning_projection.v0";

/** Culture = rhythm adjustment, not literal translation. */
const PROJECTION_MATRIX_V0 = Object.freeze({
  tr: Object.freeze({
    explicitness01: 0.92,
    compression01: 0.72,
    rhythmBias: "flowing",
    discourseStyle: "tonal_narrative",
    pauseMultiplier: 1.05
  }),
  en: Object.freeze({
    explicitness01: 0.78,
    compression01: 0.82,
    rhythmBias: "measured",
    discourseStyle: "linear_discourse",
    pauseMultiplier: 0.95
  }),
  es: Object.freeze({
    explicitness01: 1,
    compression01: 0.7,
    rhythmBias: "engaged",
    discourseStyle: "expressive_rhythm",
    pauseMultiplier: 0.88
  }),
  jp: Object.freeze({
    explicitness01: 0.52,
    compression01: 1.15,
    rhythmBias: "calm",
    discourseStyle: "context_compressed",
    pauseMultiplier: 1.12
  }),
  mixed: Object.freeze({
    explicitness01: 0.75,
    compression01: 0.85,
    rhythmBias: "calm",
    discourseStyle: "balanced",
    pauseMultiplier: 1
  }),
  unknown: Object.freeze({
    explicitness01: 0.8,
    compression01: 0.8,
    rhythmBias: "calm",
    discourseStyle: "balanced",
    pauseMultiplier: 1
  })
});

/**
 * @param {string} lang
 */
function resolveMatrixRowV0(lang) {
  const key = String(lang || "unknown").toLowerCase();
  if (PROJECTION_MATRIX_V0[key]) return PROJECTION_MATRIX_V0[key];
  if (key === MF0_DETECTED_LANGUAGE_V0.MIXED) return PROJECTION_MATRIX_V0.mixed;
  return PROJECTION_MATRIX_V0.unknown;
}

/**
 * @param {ReturnType<import("./rhizohMeaningFrameV0.js").extractMeaningFrameV0>} mf
 * @param {{ cohortRhythmPreference?: string | null }} [opts]
 */
export function projectMeaningFrameV0(mf, opts = {}) {
  const baseLang = mf?.language || mf?.detectedLanguage || "unknown";
  const profile = resolveMatrixRowV0(baseLang);
  const cohortRhythm = String(opts.cohortRhythmPreference || "").toLowerCase();
  const rhythmBias =
    cohortRhythm && ["calm", "measured", "flowing", "engaged"].includes(cohortRhythm)
      ? cohortRhythm
      : profile.rhythmBias;

  const pacing =
    mf?.emotionVector?.curiosity > 0.6
      ? "engaged"
      : mf?.emotionVector?.tension > 0.55
        ? "measured"
        : rhythmBias === "engaged"
          ? "engaged"
          : rhythmBias === "flowing"
            ? "flowing"
            : "calm";

  const projectionDirective = buildProjectionDirectiveV0(mf, profile, pacing);

  return Object.freeze({
    schema: RHIZOH_GLOBAL_PROJECTION_SCHEMA_V0,
    language: baseLang,
    profile: Object.freeze({ ...profile, rhythmBias }),
    pacing,
    explicitness01: profile.explicitness01,
    compression01: profile.compression01,
    discourseStyle: profile.discourseStyle,
    pauseMultiplier: profile.pauseMultiplier,
    projectionDirective,
    isTranslation: false,
    carriesMeaningRhythm: true
  });
}

/**
 * @param {ReturnType<import("./rhizohMeaningFrameV0.js").extractMeaningFrameV0>} mf
 * @param {object} profile
 * @param {string} pacing
 */
function buildProjectionDirectiveV0(mf, profile, pacing) {
  const intent = mf?.intent || "reflect";
  const depth = mf?.depth ?? 2;
  const style = profile.discourseStyle;
  return Object.freeze({
    hint: `Project MF-0 (${intent}, depth ${depth}) with ${style}; pacing ${pacing}; explicitness ${profile.explicitness01}; compression ${profile.compression01}. Preserve meaning rhythm — not word-for-word.`,
    responseShape:
      profile.compression01 > 1
        ? "dense_contextual"
        : profile.explicitness01 > 0.9
          ? "expansive_clarifying"
          : "linear_clarifying"
  });
}

export function getGlobalProjectionMatrixV0() {
  return PROJECTION_MATRIX_V0;
}
