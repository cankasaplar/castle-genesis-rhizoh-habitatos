/**
 * vNext-555 — CastleGenesis broadcast protocol layer
 *
 * Semantik kare (2–5 Hz) → tek paket: field + ghost + civic strata + one-liner + izleyici yoğunluğu.
 * YouTube Live = çıkış yüzeyi; bu modül RTMP’den bağımsız paket sözleşmesi ve presence köprüsü.
 */

import { composeHabitatStreamPackage } from "./streamComposer.js";
import { applyPresenceInfluenceHardeningToPacket } from "../ghost/presenceInfluenceLoopHardeningV556.js";

/** Gateway `realityContractLockV1.broadcastProtocolClientRef` ile hizalanır. */
export const BROADCAST_PROTOCOL_VERSION = "v555.1";

/** Önerilen görsel / OSD bütçe oranları (yüzde) — CastleGenesis yerleşimi */
export const CASTLEGENESIS_LAYER_BUDGET = Object.freeze({
  fieldGhostVisualPct: 60,
  civicStrataPct: 25,
  civicOneLinerPct: 10,
  presenceChatPct: 5
});

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

/**
 * @typedef {object} CivicStratumWire
 * @property {string} tier
 * @property {string} text
 * @property {number} salience01
 * @property {boolean} visible
 */

/**
 * @typedef {object} CastleGenesisStreamPacket
 * @property {string} protocolVersion
 * @property {number} seq
 * @property {number} emittedAtMs üretici zamanı
 * @property {number} streamClockMs izleyici tarafı telafi (offset − buffer)
 * @property {number} semanticHz önerilen semantik FPS (2–5)
 * @property {ReturnType<typeof composeHabitatStreamPackage>} habitat
 * @property {CivicStratumWire[]} civicStrataVisible
 * @property {string | null} civicOneLiner
 * @property {string[]} recommendedStratumTiers
 * @property {typeof CASTLEGENESIS_LAYER_BUDGET} layerBudget
 * @property {ReturnType<typeof audienceDensityGhostReaction>} ghostReactionToAudience
 * @property {object | null} ghostIntentCapsule hafif intent özeti
 * @property {number} audienceDensity01
 * @property {number} chatBurst01
 */

/**
 * İzleyici RTT / senkro telafisi (encoder overlay için).
 * @param {number} emittedAtMs
 * @param {number} [viewerOffsetMs] tahmini tek yön gecikme
 * @param {number} [bufferMs] güvenlik tamponu
 */
export function compensateStreamClock(emittedAtMs, viewerOffsetMs = 0, bufferMs = 140) {
  return Math.max(0, Math.floor(emittedAtMs - viewerOffsetMs - bufferMs));
}

/**
 * Semantik kare üretim zamanlayıcısı (sürekli 60 FPS yerine 2–5 Hz anlam karesi).
 * @param {object} [opts]
 * @param {number} [opts.semanticHz] varsayılan 3
 */
export function createSemanticFrameBatcher(opts = {}) {
  const hz = Math.max(0.5, Math.min(8, opts.semanticHz ?? 3));
  const minIntervalMs = 1000 / hz;
  let seq = 0;
  let lastEmit = /** @type {number} */ (-1);

  return {
    semanticHz: hz,

    /** @param {number} nowMs */
    shouldEmit(nowMs) {
      if (lastEmit < 0) return true;
      return nowMs - lastEmit >= minIntervalMs;
    },

    nextSeq() {
      return ++seq;
    },

    /** @param {number} nowMs */
    markEmit(nowMs) {
      lastEmit = nowMs;
    },

    reset() {
      seq = 0;
      lastEmit = -1;
    }
  };
}

/**
 * YouTube chat / süper chat → presence ipuçları (manuel `applyChatHintsToPresence` ile uygulanır).
 * @param {string} text
 * @param {number} [strength01]
 */
export function chatMessageToPresenceHints(text, strength01 = 0.4) {
  const t = String(text || "").toLowerCase();
  const s = clamp01(strength01);
  /** @type {{ biasWakeAffinity: number, pulseInteraction: number, districtGuess: string | null, requestOracle: boolean }} */
  const hints = {
    biasWakeAffinity: 0,
    pulseInteraction: 0,
    districtGuess: null,
    requestOracle: false
  };

  if (/oracle|uyan|doruk|climax|zirve/.test(t)) {
    hints.biasWakeAffinity = 0.22 * s;
    hints.requestOracle = /oracle|uyan|climax|zirve/.test(t);
  }
  if (/\b(hey|yo|selam|gg|wow|heyecan)\b/.test(t)) {
    hints.pulseInteraction = 0.12 * s;
  }
  const dm = t.match(
    /\b(besiktas|kadikoy|fatih|uskudar|sisli|beyoglu|bosphorus|bogaz)\b/i
  );
  if (dm) {
    const id = dm[0].toLowerCase();
    hints.districtGuess = id === "bogaz" || id === "bosphorus" ? "besiktas" : id;
  }

  return Object.freeze(hints);
}

/**
 * @param {ReturnType<import("../ghost/userPresenceLoopV548.js").createUserPresenceLoop>} presenceLoop
 * @param {ReturnType<typeof chatMessageToPresenceHints>} hints
 */
export function applyChatHintsToPresence(presenceLoop, hints) {
  if (hints.districtGuess) presenceLoop.setFocus(hints.districtGuess, 0.72);
  if (hints.pulseInteraction > 0) presenceLoop.pulseInteraction(hints.pulseInteraction);
  if (hints.biasWakeAffinity > 0) presenceLoop.biasWakeAffinity(hints.biasWakeAffinity);
  if (hints.requestOracle) presenceLoop.requestOracleNudge();
}

