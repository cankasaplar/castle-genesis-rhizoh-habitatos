/**
 * Rhizoh Attention Field v0 — Sprint C: öneri alanı, emir değil.
 * Rhizoh önerir; Octo karar verir. Bias <= 0.25; cube novelty baskın kalır.
 * @see rhizohMemoryV0.js · octoReactionEcologyV0.js
 */

export const RHIZOH_ATTENTION_FIELD_SCHEMA_V0 = "castle.rhizoh_attention_field.v0";

/** Per ~500ms tick equivalent — Rhizoh geçmişte takılı kalmasın. */
export const ATTENTION_FIELD_DECAY_PER_500MS_V0 = 0.995;
export const ATTENTION_HINT_BIAS_CAP_V0 = 0.25;
export const ATTENTION_FIELD_CELL_CAP_V0 = 0.42;
export const ATTENTION_FIELD_MIN_CELL_V0 = 0.01;

const GEOMETRY_HINT_TARGETS_V0 = new Set(["spiral", "branching", "spike", "stretch", "neutral", "map"]);

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * @param {string} raw
 */
export function normalizeAttentionFieldTargetV0(raw) {
  const key = String(raw || "")
    .trim()
    .toLowerCase();
  if (!key) return "";
  if (GEOMETRY_HINT_TARGETS_V0.has(key)) return key;
  if (key === "observation") return "stretch";
  if (key === "reasoning") return "spiral";
  if (key === "memory") return "branching";
  if (key === "action") return "spike";
  return key;
}

/**
 * @param {Record<string, number>} [seed]
 */
export function createRhizohAttentionFieldV0(seed = {}) {
  const field = {};
  for (const [key, value] of Object.entries(seed)) {
    const target = normalizeAttentionFieldTargetV0(key);
    const weight = clamp01(value);
    if (target && weight >= ATTENTION_FIELD_MIN_CELL_V0) field[target] = weight;
  }
  return field;
}

/**
 * @param {Record<string, number>} field
 * @param {number} [deltaMs]
 */
export function decayRhizohAttentionFieldV0(field, deltaMs = 500) {
  const factor = Math.pow(ATTENTION_FIELD_DECAY_PER_500MS_V0, Math.max(0, deltaMs) / 500);
  for (const key of Object.keys(field)) {
    const next = clamp01((field[key] ?? 0) * factor);
    if (next < ATTENTION_FIELD_MIN_CELL_V0) delete field[key];
    else field[key] = next;
  }
  return field;
}

/**
 * Dikkat birikir — kuyruk değil, alan hücresi.
 * @param {Record<string, number>} field
 * @param {string} target
 * @param {number} weight
 */
export function depositRhizohAttentionFieldV0(field, target, weight) {
  const key = normalizeAttentionFieldTargetV0(target);
  const deposit = clamp01(weight);
  if (!key || deposit < ATTENTION_FIELD_MIN_CELL_V0) return null;

  const blended = clamp01((field[key] ?? 0) * 0.82 + deposit * 0.38);
  field[key] = Math.min(ATTENTION_FIELD_CELL_CAP_V0, blended);
  return Object.freeze({ target: key, weight: field[key] });
}

/**
 * @param {Record<string, number>} field
 */
export function snapshotRhizohAttentionFieldV0(field) {
  const rows = Object.entries(field)
    .map(([target, weight]) => Object.freeze({ target, weight: clamp01(weight) }))
    .sort((a, b) => b.weight - a.weight);
  return Object.freeze({
    schema: RHIZOH_ATTENTION_FIELD_SCHEMA_V0,
    field: Object.freeze({ ...field }),
    rows: Object.freeze(rows)
  });
}

/**
 * Octo ecology — eşleşen geometri için küçük interest bias.
 * @param {Record<string, number>} field
 * @param {string} geometryKind
 * @param {number} [cap]
 */
export function resolveAttentionHintBiasV0(field, geometryKind, cap = ATTENTION_HINT_BIAS_CAP_V0) {
  const key = normalizeAttentionFieldTargetV0(geometryKind);
  const raw = clamp01(field?.[key] ?? 0);
  return Math.min(cap, raw * 0.72);
}

/**
 * Rhizoh memory gözlemlerinden alanı besle (emir üretmez).
 * @param {import("./rhizohMemoryV0.js").ReturnType<typeof import("./rhizohMemoryV0.js").createRhizohMemoryV0>} memory
 * @param {{ attentionEntry?: { focus: string, strength: number } | null, topicTouches?: Array<{ topic: string, mentions: number }> }} [tick]
 */
export function syncRhizohAttentionFieldFromMemoryV0(memory, tick = {}) {
  const field = memory.attentionField;
  const entry = tick.attentionEntry;
  if (entry?.focus) {
    depositRhizohAttentionFieldV0(field, entry.focus, clamp01(entry.strength * 0.34));
  }

  for (const touch of tick.topicTouches ?? []) {
    if ((touch.mentions ?? 0) >= 1) {
      depositRhizohAttentionFieldV0(field, touch.topic, clamp01(0.1 + Math.min(touch.mentions, 20) * 0.018));
    }
  }

  return snapshotRhizohAttentionFieldV0(field);
}

/**
 * @param {Record<string, number>} field
 * @param {number} deltaMs
 * @param {{ attentionEntry?: { focus: string, strength: number } | null, topicTouches?: Array<{ topic: string, mentions: number }> }} [tick]
 */
export function stepRhizohAttentionFieldV0(field, deltaMs, tick = {}) {
  decayRhizohAttentionFieldV0(field, deltaMs);
  if (tick.attentionEntry || (tick.topicTouches?.length ?? 0) > 0) {
    syncRhizohAttentionFieldFromMemoryV0({ attentionField: field }, tick);
  }
  return snapshotRhizohAttentionFieldV0(field);
}
