/**
 * vNext-558 — Adaptive stability relaxation layer
 *
 * v557 güvenlik zarfının karşı ağırlığı: aşırı sönümleme (ölü sistem hissi) riskine karşı
 * düşük aktivitede kontrollü gevşeme, yaratıcı burst penceresi, sınırlı volatilite enjeksiyonu.
 *
 * YouTube / dış engagement: yalnızca clamp’lenmiş girdi; bu katman “sıkıldım” rejiminde
 * algı alanını yeniden canlandırır — runaway yüksekken gevşeme kapanır.
 *
 * Ritim / burst salınımı: `perceptualRhythmGovernorV559` (cooldown, sıkılma eğrisi, kolektif yorgunluk).
 */

import { applyGhostReactionStabilityStack } from "./feedbackStabilizationGovernorV557.js";

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

/**
 * Deterministik [0–1) gürültü (tur / test tekrarı için).
 * @param {number} seedMs
 */
export function deterministicVolatilityNoise01(seedMs) {
  const s = Math.floor(Number(seedMs) || 0);
  const x = Math.sin(s * 12.9898 + 78.233) * 43758.5453123;
  return x - Math.floor(x);
}

/**
 * Tek skaler gevşeme [0–1]: düşük aktivite + yüksek durgunluk + düşük runaway → gevşe.
 * @param {object} p
 * @param {number} [p.activity01] son pencere engagement / broadcast enerjisi
 * @param {number} [p.stagnation01] değişim yokluğu / sıkılma vekili [0–1]
 * @param {number} [p.runawayRisk01] v557
 * @param {number} [p.lowActivityThreshold] aktivite bunun altındaysa sıkılma ağırlanır
 */
export function computeStabilityRelaxation01(p) {
  const activity = clamp01(p.activity01 ?? 0.5);
  const stagnation = clamp01(p.stagnation01 ?? 0);
  const runaway = clamp01(p.runawayRisk01 ?? 0);
  const lowTh = clamp01(p.lowActivityThreshold ?? 0.32);

  const quiet = clamp01((lowTh - activity) / Math.max(lowTh, 0.08));
  const safe = clamp01(1 - runaway * 1.15);
  const boredom = clamp01(stagnation * 0.55 + quiet * 0.45);
  let r = clamp01(boredom * safe * (0.35 + 0.65 * (1 - runaway)));
  return Object.freeze({
    relaxation01: r,
    boredom01: boredom,
    quiet01: quiet,
    safeToRelax01: safe
  });
}

/**
 * Gevşeme sonrası v557 stability stack’e giden etkin runaway (düşürülür → daha az agresif clamp).
 */
export function effectiveRunawayAfterRelaxation(runawayRisk01, relaxation01) {
  const rw = clamp01(runawayRisk01);
  const rel = clamp01(relaxation01);
  return clamp01(rw * (1 - rel * 0.58));
}

/**
 * Peak tavanını gevşetir (yüksek relaxation → biraz daha yüksek tepeye izin).
 */
export function relaxedPeakCap(basePeakCap, relaxation01) {
  const b = clamp01(basePeakCap ?? 0.86);
  const rel = clamp01(relaxation01);
  return clamp01(b + rel * 0.1);
}

/**
 * Entropi eşiğini gevşetir (düşük min → uniform blend daha az → daha “canlı” dağılım).
 */
export function relaxedMinEntropy01(baseMinEntropy, relaxation01) {
  const b = clamp01(baseMinEntropy ?? 0.44);
  const rel = clamp01(relaxation01);
  return clamp01(Math.max(0.28, b - rel * 0.14));
}

/**
 * Engagement limiter headroom çarpanı (gevşek dönemde biraz daha nefes).
 */
export function relaxedEngagementHeadroom(governanceHeadroom01, relaxation01) {
  const h = clamp01(governanceHeadroom01 ?? 1);
  const rel = clamp01(relaxation01);
  return clamp01(h * (1 + rel * 0.22));
}

/**
 * feedsGain / genomePatch için etkin ölçek (gevşek dönemde v557 kısması hafif açılır).
 */
export function relaxedGovernanceFeedScale(feedsGainScale, relaxation01) {
  const s = clamp01(feedsGainScale ?? 1);
  const rel = clamp01(relaxation01);
  return clamp01(s + rel * (1 - s) * 0.35);
}

/**
 * Yaratıcı burst: sıkılma + güvenli runaway altında kısa süre ek gevşeme.
 * @param {{ burstWindowMs?: number, boredomTrigger01?: number, maxRunawayForBurst?: number }} [opts]
 */
