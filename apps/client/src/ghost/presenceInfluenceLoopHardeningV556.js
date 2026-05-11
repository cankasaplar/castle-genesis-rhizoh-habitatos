/**
 * vNext-556 — Presence influence loop hardening
 *
 * Ürün geri beslemesi (soyut): kullanıcı / üyelik → ghost ağırlığı + izleyici presence limitleri
 * + civic bellek görünürlük katmanları + YouTube canlı metriklerinin iç döngüye güvenli aktarımı.
 *
 * YouTube = çıkış yüzeyi; bu modül yalnızca encoder’dan veya manuel örnekten gelen *sayısal* engagement’ı
 * broadcast / runtime feedback ile birleştirir (API anahtarı veya chat içeriği burada yok).
 *
 * Paket çıktısından sonra (isteğe bağlı): önce `feedbackStabilizationGovernorV557` (güvenlik zarfı),
 * durgunlukta `adaptiveStabilityRelaxationV558` ile kontrollü gevşeme + güvenli volatilite.
 */

import { emitRhizohBehaviorSignal } from "../rhizoh/telemetry/rhizohBehaviorSignalsV1.js";

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

/**
 * İzleyici yoğunluğu tepkisini üyelik ağırlığı + observe/influence moduna göre inceltir.
 * @param {import("../broadcast/broadcastProtocolV555.js").CastleGenesisStreamPacket["ghostReactionToAudience"]} reaction
 * @param {ReturnType<import("../membership/membershipCoreV1.js").buildRhizohAccessLayer> | null | undefined} rhizohAccess
 */
export function refineGhostReactionForAccess(reaction, rhizohAccess) {
  if (!reaction || !rhizohAccess) return reaction;
  const w = clamp01(typeof rhizohAccess.presenceInfluenceWeight === "number" ? rhizohAccess.presenceInfluenceWeight : 0.35);
  let c = clamp01(reaction.collectiveWakeFeedback01 * w);
  let m = clamp01(reaction.microWakeBoost01 * w);
  let r = clamp01(reaction.resistanceSoftening01 * clamp01(0.5 + 0.5 * w));
  if (rhizohAccess.liveStreamParticipation === "observe") {
    c = Math.min(c, 0.38);
    m = Math.min(m, 0.085);
  }
  return Object.freeze({
    collectiveWakeFeedback01: c,
    microWakeBoost01: m,
    resistanceSoftening01: r
  });
}

/**
 * @param {import("../broadcast/broadcastProtocolV555.js").CivicStratumWire[]} civicStrataVisible
 * @param {string[]} recommendedStratumTiers
 * @param {ReturnType<import("../membership/membershipCoreV1.js").buildRhizohAccessLayer> | null | undefined} rhizohAccess
 */
export function narrowCivicStrataForAccess(civicStrataVisible, recommendedStratumTiers, rhizohAccess) {
  if (!rhizohAccess || !Array.isArray(civicStrataVisible)) return civicStrataVisible;
  const depth = Math.max(0, Math.floor(rhizohAccess.civicMemoryStrataDepth ?? 2));
  const order = Array.isArray(recommendedStratumTiers) ? recommendedStratumTiers : [];
  const rank = new Map(order.map((t, i) => [t, i]));
  const sorted = [...civicStrataVisible].sort((a, b) => (rank.get(a.tier) ?? 999) - (rank.get(b.tier) ?? 999));
  return sorted.slice(0, depth).map((st) => ({
    ...st,
    visible: st.visible !== false
  }));
}

/**
 * Yayın paketine üyelik sıkılaştırması uygular (ghost tepkisi + görünür civic katman sayısı).
 * @param {import("../broadcast/broadcastProtocolV555.js").CastleGenesisStreamPacket | null} packet
 * @param {ReturnType<import("../membership/membershipCoreV1.js").buildRhizohAccessLayer> | null | undefined} rhizohAccess
 */
export function applyPresenceInfluenceHardeningToPacket(packet, rhizohAccess) {
  if (!packet || !rhizohAccess) return packet;
  const reaction = refineGhostReactionForAccess(packet.ghostReactionToAudience, rhizohAccess);
  const strata = narrowCivicStrataForAccess(
    packet.civicStrataVisible,
    packet.recommendedStratumTiers,
    rhizohAccess
  );
  return Object.freeze({
    ...packet,
    ghostReactionToAudience: reaction,
    civicStrataVisible: strata
  });
}

/**
 * Sliding window ile izleyici → presence enjeksiyonu (chat ipuçları) sınırlanır.
 * @param {() => ReturnType<import("../membership/membershipCoreV1.js").buildRhizohAccessLayer> | null | undefined} getAccess
 * @param {{ windowMs?: number, premiumMax?: number, freeMax?: number }} [opts]
 */
