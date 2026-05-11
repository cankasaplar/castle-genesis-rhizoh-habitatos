/**
 * vNext-557 — Feedback stability governor (stabilization + runaway / echo / metric-gaming freni)
 *
 * - Runaway: amplification + anlatı drift hızı + **presence drift** (556 ağırlık kayması)
 * - Engagement doygunluğu: YouTube / chat sinyalinin birikimli şişmesine tavan
 * - Ghost reaction: tepe baskınlığı + **entropy clamp** (tek kanala kilitlenmeyi yumuşatır)
 * - Çok kullanıcı: çelişkili presence sinyalleri → çatışma sönümlemeli ortalama
 *
 * Uygulama sırası önerisi: `membershipCoreV1` → 556 hardening → bu governor ölçekleri / reaction clamp.
 * Aşırı sönüm: `adaptiveStabilityRelaxationV558` ile etkin runaway gevşetme + güvenli volatilite.
 * Burst ritmi: `perceptualRhythmGovernorV559` (cooldown, sıkılma eğrisi, kolektif yorgunluk).
 */

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

/**
 * Son feed itki örneklerinden amplification riski (ortalama + oynaklık).
 * @param {Array<{ traffic?: number, events?: number, weather?: number }>} samples
 */
export function computeFeedbackAmplificationScore(samples) {
  if (!samples?.length) return 0;
  const mags = samples.map((f) => Math.abs(f.traffic ?? 0) + Math.abs(f.events ?? 0) + Math.abs(f.weather ?? 0));
  const mean = mags.reduce((a, b) => a + b, 0) / mags.length;
  let v = 0;
  if (mags.length > 1) {
    for (const x of mags) v += (x - mean) ** 2;
    v /= mags.length - 1;
  }
  return clamp01(mean * 2.15 + Math.sqrt(v) * 1.55);
}

/**
 * @typedef {object} DriftGovernance
 * @property {number} runawayRisk01 birleşik risk
 * @property {number} amplification01
 * @property {number} driftVelocity01
 * @property {number} feedsGainScale 556 merge çarpanı
 * @property {number} genomePatchScale genome yama çarpanı
 * @property {number} civicInjectionScale chat / sentetik episode şiddeti
 * @property {number} wakeThresholdBonus intent eşiğine ek (daha az major wake)
 * @property {number} resistanceFloorBoost hayalet direnç tabanı
 * @property {number} narrationClamp01 anlatım / civic salience üst sınır çarpanı
 * @property {number} presenceDriftVelocity01
 * @property {number} engagementHeadroom01 engagement limiter ile birlikte [0–1]
 */

/**
 * @param {object} [opts]
 * @param {number} [opts.windowSize]
 */