export function createCreativeBurstScheduler(opts = {}) {
  const burstMs = opts.burstWindowMs ?? 9_000;
  const boredomTrig = clamp01(opts.boredomTrigger01 ?? 0.68);
  const maxRw = clamp01(opts.maxRunawayForBurst ?? 0.32);
  let burstUntil = 0;
  let lastBoredom = 0;

  return {
    /**
     * @param {object} p
     * @param {number} p.nowMs
     * @param {number} p.boredom01 computeStabilityRelaxation01.boredom01 veya stagnation
     * @param {number} p.runawayRisk01
     */
    tick(p) {
      const now = Number(p.nowMs) || Date.now();
      const bore = clamp01(p.boredom01 ?? 0);
      const rw = clamp01(p.runawayRisk01 ?? 0);
      lastBoredom = bore;
      if (bore >= boredomTrig && rw <= maxRw && now >= burstUntil) {
        burstUntil = now + burstMs;
      }
      return Object.freeze({ inBurst: now < burstUntil, burstUntilMs: burstUntil });
    },

    burstRelaxationBonus01(nowMs) {
      const now = Number(nowMs) || Date.now();
      if (now >= burstUntil) return 0;
      const t = clamp01((burstUntil - now) / Math.max(1, burstMs));
      return clamp01(0.12 + t * 0.2);
    },

    reset() {
      burstUntil = 0;
      lastBoredom = 0;
    },

    snapshot() {
      return Object.freeze({ burstUntilMs: burstUntil, lastBoredom01: lastBoredom });
    }
  };
}

/**
 * Ghost reaction’a küçük, güvenli volatilite (metric gaming değil — bounded dither).
 * @param {import("../broadcast/broadcastProtocolV555.js").CastleGenesisStreamPacket["ghostReactionToAudience"]} reaction
 * @param {number} budget01 [0–1] toplam kaçak bütçe
 * @param {number} seedMs
 */
export function injectSafeVolatilityIntoReaction(reaction, budget01, seedMs = Date.now()) {
  const b = clamp01(budget01 ?? 0) * 0.055;
  if (b < 1e-6) {
    return Object.freeze({
      collectiveWakeFeedback01: clamp01(reaction.collectiveWakeFeedback01 ?? 0),
      microWakeBoost01: clamp01(reaction.microWakeBoost01 ?? 0),
      resistanceSoftening01: clamp01(reaction.resistanceSoftening01 ?? 0)
    });
  }
  const n0 = deterministicVolatilityNoise01(seedMs) - 0.5;
  const n1 = deterministicVolatilityNoise01(seedMs + 1) - 0.5;
  const n2 = deterministicVolatilityNoise01(seedMs + 2) - 0.5;
  const c = clamp01((reaction.collectiveWakeFeedback01 ?? 0) + n0 * b);
  const m = clamp01((reaction.microWakeBoost01 ?? 0) + n1 * b);
  const r = clamp01((reaction.resistanceSoftening01 ?? 0) + n2 * b);
  return Object.freeze({
    collectiveWakeFeedback01: c,
    microWakeBoost01: m,
    resistanceSoftening01: r
  });
}

/**
 * Tek çağrıda: gevşeme + burst bonus + etkin runaway (557 stability stack girdisi için).
 */
export function buildRelaxationBundle(input) {
  const now = Number(input.nowMs) || Date.now();
  const base = computeStabilityRelaxation01({
    activity01: input.activity01,
    stagnation01: input.stagnation01,
    runawayRisk01: input.runawayRisk01,
    lowActivityThreshold: input.lowActivityThreshold
  });
  const scheduler = input.burstScheduler ?? null;
  let burstBonus = 0;
  if (scheduler?.burstRelaxationBonus01) {
    burstBonus = scheduler.burstRelaxationBonus01(now);
  }
  const relaxation01 = clamp01(base.relaxation01 + burstBonus);
  const effectiveRunaway = effectiveRunawayAfterRelaxation(input.runawayRisk01 ?? 0, relaxation01);
  const rwRaw = clamp01(input.runawayRisk01 ?? 0);
  const volatilityBudget01 = clamp01(relaxation01 * 0.42 * (1 - rwRaw * 0.85));

  return Object.freeze({
    ...base,
    relaxation01,
    burstBonus01: burstBonus,
    effectiveRunawayForStability01: effectiveRunaway,
    relaxedPeakCap01: relaxedPeakCap(input.basePeakCap ?? 0.86, relaxation01),
    relaxedMinEntropy01: relaxedMinEntropy01(input.baseMinEntropy ?? 0.44, relaxation01),
    volatilityBudget01
  });
}

/**
 * v557 stability stack + gevşetilmiş etkin runaway + isteğe bağlı güvenli dither.
 * @param {import("../broadcast/broadcastProtocolV555.js").CastleGenesisStreamPacket["ghostReactionToAudience"]} reaction
 * @param {ReturnType<typeof buildRelaxationBundle>} bundle
 * @param {number} [seedMs]
 */
export function applyV558RelaxedStabilityStack(reaction, bundle, seedMs) {
  const rw = bundle.effectiveRunawayForStability01 ?? 0;
  let out = applyGhostReactionStabilityStack(reaction, { runawayRisk01: rw });
  const vol = clamp01(bundle.volatilityBudget01 ?? 0);
  if (vol > 0.02) {
    out = injectSafeVolatilityIntoReaction(out, vol, seedMs ?? Date.now());
  }
  return out;
}