export function createPresenceInjectionGovernor(getAccess, opts = {}) {
  const windowMs = opts.windowMs ?? 60_000;
  const premiumMax = opts.premiumMax ?? 44;
  const freeMax = opts.freeMax ?? 9;
  let windowStart = Date.now();
  let spent = 0;

  function budget() {
    const a = getAccess?.() ?? null;
    const influence = a?.liveStreamParticipation === "influence";
    return influence ? premiumMax : freeMax;
  }

  function refillIfNeeded(now) {
    if (now - windowStart >= windowMs) {
      windowStart = now;
      spent = 0;
    }
  }

  return {
    /** @param {number} [cost] birim maliyet (örn. 1 chat turu) */
    tryConsume(cost = 1) {
      const now = Date.now();
      refillIfNeeded(now);
      const max = budget();
      const c = Math.max(0.001, cost);
      if (spent + c > max) return { ok: false, remaining: Math.max(0, max - spent), max };
      spent += c;
      return { ok: true, remaining: max - spent, max };
    },

    /**
     * @param {ReturnType<import("../broadcast/broadcastProtocolV555.js").chatMessageToPresenceHints>} hints
     * @returns {typeof hints & { gated?: boolean }}
     */
    scaleChatHints(hints) {
      const a = getAccess?.() ?? null;
      const w = clamp01(typeof a?.presenceInfluenceWeight === "number" ? a.presenceInfluenceWeight : 0.35);
      const pulseCost = 0.28 + clamp01(hints.pulseInteraction ?? 0) * 1.15 + clamp01(hints.biasWakeAffinity ?? 0) * 0.85;
      const gate = this.tryConsume(Math.min(2.8, pulseCost));
      if (!gate.ok) {
        return Object.freeze({
          ...hints,
          biasWakeAffinity: clamp01((hints.biasWakeAffinity ?? 0) * 0.12),
          pulseInteraction: clamp01((hints.pulseInteraction ?? 0) * 0.12),
          gated: true
        });
      }
      return Object.freeze({
        ...hints,
        biasWakeAffinity: clamp01((hints.biasWakeAffinity ?? 0) * w),
        pulseInteraction: clamp01((hints.pulseInteraction ?? 0) * w),
        gated: false
      });
    },

    reset() {
      windowStart = Date.now();
      spent = 0;
    }
  };
}

/**
 * @param {Record<string, unknown>} [raw]
 */
export function normalizeYoutubeEngagementSample(raw = {}) {
  return Object.freeze({
    source: "youtube_live",
    concurrentViewers: Math.max(0, Number(raw.concurrentViewers) || 0),
    messagesPerMinute: Math.max(0, Number(raw.messagesPerMinute) || 0),
    superChatDensity01: clamp01(Number(raw.superChatDensity01) || 0),
    reactionBurst01: clamp01(Number(raw.reactionBurst01) || 0),
    capturedAtMs: Number(raw.capturedAtMs) || Date.now()
  });
}

/**
 * Encoder / dashboard’dan gelen örnek → broadcast paketinde kullanılan normalize skalerler.
 * @param {ReturnType<typeof normalizeYoutubeEngagementSample>} sample
 * @param {{ referencePeakViewers?: number, referenceMessagesPerMin?: number }} [opts]
 */
export function youtubeEngagementToFeedbackScalars(sample, opts = {}) {
  const refViewers = Math.max(50, opts.referencePeakViewers ?? 50_000);
  const refMsg = Math.max(1, opts.referenceMessagesPerMin ?? 120);
  const viewerCount01 = clamp01(sample.concurrentViewers / refViewers);
  const chatBurst01 = clamp01(0.12 + 0.88 * Math.min(1, sample.messagesPerMinute / refMsg));
  const viewerReaction01 = clamp01(
    0.34 * chatBurst01 + 0.38 * sample.superChatDensity01 + 0.42 * sample.reactionBurst01
  );
  return Object.freeze({ viewerCount01, chatBurst01, viewerReaction01 });
}

/**
 * YouTube engagement özetini davranış sinyaline düşürür (içerik yok, yalnızca ölçek).
 * @param {ReturnType<typeof normalizeYoutubeEngagementSample>} sample
 * @param {ReturnType<import("../membership/membershipCoreV1.js").buildRhizohAccessLayer> | null | undefined} rhizohAccess
 */
export function emitYoutubeEngagementIngestedSignal(sample, rhizohAccess) {
  const sc = youtubeEngagementToFeedbackScalars(sample);
  emitRhizohBehaviorSignal("rhizoh.broadcast.youtube_engagement_ingest", {
    membershipPlan: rhizohAccess?.membershipPlan ?? "unknown",
    liveStreamParticipation: rhizohAccess?.liveStreamParticipation ?? "observe",
    viewerScope01: sc.viewerCount01,
    chatBurst01: sc.chatBurst01,
    reactionScope01: sc.viewerReaction01,
    capturedAtMs: sample.capturedAtMs
  });
}

/**
 * Tek çağrıda: YouTube örneği → skalerler + (isteğe bağlı) davranış sinyali; üyelik ile viewerReaction ölçeklenir.
 * @param {object} p
 * @param {Record<string, unknown>} p.sample
 * @param {ReturnType<import("../membership/membershipCoreV1.js").buildRhizohAccessLayer> | null | undefined} [p.rhizohAccess]
 * @param {boolean} [p.emitSignal]
 */
export function ingestYoutubeEngagementForProductLoop(p) {
  const sample = normalizeYoutubeEngagementSample(p.sample);
  const sc = youtubeEngagementToFeedbackScalars(sample);
  const w = clamp01(typeof p.rhizohAccess?.presenceInfluenceWeight === "number" ? p.rhizohAccess.presenceInfluenceWeight : 0.35);
  const out = Object.freeze({
    ...sc,
    viewerReaction01: clamp01(sc.viewerReaction01 * w),
    audienceDensity01: clamp01(sc.viewerCount01 * (0.55 + 0.45 * w))
  });
  if (p.emitSignal !== false) emitYoutubeEngagementIngestedSignal(sample, p.rhizohAccess);
  return out;
}