export function createFeedbackDriftGovernor(opts = {}) {
  const windowSize = opts.windowSize ?? 28;
  /** @type {number[]} */
  let feedMagnitudes = [];
  /** @type {number[]} */
  let driftSamples = [];
  /** @type {number[]} — 556 presence ağırlığı / enjeksiyon birikiminin pencere içi örnekleri */
  let presenceDriftSamples = [];
  let amplStress = 0;

  return {
    /**
     * @param {{ traffic?: number, events?: number, weather?: number }} feedDelta 556’dan tek tick itki
     */
    recordFeedDelta(feedDelta) {
      const m = Math.abs(feedDelta.traffic ?? 0) + Math.abs(feedDelta.events ?? 0) + Math.abs(feedDelta.weather ?? 0);
      feedMagnitudes.push(m);
      while (feedMagnitudes.length > windowSize) feedMagnitudes.shift();
    },

    /** @param {number} driftMagnitude01 örn. measureNarrativeDrift().driftMagnitude01 */
    recordNarrativeDrift(driftMagnitude01) {
      driftSamples.push(clamp01(driftMagnitude01));
      while (driftSamples.length > windowSize) driftSamples.shift();
    },

    /**
     * Presence / üyelik ağırlığı veya governor dışı ölçülen etki kayması (556 ile uyumlu).
     * @param {number} driftMagnitude01 [0–1]
     */
    recordPresenceDrift(driftMagnitude01) {
      presenceDriftSamples.push(clamp01(driftMagnitude01));
      while (presenceDriftSamples.length > windowSize) presenceDriftSamples.shift();
    },

    amplificationRisk01() {
      if (!feedMagnitudes.length) return amplStress;
      const mean = feedMagnitudes.reduce((a, b) => a + b, 0) / feedMagnitudes.length;
      let v = 0;
      if (feedMagnitudes.length > 1) {
        for (const x of feedMagnitudes) v += (x - mean) ** 2;
        v /= feedMagnitudes.length - 1;
      }
      return clamp01(mean * 2.25 + Math.sqrt(v) * 1.6 + amplStress);
    },

    driftVelocity01() {
      if (driftSamples.length < 2) return 0;
      let s = 0;
      for (let i = 1; i < driftSamples.length; i++) s += Math.abs(driftSamples[i] - driftSamples[i - 1]);
      return clamp01((s / (driftSamples.length - 1)) * 1.75);
    },

    presenceDriftVelocity01() {
      if (presenceDriftSamples.length < 2) return 0;
      let s = 0;
      for (let i = 1; i < presenceDriftSamples.length; i++) {
        s += Math.abs(presenceDriftSamples[i] - presenceDriftSamples[i - 1]);
      }
      return clamp01((s / (presenceDriftSamples.length - 1)) * 1.65);
    },

    /**
     * @param {number} ghostResistance01
     * @returns {DriftGovernance}
     */
    getGovernance(ghostResistance01) {
      const amp = this.amplificationRisk01();
      const vel = this.driftVelocity01();
      const presVel = this.presenceDriftVelocity01();
      const r = clamp01(ghostResistance01);
      const runaway = clamp01(amp * 0.4 + vel * 0.42 + presVel * 0.34);

      const feedsGainScale = clamp01(1 - runaway * (0.78 - r * 0.32));
      const genomePatchScale = clamp01(1 - runaway * (0.72 - r * 0.26));
      const civicInjectionScale = clamp01(1 - amp * 0.42);
      const wakeThresholdBonus = runaway * (0.048 + (1 - r) * 0.042);
      const resistanceFloorBoost = runaway * (0.055 + amp * 0.025);
      const narrationClamp01 = clamp01(1 - vel * 0.22 - amp * 0.12 - presVel * 0.14);
      const engagementHeadroom01 = clamp01(1 - runaway * 0.55 - presVel * 0.22);

      return Object.freeze({
        runawayRisk01: runaway,
        amplification01: amp,
        driftVelocity01: vel,
        presenceDriftVelocity01: presVel,
        feedsGainScale,
        genomePatchScale,
        civicInjectionScale,
        wakeThresholdBonus,
        resistanceFloorBoost,
        narrationClamp01,
        engagementHeadroom01
      });
    },

    /** Ardışık büyük enjeksiyonlarda yumuşak birikim */
    accrueAmplificationStress(amount01) {
      amplStress = clamp01(amplStress + clamp01(amount01) * 0.085);
    },

    /** @param {number} [dtSec] */
    tickDecay(dtSec = 0.016) {
      const dt = Math.max(0, Math.min(0.1, dtSec));
      amplStress = clamp01(amplStress * Math.exp(-dt * 0.38));
    },

    reset() {
      feedMagnitudes = [];
      driftSamples = [];
      presenceDriftSamples = [];
      amplStress = 0;
    }
  };
}

/**
 * Üç kanallı ghost tepkisinde normalize Shannon entropi [0–1] (≈1 düzenli, ≈0 tek kanal).
 * @param {import("../broadcast/broadcastProtocolV555.js").CastleGenesisStreamPacket["ghostReactionToAudience"] | null} reaction
 */
export function ghostReactionNormalizedEntropy01(reaction) {
  if (!reaction) return 1;
  const c = clamp01(reaction.collectiveWakeFeedback01 ?? 0);
  const m = clamp01(reaction.microWakeBoost01 ?? 0);
  const r = clamp01(reaction.resistanceSoftening01 ?? 0);
  const sum = c + m + r + 1e-9;
  const p0 = c / sum;
  const p1 = m / sum;
  const p2 = r / sum;
  const sh = -(
    p0 * Math.log2(p0 + 1e-12) +
    p1 * Math.log2(p1 + 1e-12) +
    p2 * Math.log2(p2 + 1e-12)
  );
  return clamp01(sh / Math.log2(3));
}

/**
 * Düşük entropi (echo / tek metrik kilitlenmesi) → üniteye doğru sınırlı karıştırma.
 * @param {import("../broadcast/broadcastProtocolV555.js").CastleGenesisStreamPacket["ghostReactionToAudience"]} reaction
 * @param {{ minNormalizedEntropy01?: number, uniformBlend01?: number }} [opts]
 */
