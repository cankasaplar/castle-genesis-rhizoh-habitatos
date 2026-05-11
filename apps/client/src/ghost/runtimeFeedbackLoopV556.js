/**
 * vNext-556 — Runtime feedback loop closure
 *
 * Broadcast → sistem geri beslemesi; izleyici → alan nüansı; chat → civic / episode mutasyonu;
 * seyirci yoğunluğu → ghost uyum öğrenmesi (genome üzerinde yumuşak yama).
 *
 * Üyelik / presence sıkılaştırması: `presenceInfluenceLoopHardeningV556` + `ingestBroadcastPacket(..., rhizohAccess)`.
 */

import { chatMessageToPresenceHints } from "../broadcast/broadcastProtocolV555.js";
import { applyPresenceInfluenceHardeningToPacket } from "./presenceInfluenceLoopHardeningV556.js";

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

/**
 * Yayın paketinden bridge `feeds.*` için küçük itki (stub field güncellemesi).
 * @param {import("../broadcast/broadcastProtocolV555.js").CastleGenesisStreamPacket | null} packet
 */
export function computeFeedsFeedbackFromBroadcast(packet) {
  if (!packet) {
    return { traffic: 0, events: 0, weather: 0 };
  }
  const wr = packet.ghostReactionToAudience;
  const bump = clamp01((wr?.collectiveWakeFeedback01 ?? 0) * 0.11 + (packet.chatBurst01 ?? 0) * 0.09);
  const density = clamp01(packet.audienceDensity01 ?? 0);
  return {
    traffic: bump * 0.65,
    events: bump * 0.55,
    weather: -density * 0.025
  };
}

/**
 * İzleyici tepkisi (emoji yoğunluğu, süper chat oranı vb.) → ek feed itişi.
 * @param {number} reaction01
 */
export function computeViewerReactionFieldNudge(reaction01) {
  const r = clamp01(reaction01);
  return {
    traffic: r * 0.06,
    events: r * 0.08,
    weather: r * 0.02
  };
}

/**
 * @param {object} [opts]
 * @param {number} [opts.maxEntries]
 */
export function createCivicChatMutationLedger(opts = {}) {
  const maxEntries = opts.maxEntries ?? 72;
  /** @type {{ t: number, summary: string, tags: string[], salience01: number }[]} */
  const buf = [];

  return {
    /**
     * @param {{ t?: number, summary: string, tags: string[], salience01: number }} e
     */
    push(e) {
      buf.push({
        t: e.t ?? Date.now(),
        summary: e.summary,
        tags: e.tags,
        salience01: clamp01(e.salience01)
      });
      while (buf.length > maxEntries) buf.shift();
    },

    /** @param {number} [n] */
    recent(n = 24) {
      return Object.freeze(buf.slice(-n));
    },

    clear() {
      buf.length = 0;
    }
  };
}

/**
 * Chat satırını sivil mutasyon defterine işler (553/554 ile birleştirilebilir).
 * @param {ReturnType<typeof createCivicChatMutationLedger>} ledger
 * @param {string} text
 * @param {number} [nowMs]
 */
export function recordChatCivicMutation(ledger, text, nowMs = Date.now()) {
  const hints = chatMessageToPresenceHints(text, 0.65);
  /** @type {string[]} */
  const tags = [];
  if (hints.requestOracle) tags.push("chat_oracle");
  if (hints.districtGuess) tags.push(`chat_${hints.districtGuess}`);
  if (hints.pulseInteraction > 0.08) tags.push("chat_pulse");
  if (hints.biasWakeAffinity > 0.1) tags.push("chat_wake_bias");
  const salience01 = clamp01(0.18 + hints.biasWakeAffinity + hints.pulseInteraction);
  ledger.push({
    t: nowMs,
    summary: String(text).slice(0, 160),
    tags,
    salience01
  });
}

/**
 * Chat → episode hafızasına hafif sentetik olay (civic bellek ile uyumlu).
 * @param {ReturnType<import("./ghostEpisodeMemoryV547.js").createGhostEpisodeMemory> | null} episodeMemory
 * @param {string} text
 * @param {string} [frameFingerprint]
 * @param {number} [nowMs]
 */
export function injectSyntheticEpisodeFromChat(episodeMemory, text, frameFingerprint, nowMs = Date.now()) {
  if (!episodeMemory?.push) return;
  const hints = chatMessageToPresenceHints(text, 0.75);
  const intensity01 = clamp01(0.14 + hints.biasWakeAffinity + hints.pulseInteraction);
  if (intensity01 < 0.17 && !hints.requestOracle) return;
  episodeMemory.push({
    t: nowMs,
    kind: hints.requestOracle ? /** @type {const} */ ("oracle_shift") : /** @type {const} */ ("branch_surge"),
    intensity01,
    habitatFingerprint: frameFingerprint ?? "0xchat-feedback",
    narrationTone: hints.requestOracle ? /** @type {const} */ ("oracle") : /** @type {const} */ ("calm"),
    emphasizedDistrictId: hints.districtGuess
  });
}