/**
 * İzleyici → presence enjeksiyonu üyelik penceresiyle (`createPresenceInjectionGovernor`) sınırlı.
 * @param {Parameters<typeof applyChatHintsToPresence>[0]} presenceLoop
 * @param {Parameters<typeof applyChatHintsToPresence>[1]} hints
 * @param {{ scaleChatHints?: (h: typeof hints) => typeof hints } | null | undefined} governor
 */
export function applyChatHintsToPresenceGated(presenceLoop, hints, governor) {
  const scaled = governor?.scaleChatHints ? governor.scaleChatHints(hints) : hints;
  applyChatHintsToPresence(presenceLoop, scaled);
}

/**
 * İzleyici yoğunluğu + chat patlaması → hayalet / collective wake geri beslemesi.
 * @param {number} viewerCount01 normalize concurrent viewers [0–1]
 * @param {number} chatBurst01 mesaj hızı / süper chat yoğunluğu [0–1]
 */
export function audienceDensityGhostReaction(viewerCount01, chatBurst01) {
  const d = clamp01(viewerCount01);
  const c = clamp01(chatBurst01);
  return Object.freeze({
    collectiveWakeFeedback01: clamp01(d * 0.42 + c * 0.58),
    microWakeBoost01: clamp01(0.035 + d * 0.11 + c * 0.09),
    resistanceSoftening01: clamp01((1 - d) * 0.07 + c * 0.05)
  });
}

/**
 * @param {object} input
 * @param {import("../bridge/CastleFieldBridge.js").CastleFieldBridgeFrame} input.frame
 * @param {import("./fieldStoryEngine.js").FieldStoryBeats} input.beats
 * @param {Parameters<typeof composeHabitatStreamPackage>[2]} [input.streamOpts] narration, ghost summary, schedule…
 * @param {import("../ghost/narrativeCompressionCivicMemoryV553.js").CompressedNarrativePack | null} [input.civicPack]
 * @param {import("../ghost/ghostIntentLayerV547.js").GhostIntent | null} [input.ghostIntent]
 * @param {number} [input.viewerOffsetMs]
 * @param {number} [input.audienceDensity01]
 * @param {number} [input.chatBurst01]
 * @param {ReturnType<typeof createSemanticFrameBatcher>} [input.batcher]
 * @param {number} [input.emittedAtMs]
 * @param {number} [input.latencyBufferMs]
 * @param {number} [input.semanticHz] batcher yoksa yalnızca meta
 * @param {ReturnType<import("../membership/membershipCoreV1.js").buildRhizohAccessLayer> | null} [input.rhizohAccess] üyelik → ghost/civic sıkılaştırma (vNext-556)
 * @returns {CastleGenesisStreamPacket}
 */
export function composeCastleGenesisPacket(input) {
  const {
    frame,
    beats,
    streamOpts = {},
    civicPack = null,
    ghostIntent = null,
    viewerOffsetMs = 0,
    audienceDensity01 = 0.18,
    chatBurst01 = 0.12,
    batcher = null,
    emittedAtMs = Date.now(),
    latencyBufferMs = 140,
    semanticHz = 3,
    rhizohAccess = null
  } = input;

  const habitat = composeHabitatStreamPackage(frame, beats, streamOpts);
  const streamClockMs = compensateStreamClock(emittedAtMs, viewerOffsetMs, latencyBufferMs);
  const reaction = audienceDensityGhostReaction(audienceDensity01, chatBurst01);

  /** @type {CivicStratumWire[]} */
  let civicStrataVisible = [];
  let civicOneLiner = /** @type {string | null} */ (null);
  /** @type {string[]} */
  let recommendedStratumTiers = ["pulse", "consensus"];

  if (civicPack) {
    civicOneLiner = civicPack.civicOneLiner;
    recommendedStratumTiers = civicPack.recommendedVisible ?? recommendedStratumTiers;
    const allow = new Set(recommendedStratumTiers);
    civicStrataVisible = (civicPack.strata ?? [])
      .filter((st) => allow.has(st.tier))
      .map((st) => ({
        tier: st.tier,
        text: st.text,
        salience01: st.salience01,
        visible: true
      }));
  }

  const seq = batcher ? batcher.nextSeq() : 0;
  const hz = batcher ? batcher.semanticHz : semanticHz;

  const packet = Object.freeze({
    protocolVersion: BROADCAST_PROTOCOL_VERSION,
    seq,
    emittedAtMs,
    streamClockMs,
    semanticHz: hz,
    habitat,
    civicStrataVisible,
    civicOneLiner,
    recommendedStratumTiers,
    layerBudget: CASTLEGENESIS_LAYER_BUDGET,
    ghostReactionToAudience: reaction,
    ghostIntentCapsule: ghostIntent
      ? {
          wakePhase: ghostIntent.wakePhase,
          narrationTone: ghostIntent.narrationTone,
          ghostResistance01: ghostIntent.ghostResistance01,
          microWake01: ghostIntent.microWake01 ?? 0,
          emphasizedDistrictId: ghostIntent.emphasizedDistrictId
        }
      : null,
    audienceDensity01: clamp01(audienceDensity01),
    chatBurst01: clamp01(chatBurst01)
  });
  return rhizohAccess ? applyPresenceInfluenceHardeningToPacket(packet, rhizohAccess) : packet;
}

/**
 * RTMP / obs websocket / gateway için JSON satırı.
 * @param {CastleGenesisStreamPacket} packet
 */
export function serializeCastleGenesisPacket(packet) {
  return JSON.stringify(packet);
}

/**
 * @param {string} json
 * @returns {CastleGenesisStreamPacket | null}
 */
export function parseCastleGenesisPacket(json) {
  try {
    const o = JSON.parse(json);
    if (o?.protocolVersion && o?.habitat) return o;
    return null;
  } catch {
    return null;
  }
}