export function clampGhostReactionEntropy(reaction, opts = {}) {
  const minH = opts.minNormalizedEntropy01 ?? 0.44;
  const h = ghostReactionNormalizedEntropy01(reaction);
  if (h >= minH) {
    return Object.freeze({
      collectiveWakeFeedback01: clamp01(reaction.collectiveWakeFeedback01 ?? 0),
      microWakeBoost01: clamp01(reaction.microWakeBoost01 ?? 0),
      resistanceSoftening01: clamp01(reaction.resistanceSoftening01 ?? 0)
    });
  }
  const c = clamp01(reaction.collectiveWakeFeedback01 ?? 0);
  const m = clamp01(reaction.microWakeBoost01 ?? 0);
  const r = clamp01(reaction.resistanceSoftening01 ?? 0);
  const sum = c + m + r;
  const u = sum / 3;
  const blend = clamp01(opts.uniformBlend01 ?? 0.28 + (minH - h) * 0.95);
  return Object.freeze({
    collectiveWakeFeedback01: clamp01(c * (1 - blend) + u * blend),
    microWakeBoost01: clamp01(m * (1 - blend) + u * blend),
    resistanceSoftening01: clamp01(r * (1 - blend) + u * blend)
  });
}

/**
 * Tek kanal baskınlığını tavanlar (metrik oyunu / spike freni).
 * @param {import("../broadcast/broadcastProtocolV555.js").CastleGenesisStreamPacket["ghostReactionToAudience"]} reaction
 * @param {number} [peakMax]
 */
export function clampGhostReactionPeak(reaction, peakMax = 0.86) {
  const cap = clamp01(peakMax);
  const c = clamp01(reaction.collectiveWakeFeedback01 ?? 0);
  const m = clamp01(reaction.microWakeBoost01 ?? 0);
  const r = clamp01(reaction.resistanceSoftening01 ?? 0);
  const mx = Math.max(c, m, r, 1e-9);
  if (mx <= cap) {
    return Object.freeze({ collectiveWakeFeedback01: c, microWakeBoost01: m, resistanceSoftening01: r });
  }
  const s = cap / mx;
  return Object.freeze({
    collectiveWakeFeedback01: clamp01(c * s),
    microWakeBoost01: clamp01(m * s),
    resistanceSoftening01: clamp01(r * s)
  });
}

/**
 * Governor stresine göre sırayla peak → entropy (runaway’de daha sıkı).
 * @param {import("../broadcast/broadcastProtocolV555.js").CastleGenesisStreamPacket["ghostReactionToAudience"]} reaction
 * @param {Pick<DriftGovernance, "runawayRisk01">} g
 */
export function applyGhostReactionStabilityStack(reaction, g) {
  const rw = clamp01(g.runawayRisk01 ?? 0);
  const peak = clamp01(0.88 - rw * 0.14);
  const minEnt = clamp01(0.4 + rw * 0.12);
  let x = clampGhostReactionPeak(reaction, peak);
  x = clampGhostReactionEntropy(x, { minNormalizedEntropy01: minEnt, uniformBlend01: 0.22 + rw * 0.2 });
  return x;
}

/**
 * Dış engagement (YouTube / chatBurst / viewerReaction) birikimini sınırlar; doygunlukta girişi düşürür.
 * @param {{ saturationCap01?: number, leakPerSec?: number }} [opts]
 */
export function createEngagementSaturationLimiter(opts = {}) {
  const cap = clamp01(opts.saturationCap01 ?? 0.94);
  const leak = opts.leakPerSec ?? 0.42;
  let level01 = 0;

  return {
    /**
     * @param {number} engagement01 yeni ham sinyal [0–1]
     * @param {number} dtSec
     * @param {Pick<DriftGovernance, "engagementHeadroom01"> | null} [governance]
     */
    scaleIncoming(engagement01, dtSec = 0.016, governance = null) {
      const dt = Math.max(0, Math.min(0.12, dtSec));
      level01 = clamp01(level01 * Math.exp(-dt * leak));
      const e = clamp01(engagement01);
      const headroom = governance ? clamp01(governance.engagementHeadroom01 ?? 1) : 1;
      const room = clamp01(1 - level01 / Math.max(0.08, cap)) * headroom;
      const scaled = clamp01(e * (0.28 + 0.72 * room));
      level01 = clamp01(level01 + scaled * 0.22);
      return Object.freeze({ scaled01: scaled, saturationLevel01: level01, headroom01: room });
    },

    tick(dtSec = 0.016) {
      const dt = Math.max(0, Math.min(0.12, dtSec));
      level01 = clamp01(level01 * Math.exp(-dt * leak));
    },

    snapshot() {
      return Object.freeze({ saturationLevel01: level01 });
    },

    reset() {
      level01 = 0;
    }
  };
}

