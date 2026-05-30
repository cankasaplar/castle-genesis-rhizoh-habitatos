/**
 * SPECFLOW: RESEARCH-ONLY — **Publish fatigue guard**: narrative runaway önleme (publish score ↔ feedback
 * ↔ governance döngüsünün “sürekli yayın” moduna kilitlenmesi).
 *
 * Mekanizmalar: min episode separation, novelty / tekrar arc baskısı, yoğunluk sonrası cooldown,
 * kaba “audience saturation” belleği (arc başına son pencerelerdeki publish sayısı).
 */

export const NARRATIVE_PUBLISH_FATIGUE_SCHEMA_V0 = "castle.rhizoh.narrative_publish_fatigue.v0";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/** @returns {Record<string, unknown>} */
export function createInitialNarrativePublishFatigueStateV0() {
  return {
    schema: NARRATIVE_PUBLISH_FATIGUE_SCHEMA_V0,
    lastPublishEmitAtMs: 0,
    cooldownUntilMs: 0,
    intensityEwma01: 0,
    /** Son N publish kaydı — arc tekrar bastırması için. */
    recentArcPublishStamps: /** @type {{ arcId: string, ts: number }[]} */ ([]),
    lastGateReason: ""
  };
}

const DEFAULT_WINDOW_MS = 4 * 60 * 60 * 1000;
const DEFAULT_MAX_PER_ARC = 3;
const DEFAULT_COOLDOWN_AFTER_SPIKE_MS = 3 * 60 * 1000;
const DEFAULT_MIN_SEPARATION_MS = 2 * 60 * 1000;

function countArcPublishesInWindow(state, arcId, nowMs, windowMs) {
  const w = Math.max(60_000, Number(windowMs) || DEFAULT_WINDOW_MS);
  const a = String(arcId || "unknown");
  const stamps = Array.isArray(state.recentArcPublishStamps) ? state.recentArcPublishStamps : [];
  return stamps.filter((e) => e && e.arcId === a && nowMs - e.ts < w).length;
}

function trimStamps(stamps, nowMs, windowMs) {
  const w = Math.max(60_000, Number(windowMs) || DEFAULT_WINDOW_MS);
  return stamps.filter((e) => e && nowMs - e.ts < w * 2).slice(-48);
}

/**
 * Her tick gözlem (publish olmasa da) — yoğunluk EWMA + cooldown tetikleri.
 *
 * @param {Record<string, unknown>|null|undefined} prev
 * @param {{ distributor: Record<string, unknown>|null|undefined, nowMs: number, windowMs?: number, maxPerArc?: number }|null} input
 */
export function advanceNarrativePublishFatigueObservationV0(prev, input) {
  const p = prev && typeof prev === "object" ? prev : createInitialNarrativePublishFatigueStateV0();
  const i = input && typeof input === "object" ? input : {};
  const nowMs = Math.max(0, Number(i.nowMs) || Date.now());
  const d = i.distributor && typeof i.distributor === "object" ? i.distributor : null;
  const y = d?.youtubePipelineHint && typeof d.youtubePipelineHint === "object" ? d.youtubePipelineHint : null;
  const pr = y != null ? clamp01(y.publishRecommendationScore) : 0;
  const ed = y != null ? clamp01(y.emotionalDensity01) : 0;
  const mix = clamp01(0.55 * ed + 0.45 * pr);
  const prevEw = clamp01(p.intensityEwma01);
  const intensityEwma01 = Math.round((0.88 * prevEw + 0.12 * mix) * 1000) / 1000;

  let cooldownUntilMs = Math.max(0, Number(p.cooldownUntilMs) || 0);
  /** Yüksek yoğunluk sonrası forced quiet — “narrative cooldown”. */
  if (intensityEwma01 >= 0.78 && pr >= 0.72) {
    cooldownUntilMs = Math.max(cooldownUntilMs, nowMs + DEFAULT_COOLDOWN_AFTER_SPIKE_MS);
  }
  if (nowMs >= cooldownUntilMs) cooldownUntilMs = 0;

  const stamps = trimStamps(Array.isArray(p.recentArcPublishStamps) ? [...p.recentArcPublishStamps] : [], nowMs, i.windowMs);

  return {
    ...p,
    schema: NARRATIVE_PUBLISH_FATIGUE_SCHEMA_V0,
    intensityEwma01,
    cooldownUntilMs,
    recentArcPublishStamps: stamps
  };
}

