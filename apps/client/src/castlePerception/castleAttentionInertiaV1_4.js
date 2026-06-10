/**
 * Castle Attention Inertia v1.4 — temporal inertia + history gradient.
 * Context changes but cognition lags: "mind still at the match."
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_4.md
 */

export const CASTLE_ATTENTION_INERTIA_SCHEMA_V1_4 = "castle.attention_inertia.v1.4";

const INERTIA_HALF_LIFE_MS_V1_4 = 2800;
const HISTORY_MAX_V1_4 = 12;
const LENS_KEYS_V1_4 = ["co_watch", "technical", "social", "ambient", "audiobook", "general"];

/** @type {Map<string, object>} ownerId → inertia state */
const inertiaByOwnerV1_4 = new Map();

function clamp01(n) {
  return Math.max(0, Math.min(1, Number(n) || 0));
}

function lensToVector(lens) {
  const map = {
    co_watch: [1, 0, 0, 0, 0, 0],
    technical: [0, 1, 0, 0, 0, 0],
    social: [0, 0, 1, 0, 0, 0],
    ambient: [0, 0, 0, 1, 0, 0],
    audiobook: [0, 0, 0, 0, 1, 0],
    general: [0, 0, 0, 0, 0, 1]
  };
  const key = String(lens || "general").replace("co_watch_sports", "co_watch");
  return map[key] || map.general;
}

function normalizeVector(vec) {
  const sum = vec.reduce((s, v) => s + v, 0) || 1;
  return vec.map((v) => Number((v / sum).toFixed(4)));
}

function blendVectors(a, b, alpha) {
  return normalizeVector(a.map((v, i) => v * (1 - alpha) + b[i] * alpha));
}

function vectorDot(a, b) {
  return a.reduce((s, v, i) => s + v * b[i], 0);
}

/**
 * Tick cognitive inertia for owner — state + history gradient.
 * @param {object} input
 */
export function tickAttentionInertiaV1_4(input = {}) {
  const ownerId = String(input.ownerId || "user_local");
  const atMs = Number(input.atMs) || Date.now();
  const currentLens = String(input.contextLens || "general").replace("co_watch_sports", "co_watch");
  const currentIntent = clamp01(input.intentWeight ?? input.momentum ?? 0.5);
  const currentVector = lensToVector(currentLens);

  const prev = inertiaByOwnerV1_4.get(ownerId);
  const history = prev ? [...prev.lensHistory] : [];
  history.push(Object.freeze({ lens: currentLens, intentWeight: currentIntent, atMs }));
  if (history.length > HISTORY_MAX_V1_4) history.shift();

  const ageMs = prev ? atMs - prev.atMs : 0;
  const inertiaFactor = Number(clamp01(Math.exp(-ageMs / INERTIA_HALF_LIFE_MS_V1_4)).toFixed(4));
  const lagAlpha = Number((1 - inertiaFactor * 0.72).toFixed(4));

  const historyGradient = computeHistoryGradientV1_4(history.slice(0, -1), atMs);
  const laggedLensVector = blendVectors(
    historyGradient.length ? historyGradient : computeHistoryGradientV1_4(history, atMs),
    currentVector,
    lagAlpha
  );
  const laggedIntentWeight = Number(
    clamp01((prev?.laggedIntentWeight ?? currentIntent) * inertiaFactor + currentIntent * (1 - inertiaFactor)).toFixed(4)
  );

  const pastGradient = history.length > 1 ? historyGradient : lensToVector(currentLens);
  const laggedLens =
    LENS_KEYS_V1_4[pastGradient.indexOf(Math.max(...pastGradient))] || currentLens;
  const contextShiftPending = laggedLens !== currentLens;
  const deferredContextShiftMs = contextShiftPending
    ? Math.round(INERTIA_HALF_LIFE_MS_V1_4 * (1 - inertiaFactor))
    : 0;

  const state = Object.freeze({
    schema: CASTLE_ATTENTION_INERTIA_SCHEMA_V1_4,
    ownerId,
    currentLens,
    laggedLens,
    laggedIntentWeight,
    historyGradient: Object.freeze(laggedLensVector),
    inertiaFactor,
    contextShiftPending,
    deferredContextShiftMs,
    cognitiveMomentum: Number(
      clamp01(laggedIntentWeight * 0.6 + inertiaFactor * 0.4).toFixed(4)
    ),
    atMs
  });

  inertiaByOwnerV1_4.set(ownerId, Object.freeze({ ...state, lensHistory: Object.freeze(history) }));
  publishInertiaV1_4();
  return state;
}

function computeHistoryGradientV1_4(history, atMs) {
  if (!history.length) return lensToVector("general");

  /** @type {number[]} */
  let acc = [0, 0, 0, 0, 0, 0];
  let weightSum = 0;

  for (const h of history) {
    const age = Math.max(0, atMs - h.atMs);
    const w = Math.exp(-age / INERTIA_HALF_LIFE_MS_V1_4) * (h.intentWeight || 0.5);
    const vec = lensToVector(h.lens);
    acc = acc.map((v, i) => v + vec[i] * w);
    weightSum += w;
  }

  if (weightSum <= 0) return lensToVector("general");
  return normalizeVector(acc.map((v) => v / weightSum));
}

export function getAttentionInertiaV1_4(ownerId) {
  return inertiaByOwnerV1_4.get(String(ownerId)) || null;
}

export function applyInertiaToShareV1_4(baseShare, inertia, threadTopicLabel) {
  const threadLens = String(threadTopicLabel || "general").replace("co_watch_sports", "co_watch");
  const threadVec = lensToVector(threadLens);
  const alignment = vectorDot(inertia.historyGradient || lensToVector("general"), threadVec);
  const lagBoost = inertia.contextShiftPending ? alignment * inertia.inertiaFactor * 0.35 : alignment * 0.15;
  const delayedPenalty = inertia.contextShiftPending
    ? (1 - alignment) * (inertia.deferredContextShiftMs / INERTIA_HALF_LIFE_MS_V1_4) * 0.2
    : 0;
  return Number(clamp01(baseShare + lagBoost - delayedPenalty).toFixed(4));
}

function publishInertiaV1_4() {
  if (typeof window === "undefined") return;
  window.__castle = window.__castle || {};
  window.__castle.attentionInertia = Object.freeze({
    states: Object.freeze([...inertiaByOwnerV1_4.values()].map((s) =>
      Object.freeze({
        ownerId: s.ownerId,
        laggedLens: s.laggedLens,
        cognitiveMomentum: s.cognitiveMomentum,
        contextShiftPending: s.contextShiftPending
      })
    ))
  });
}

/** @internal vitest */
export function __resetAttentionInertiaForTestV1_4() {
  inertiaByOwnerV1_4.clear();
}