/**
 * Çok izleyici / çok ajan: çelişkili vektörleri ağırlıklı ortalama + çatışma sönümü.
 * @param {Array<{ pulse01?: number, wakeBias01?: number, weight01?: number }>} signals
 * @param {{ conflictPenalty?: number }} [opts]
 */
export function resolveMultiUserPresenceSignals(signals, opts = {}) {
  const penalty = clamp01(opts.conflictPenalty ?? 0.62);
  if (!signals?.length) {
    return Object.freeze({ pulse01: 0, wakeBias01: 0, conflict01: 0, weightSum: 0, damped: 1 });
  }
  let wsum = 0;
  let pAcc = 0;
  let wAcc = 0;
  for (const s of signals) {
    const w = clamp01(s.weight01 ?? 1);
    wsum += w;
    pAcc += clamp01(s.pulse01 ?? 0) * w;
    wAcc += clamp01(s.wakeBias01 ?? 0) * w;
  }
  const inv = wsum > 1e-9 ? 1 / wsum : 0;
  const meanP = clamp01(pAcc * inv);
  const meanW = clamp01(wAcc * inv);
  let conflict = 0;
  for (const s of signals) {
    const w = clamp01(s.weight01 ?? 1);
    conflict +=
      w * (Math.abs(clamp01(s.pulse01 ?? 0) - meanP) + Math.abs(clamp01(s.wakeBias01 ?? 0) - meanW));
  }
  conflict = clamp01((conflict / (2 * Math.max(wsum, 1e-9))) * 1.15);
  const damp = clamp01(1 - conflict * penalty);
  return Object.freeze({
    pulse01: clamp01(meanP * damp),
    wakeBias01: clamp01(meanW * damp),
    conflict01: conflict,
    weightSum: wsum,
    damped: damp
  });
}

/**
 * Governor çıktısıyla feed birleşimini ölçekler (base → merged farkı kısılır).
 * @param {object} baseFeeds
 * @param {object} mergedFeeds loop.mergeIntoFeeds sonucu
 * @param {DriftGovernance} g
 */
export function applyGovernanceToFeedsMerge(baseFeeds, mergedFeeds, g) {
  const s = g.feedsGainScale;
  const bt = baseFeeds.traffic ?? 0.45;
  const be = baseFeeds.events ?? 0.4;
  const bw = baseFeeds.weather ?? 0.5;
  const mt = mergedFeeds.traffic ?? bt;
  const me = mergedFeeds.events ?? be;
  const mw = mergedFeeds.weather ?? bw;
  return Object.freeze({
    ...mergedFeeds,
    traffic: clamp01(bt + (mt - bt) * s),
    events: clamp01(be + (me - be) * s),
    weather: clamp01(bw + (mw - bw) * s)
  });
}

/**
 * Genome yamasını governor ile interpolasyonlar (runaway’de orijinale yaklaş).
 * @param {import("./ghostGenome.js").GhostGenome} base
 * @param {import("./ghostGenome.js").GhostGenome} patched
 * @param {DriftGovernance} g
 */
export function applyGovernanceToGenomePatch(base, patched, g) {
  const s = g.genomePatchScale;
  return Object.freeze({
    ...base,
    playfulness: clamp01(base.playfulness + (patched.playfulness - base.playfulness) * s),
    curiosity: clamp01(base.curiosity + (patched.curiosity - base.curiosity) * s),
    calm: clamp01(base.calm + (patched.calm - base.calm) * s),
    sovereignBond: clamp01(base.sovereignBond + (patched.sovereignBond - base.sovereignBond) * s)
  });
}

/**
 * Chat kaynaklı episode yoğunluğunu kıs.
 * @param {number} intensity01 injectSyntheticEpisodeFromChat öncesi
 * @param {DriftGovernance} g
 */
export function applyGovernanceToCivicInjection(intensity01, g) {
  return clamp01(intensity01 * g.civicInjectionScale);
}

/**
 * Efektif ghost direnci tabanı (computeGhostResistance01 sonrası eklenebilir).
 * @param {number} resistance01
 * @param {DriftGovernance} g
 */
export function applyResistanceFloor(resistance01, g) {
  return clamp01(resistance01 + g.resistanceFloorBoost);
}

/**
 * Intent eşiği: base + arbitraj + governor.
 * @param {number} baseThreshold
 * @param {number} arbitrationDelta 551
 * @param {DriftGovernance} g
 */
export function effectiveWakeThresholdGoverned(baseThreshold, arbitrationDelta, g) {
  return clamp01(Math.min(0.94, baseThreshold + arbitrationDelta + g.wakeThresholdBonus));
}