/**
 * @param {Record<string, unknown>|null|undefined} state
 * @param {Record<string, unknown>|null|undefined} distributor
 * @param {number} nowMs
 * @param {{ lastEmitAtMs?: number, windowMs?: number, maxPerArc?: number, minSeparationMs?: number, baseMinPublishScore?: number }|null} opts
 * @returns {{ allow: boolean, reason: string, effectiveMinPublishScore: number, minIntervalMs: number }}
 */
export function evaluateNarrativePublishFatigueGateV0(state, distributor, nowMs, opts) {
  const o = opts && typeof opts === "object" ? opts : {};
  const s = state && typeof state === "object" ? state : createInitialNarrativePublishFatigueStateV0();
  const windowMs = Number(o.windowMs) || DEFAULT_WINDOW_MS;
  const maxPerArc = Math.max(1, Math.floor(Number(o.maxPerArc) || DEFAULT_MAX_PER_ARC));
  const minSep = Math.max(30_000, Number(o.minSeparationMs) || DEFAULT_MIN_SEPARATION_MS);
  const lastEmit = Math.max(Number(s.lastPublishEmitAtMs) || 0, Number(o.lastEmitAtMs) || 0);
  const baseScore = Number.isFinite(Number(o.baseMinPublishScore)) ? Number(o.baseMinPublishScore) : 0.52;

  if (nowMs < Math.max(0, Number(s.cooldownUntilMs) || 0)) {
    return { allow: false, reason: "NARRATIVE_COOLDOWN", effectiveMinPublishScore: 0.99, minIntervalMs: minSep };
  }

  if (lastEmit > 0 && nowMs - lastEmit < minSep) {
    return { allow: false, reason: "MIN_EPISODE_SEPARATION", effectiveMinPublishScore: baseScore, minIntervalMs: minSep };
  }

  const d = distributor && typeof distributor === "object" ? distributor : null;
  const y = d?.youtubePipelineHint && typeof d.youtubePipelineHint === "object" ? d.youtubePipelineHint : null;
  const arcId = y && typeof y.narrativeArcId === "string" ? y.narrativeArcId : "unknown";
  const arcCount = countArcPublishesInWindow(s, arcId, nowMs, windowMs);
  if (arcCount >= maxPerArc) {
    return { allow: false, reason: "ARC_SATURATION_WINDOW", effectiveMinPublishScore: 0.99, minIntervalMs: minSep };
  }

  /** Tekrarlayan arc → skor eşiğini yükselt (novelty decay / bastırma). */
  const penalty = Math.min(0.22, arcCount * 0.055 + Math.max(0, arcCount - 1) * 0.035);
  const sat = clamp01(Number(s.intensityEwma01) || 0) * 0.06;
  const effectiveMinPublishScore = Math.min(0.94, baseScore + penalty + sat);

  return { allow: true, reason: "OK", effectiveMinPublishScore, minIntervalMs: Math.max(minSep, 90_000) };
}

/**
 * Başarılı bridge publish sonrası çağır.
 *
 * @param {Record<string, unknown>|null|undefined} state
 * @param {number} nowMs
 * @param {string|null|undefined} narrativeArcId
 */
export function recordNarrativePublishAcceptedV0(state, nowMs, narrativeArcId) {
  const s = state && typeof state === "object" ? state : createInitialNarrativePublishFatigueStateV0();
  const arcId = String(narrativeArcId || "unknown").slice(0, 160);
  const stamps = Array.isArray(s.recentArcPublishStamps) ? [...s.recentArcPublishStamps] : [];
  stamps.push({ arcId, ts: nowMs });
  return {
    ...s,
    schema: NARRATIVE_PUBLISH_FATIGUE_SCHEMA_V0,
    lastPublishEmitAtMs: nowMs,
    recentArcPublishStamps: trimStamps(stamps, nowMs, DEFAULT_WINDOW_MS)
  };
}
