import { normalizeEmotionState } from "../emotion/emotionState.js";
import { RHIZOH_IDENTITY_ANCHOR } from "./identityAnchor.js";
import { normalizeGovernorCalibration } from "./adaptiveGovernorCalibration.js";

const EMOTION_KEYS = ["trust", "familiarity", "tension", "wonder", "care", "rupture", "repair"];

/**
 * Bant dışına çıkan eksenleri baseline’a doğru yumuşak çeker (elastic).
 * @param {Record<string, unknown>} emotions
 * @param {"preLlm"|"postOutcome"} mode
 * @param {unknown} [calibration] — meta.rhizohGovernorCalibration
 */
export function softClampEmotionsToIdentityAnchor(emotions, mode = "postOutcome", calibration) {
  const cal = normalizeGovernorCalibration(calibration);
  const anchor = RHIZOH_IDENTITY_ANCHOR;
  const baseline = normalizeEmotionState(anchor.emotionBaseline);
  const cur = normalizeEmotionState(emotions);
  const drift = anchor.allowedDrift;
  const pullBase = mode === "preLlm" ? anchor.preLlmPullStrength : anchor.postOutcomePullStrength;
  const pullMult = mode === "preLlm" ? cal.pullScalePre : cal.pullScalePost;
  const pull = Math.max(0.04, Math.min(0.45, pullBase * pullMult));
  const next = { ...cur };

  for (const k of EMOTION_KEYS) {
    const b = baseline[k];
    const ad = (drift[k] ?? 0.35) * cal.driftBandScale;
    const lo = Math.max(0, b - ad);
    const hi = Math.min(1, b + ad);
    let v = next[k];
    if (v < lo) v = v + (lo - v) * pull;
    if (v > hi) v = v + (hi - v) * pull;
    next[k] = v;
  }
  return normalizeEmotionState(next);
}

/**
 * İlişkisel tonu kimlik sınırlarına oturtur (sert sınır + hafif yumuşak).
 * @param {Record<string, number>} tone
 */
export function clampRelationalToneToAnchor(tone) {
  const bounds = RHIZOH_IDENTITY_ANCHOR.relationalToneBounds;
  const t = { ...tone };
  const keys = ["warmth", "directness", "patience", "depth"];
  for (const k of keys) {
    const b = bounds[k];
    if (!b) continue;
    let v = Number(t[k]) || 0;
    if (v < b.min) v = b.min + (v - b.min) * 0.4;
    if (v > b.max) v = b.max + (v - b.max) * 0.4;
    v = Math.max(b.min, Math.min(b.max, v));
    t[k] = Math.round(v * 1000) / 1000;
  }
  return t;
}

/**
 * Tek bir hafıza öğesinin toplam içindeki payını sınırlar (bias attractor önlemi).
 * @param {Array<Record<string, unknown>>} recall selectWeightedMemoryTurns çıktısı
 * @param {{ maxTopShare?: number }} [opts]
 */
export function applyMemoryDominanceCap(recall, opts = {}) {
  const maxTopShare = typeof opts.maxTopShare === "number" ? opts.maxTopShare : 0.38;
  if (!Array.isArray(recall) || recall.length < 2) return recall;

  const weights = recall.map((r) => Math.max(0, Number(r.retrievalWeight) || 0));
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 1e-9) return recall;

  let maxIdx = 0;
  weights.forEach((w, i) => {
    if (w > weights[maxIdx]) maxIdx = i;
  });
  const maxW = weights[maxIdx];
  if (maxW / sum <= maxTopShare) return recall;

  const cappedTop = maxTopShare * sum;
  const remainder = sum - cappedTop;
  const othersSum = sum - maxW;
  const newWeights = weights.map((w, i) => {
    if (i === maxIdx) return cappedTop;
    if (othersSum <= 1e-9) return remainder / Math.max(1, weights.length - 1);
    return (w / othersSum) * remainder;
  });

  return recall.map((r, i) => ({
    ...r,
    retrievalWeight: Math.round(newWeights[i] * 1e6) / 1e6
  }));
}

/**
 * Uzun ufuk anlatı özeti (hafif; sıkıştırma katmanına hazırlık).
 * @param {unknown} prev
 * @param {{ userSnippet?: string, intent?: string }} input
 */
export function mergeRhizohNarrativeThread(prev, { userSnippet, intent }) {
  const sn = String(userSnippet || "").replace(/\s+/g, " ").trim().slice(0, 140);
  const int = String(intent || "CHAT");
  const p = prev && typeof prev === "object" ? prev : {};
  const chain = Array.isArray(p.intentChain) ? p.intentChain.slice(-7) : [];
  chain.push(int);
  const prevArc = String(p.arcSummary || "").trim();
  const step = sn ? `${int}:${sn.slice(0, 48)}` : int;
  const arcSummary = [prevArc, step].filter(Boolean).join(" → ").slice(-360);
  return {
    intentChain: chain.slice(-10),
    focusIntent: int,
    lastUserSnippet: sn,
    arcSummary,
    updatedAt: Date.now()
  };
}