/**
 * Seyirci yoğunluğuna göre ghost fenotipine yumuşak uyum (öğrenme = EMA takibi).
 */
export function createGhostAudienceAdaptationOverlay() {
  let playAdj = 0;
  let curAdj = 0;
  let calmAdj = 0;
  let bondDrift = 0;

  return {
    /**
     * @param {import("../broadcast/broadcastProtocolV555.js").CastleGenesisStreamPacket | null} packet
     * @param {number} dtSec
     */
    step(packet, dtSec) {
      const dt = Math.max(0, Math.min(0.08, dtSec));
      if (!packet) return;
      const wr = packet.ghostReactionToAudience;
      const engage = clamp01(
        (wr?.collectiveWakeFeedback01 ?? 0) * 0.48 + (packet.audienceDensity01 ?? 0) * 0.32 + (packet.chatBurst01 ?? 0) * 0.38
      );
      const targetPlay = engage * 0.085;
      const targetCur = engage * 0.065;
      const targetCalm = -engage * 0.045;
      const lambda = 2.4;
      playAdj += (targetPlay - playAdj) * lambda * dt;
      curAdj += (targetCur - curAdj) * lambda * dt;
      calmAdj += (targetCalm - calmAdj) * 2.1 * dt;
      const bondTarget = (engage - 0.5) * 0.08;
      bondDrift += (bondTarget - bondDrift) * 1.8 * dt;
    },

    /**
     * @param {import("./ghostGenome.js").GhostGenome} genome
     */
    applyToGenome(genome) {
      return Object.freeze({
        ...genome,
        playfulness: clamp01(genome.playfulness + playAdj),
        curiosity: clamp01(genome.curiosity + curAdj),
        calm: clamp01(genome.calm + calmAdj),
        sovereignBond: clamp01(genome.sovereignBond + bondDrift)
      });
    },

    snapshot() {
      return Object.freeze({ playAdj, curAdj, calmAdj, bondDrift });
    },

    reset() {
      playAdj = 0;
      curAdj = 0;
      calmAdj = 0;
      bondDrift = 0;
    }
  };
}

/**
 * @param {object} [opts]
 * @param {number} [opts.feedsDecayPerTick] birikimli itki sönümü (0–1)
 */
export function createRuntimeFeedbackLoop(opts = {}) {
  const feedsDecay = opts.feedsDecayPerTick ?? 0.965;
  const adaptation = createGhostAudienceAdaptationOverlay();
  const civicLedger = createCivicChatMutationLedger(opts.civicLedger);

  let feedsAccum = { traffic: 0, events: 0, weather: 0 };
  /** @type {import("../broadcast/broadcastProtocolV555.js").CastleGenesisStreamPacket | null} */
  let lastPacket = null;

  return {
    /**
     * @param {import("../broadcast/broadcastProtocolV555.js").CastleGenesisStreamPacket | null} packet
     * @param {number} dtSec
     * @param {ReturnType<import("../membership/membershipCoreV1.js").buildRhizohAccessLayer> | null} [rhizohAccess]
     */
    ingestBroadcastPacket(packet, dtSec = 0.016, rhizohAccess = null) {
      const p = packet && rhizohAccess ? applyPresenceInfluenceHardeningToPacket(packet, rhizohAccess) : packet;
      lastPacket = p;
      adaptation.step(p, dtSec);
      const d = computeFeedsFeedbackFromBroadcast(p);
      feedsAccum = {
        traffic: feedsAccum.traffic * feedsDecay + d.traffic,
        events: feedsAccum.events * feedsDecay + d.events,
        weather: feedsAccum.weather * feedsDecay + d.weather
      };
    },

    /**
     * @param {string} text
     * @param {{ nowMs?: number, episodeMemory?: ReturnType<import("./ghostEpisodeMemoryV547.js").createGhostEpisodeMemory>, frameFingerprint?: string }} [meta]
     */
    ingestChat(text, meta = {}) {
      recordChatCivicMutation(civicLedger, text, meta.nowMs);
      if (meta.episodeMemory) {
        injectSyntheticEpisodeFromChat(meta.episodeMemory, text, meta.frameFingerprint, meta.nowMs);
      }
    },

    /**
     * @param {number} reaction01
     * @param {ReturnType<import("../membership/membershipCoreV1.js").buildRhizohAccessLayer> | null} [rhizohAccess]
     */
    ingestViewerReaction(reaction01, rhizohAccess = null) {
      let r = clamp01(reaction01);
      if (rhizohAccess) {
        const w = clamp01(
          typeof rhizohAccess.presenceInfluenceWeight === "number" ? rhizohAccess.presenceInfluenceWeight : 0.35
        );
        r = clamp01(r * w);
      }
      const n = computeViewerReactionFieldNudge(r);
      feedsAccum = {
        traffic: feedsAccum.traffic * feedsDecay + n.traffic,
        events: feedsAccum.events * feedsDecay + n.events,
        weather: feedsAccum.weather * feedsDecay + n.weather
      };
    },

    /** @param {object} [baseFeeds] */
    mergeIntoFeeds(baseFeeds = {}) {
      const t = baseFeeds.traffic ?? 0.45;
      const ev = baseFeeds.events ?? 0.4;
      const w = baseFeeds.weather ?? 0.5;
      return Object.freeze({
        ...baseFeeds,
        traffic: clamp01(t + feedsAccum.traffic * 0.38),
        events: clamp01(ev + feedsAccum.events * 0.38),
        weather: clamp01(w + feedsAccum.weather * 0.22)
      });
    },

    /** @param {import("./ghostGenome.js").GhostGenome} genome */
    patchGenome(genome) {
      return adaptation.applyToGenome(genome);
    },

    getCivicLedger() {
      return civicLedger;
    },

    getAdaptation() {
      return adaptation;
    },

    getLastPacket() {
      return lastPacket;
    },

    reset() {
      feedsAccum = { traffic: 0, events: 0, weather: 0 };
      lastPacket = null;
      adaptation.reset();
      civicLedger.clear();
    }
  };
}

