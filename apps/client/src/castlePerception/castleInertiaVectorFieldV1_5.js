/**
 * Castle Inertia Vector Field v1.5 — vector inertia + directional resistance matrix.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_5.md
 */

export const CASTLE_INERTIA_VECTOR_FIELD_SCHEMA_V1_5 = "castle.inertia_vector_field.v1.5";

const LENS_KEYS_V1_5 = ["co_watch", "technical", "social", "ambient", "audiobook", "general"];

const RESISTANCE_MATRIX_V1_5 = Object.freeze({
  co_watch: Object.freeze({
    co_watch: 0.05,
    technical: 0.45,
    social: 0.72,
    ambient: 0.5,
    audiobook: 0.58,
    general: 0.4
  }),
  technical: Object.freeze({
    co_watch: 0.55,
    technical: 0.05,
    social: 0.35,
    ambient: 0.4,
    audiobook: 0.42,
    general: 0.28
  }),
  social: Object.freeze({
    co_watch: 0.25,
    technical: 0.38,
    social: 0.05,
    ambient: 0.3,
    audiobook: 0.48,
    general: 0.2
  }),
  ambient: Object.freeze({
    co_watch: 0.5,
    technical: 0.45,
    social: 0.35,
    ambient: 0.05,
    audiobook: 0.4,
    general: 0.25
  }),
  audiobook: Object.freeze({
    co_watch: 0.62,
    technical: 0.4,
    social: 0.52,
    ambient: 0.35,
    audiobook: 0.05,
    general: 0.38
  }),
  general: Object.freeze({
    co_watch: 0.42,
    technical: 0.32,
    social: 0.22,
    ambient: 0.28,
    audiobook: 0.45,
    general: 0.05
  })
});

function clamp01(n) {
  return Math.max(0, Math.min(1, Number(n) || 0));
}

function normalizeKey(lens) {
  return String(lens || "general").replace("co_watch_sports", "co_watch");
}

function lensToVector(lens) {
  const idx = LENS_KEYS_V1_5.indexOf(normalizeKey(lens));
  const v = [0, 0, 0, 0, 0, 0];
  v[idx >= 0 ? idx : LENS_KEYS_V1_5.length - 1] = 1;
  return v;
}

export function buildInertiaVectorFieldV1_5(input = {}) {
  const fromLens = normalizeKey(input.laggedLens || input.fromLens || "general");
  const toLens = normalizeKey(input.currentLens || input.toLens || "general");
  const userIntentBoost = clamp01(input.userIntentBoost ?? input.intentWeight ?? 0.5);

  let resistance = RESISTANCE_MATRIX_V1_5[fromLens]?.[toLens] ?? 0.4;
  if (userIntentBoost > 0.75) {
    resistance = clamp01(resistance * (1 - userIntentBoost * 0.55));
  }

  const direction = lensToVector(fromLens).map((v, i) => {
    const target = lensToVector(toLens)[i];
    return Number((target - v).toFixed(4));
  });

  const magnitude = Number(
    clamp01(input.cognitiveMomentum ?? input.inertiaFactor ?? 0.5).toFixed(4)
  );

  return Object.freeze({
    schema: CASTLE_INERTIA_VECTOR_FIELD_SCHEMA_V1_5,
    magnitude,
    direction: Object.freeze(direction),
    resistanceMatrix: RESISTANCE_MATRIX_V1_5,
    transitionResistance: Number(resistance.toFixed(4)),
    fromLens,
    toLens,
    userIntentOverride: userIntentBoost > 0.75
  });
}

export function applyVectorResistanceV1_5(baseShare, vectorField, threadTopic) {
  const threadLens = normalizeKey(threadTopic);
  const alignment = vectorField.direction[LENS_KEYS_V1_5.indexOf(threadLens)] ?? 0;
  const resist = vectorField.transitionResistance;
  const boost = vectorField.magnitude * (1 - resist) * Math.max(0, alignment);
  const penalty = resist * (1 - Math.abs(alignment)) * 0.35;
  return Number(clamp01(baseShare + boost - penalty).toFixed(4));
}

export function getResistanceV1_5(fromLens, toLens) {
  return RESISTANCE_MATRIX_V1_5[normalizeKey(fromLens)]?.[normalizeKey(toLens)] ?? 0.4;
}