/**
 * Tek tur: paket + chat + tepki → feeds + genome yaması (saf, stateless özet).
 * @param {object} p
 * @param {object} [p.baseFeeds]
 * @param {import("./ghostGenome.js").GhostGenome} p.genome
 * @param {import("../broadcast/broadcastProtocolV555.js").CastleGenesisStreamPacket | null} [p.packet]
 * @param {ReturnType<import("../membership/membershipCoreV1.js").buildRhizohAccessLayer> | null} [p.rhizohAccess]
 * @param {string[]} [p.chatLines]
 * @param {number} [p.viewerReaction01]
 * @param {number} [p.dtSec]
 * @param {ReturnType<import("./ghostEpisodeMemoryV547.js").createGhostEpisodeMemory>} [p.episodeMemory]
 * @param {string} [p.frameFingerprint]
 */
export function closeRuntimeFeedbackRound(p) {
  const dt = p.dtSec ?? 0.016;
  const packet =
    p.packet && p.rhizohAccess ? applyPresenceInfluenceHardeningToPacket(p.packet, p.rhizohAccess) : p.packet;
  const adapt = createGhostAudienceAdaptationOverlay();
  adapt.step(packet ?? null, dt);

  let feeds = { ...(p.baseFeeds ?? {}) };
  const b = computeFeedsFeedbackFromBroadcast(packet ?? null);
  feeds.traffic = clamp01((feeds.traffic ?? 0.45) + b.traffic * 0.35);
  feeds.events = clamp01((feeds.events ?? 0.4) + b.events * 0.35);
  feeds.weather = clamp01((feeds.weather ?? 0.5) + b.weather * 0.2);

  if (typeof p.viewerReaction01 === "number") {
    let r01 = clamp01(p.viewerReaction01);
    if (p.rhizohAccess) {
      const w = clamp01(
        typeof p.rhizohAccess.presenceInfluenceWeight === "number" ? p.rhizohAccess.presenceInfluenceWeight : 0.35
      );
      r01 = clamp01(r01 * w);
    }
    const vr = computeViewerReactionFieldNudge(r01);
    feeds.traffic = clamp01(feeds.traffic + vr.traffic);
    feeds.events = clamp01(feeds.events + vr.events);
    feeds.weather = clamp01(feeds.weather + vr.weather);
  }

  const ledger = createCivicChatMutationLedger({ maxEntries: 32 });
  for (const line of p.chatLines ?? []) {
    recordChatCivicMutation(ledger, line);
    if (p.episodeMemory) injectSyntheticEpisodeFromChat(p.episodeMemory, line, p.frameFingerprint);
  }

  const genomePatched = adapt.applyToGenome(p.genome);

  return Object.freeze({
    feeds,
    genomePatched,
    civicMutations: ledger.recent(16),
    adaptation: adapt.snapshot()
  });
}
