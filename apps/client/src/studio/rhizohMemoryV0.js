/**
 * Rhizoh Memory v0 — Katman 2: etkileşim gözlem defteri (kullanıcı profili değil).
 * Sonuç üretmez; frekans, kullanım kalıbı ve dikkat sinyali toplar.
 * @see octoJournalV0.js
 */

import { classifyCubeGeometryV0 } from "./octoJournalV0.js";
import {
  createRhizohAttentionFieldV0,
  depositRhizohAttentionFieldV0,
  stepRhizohAttentionFieldV0
} from "./rhizohAttentionFieldV0.js";

export const RHIZOH_MEMORY_SCHEMA_V0 = "castle.rhizoh_memory.v0";
export const RHIZOH_MEMORY_TICK_SCHEMA_V0 = "castle.rhizoh_memory_tick.v0";

/** Frequency buckets only — mention counts, not "user likes X". */
export const RHIZOH_TOPIC_BUCKETS_V0 = Object.freeze({
  map: Object.freeze(["harita", "map", "dünya", "world", "cesium", "konum", "yer", "geo"]),
  spiral: Object.freeze(["spiral", "sarmal", "helical", "spirali"]),
  basketball: Object.freeze(["basketbol", "basketball", "nba"]),
  geometry: Object.freeze(["geometri", "geometry", "şekil", "küp", "cube", "kristal", "topoloji"]),
  music: Object.freeze(["müzik", "music", "şarkı", "melodi", "ritim"]),
  memory: Object.freeze(["hatırla", "bellek", "geçmiş", "memory", "dün", "önce"]),
  exploration: Object.freeze(["keşif", "explore", "gez", "dolaş", "yolculuk", "travel"])
});

const TOPIC_SIGNAL_LIMIT_V0 = 32;
const ATTENTION_HISTORY_LIMIT_V0 = 32;

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function normalizeTokenV0(raw) {
  return String(raw || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .trim();
}

/**
 * @param {string} text
 */
export function extractRhizohTopicSignalsV0(text) {
  const normalized = String(text || "").toLowerCase();
  if (!normalized.trim()) return Object.freeze([]);

  const tokens = normalized.split(/\s+/).map(normalizeTokenV0).filter((t) => t.length > 1);
  const found = new Set();

  for (const [topic, words] of Object.entries(RHIZOH_TOPIC_BUCKETS_V0)) {
    for (const word of words) {
      const hit = tokens.some((token) => token.includes(word) || word.includes(token));
      if (hit || normalized.includes(word)) {
        found.add(topic);
        break;
      }
    }
  }

  return Object.freeze([...found]);
}

/**
 * @param {object} [seed]
 */
export function createRhizohMemoryV0(seed = {}) {
  const nowMs = Date.now();
  return {
    schema: RHIZOH_MEMORY_SCHEMA_V0,
    topicSignals: { ...(seed.topicSignals ?? {}) },
    interactionPatterns: {
      sessionStartedAtMs: seed.interactionPatterns?.sessionStartedAtMs ?? nowMs,
      promptCount: Math.max(0, Number(seed.interactionPatterns?.promptCount) || 0),
      totalPromptChars: Math.max(0, Number(seed.interactionPatterns?.totalPromptChars) || 0),
      worldModeSamples: Math.max(0, Number(seed.interactionPatterns?.worldModeSamples) || 0),
      conversationModeSamples: Math.max(0, Number(seed.interactionPatterns?.conversationModeSamples) || 0),
      explorationBias: clamp01(seed.interactionPatterns?.explorationBias ?? 0),
      avgSessionMinutes: Math.max(0, Number(seed.interactionPatterns?.avgSessionMinutes) || 0),
      avgPromptLength: Math.max(0, Number(seed.interactionPatterns?.avgPromptLength) || 0)
    },
    attentionHistory: Array.isArray(seed.attentionHistory) ? [...seed.attentionHistory] : [],
    attentionField: createRhizohAttentionFieldV0(seed.attentionField ?? {}),
    lastDraftSnapshot: seed.lastDraftSnapshot ?? "",
    lastReplySnapshot: seed.lastReplySnapshot ?? "",
    lastAttentionFocus: seed.lastAttentionFocus ?? null,
    lastGeometryAttention: seed.lastGeometryAttention ?? null,
    lastDominantAttention: seed.lastDominantAttention ?? null,
    lastMapAttention: seed.lastMapAttention ?? false,
    observationCount: Math.max(0, Number(seed.observationCount) || 0),
    lastObservationAtMs: seed.lastObservationAtMs ?? nowMs,
    /** Sprint D — Octo keşif raporları; birikir, henüz etki yok. */
    observationInbox: Array.isArray(seed.observationInbox) ? [...seed.observationInbox] : [],
    /** Sprint E — inbox kaydı → attentionField tek seferlik eşlemesi */
    observationInboxCoupledKeys: { ...(seed.observationInboxCoupledKeys ?? {}) }
  };
}

/**
 * @param {Record<string, { topic: string, mentions: number, lastSeenAtMs: number }>} store
 * @param {string[]} topics
 * @param {number} nowMs
 */
function recordRhizohTopicMentionsV0(store, topics, nowMs) {
  /** @type {Array<{ topic: string, mentions: number, lastSeenAtMs: number }>} */
  const touched = [];
  for (const topic of topics) {
    if (!topic) continue;
    const prev = store[topic];
    const entry = prev
      ? { ...prev, mentions: prev.mentions + 1, lastSeenAtMs: nowMs }
      : { topic, mentions: 1, lastSeenAtMs: nowMs };
    store[topic] = entry;
    touched.push(entry);
  }
  return touched;
}

function rankTopicSignalsV0(store) {
  return Object.values(store)
    .sort((a, b) => {
      const byMentions = (b.mentions ?? 0) - (a.mentions ?? 0);
      if (byMentions !== 0) return byMentions;
      return (b.lastSeenAtMs ?? 0) - (a.lastSeenAtMs ?? 0);
    })
    .slice(0, TOPIC_SIGNAL_LIMIT_V0);
}

/**
 * @param {ReturnType<typeof createRhizohMemoryV0>} memory
 * @param {string} focus
 * @param {number} strength
 * @param {number} nowMs
 */
export function recordRhizohAttentionV0(memory, focus, strength, nowMs = Date.now()) {
  const key = String(focus || "").trim();
  if (!key) return null;

  const entry = Object.freeze({
    focus: key,
    strength: clamp01(strength),
    atMs: nowMs
  });

  memory.attentionHistory.push(entry);
  if (memory.attentionHistory.length > ATTENTION_HISTORY_LIMIT_V0) {
    memory.attentionHistory.splice(0, memory.attentionHistory.length - ATTENTION_HISTORY_LIMIT_V0);
  }
  memory.lastAttentionFocus = key;
  return entry;
}

/**
 * Rhizoh önerisi — alan hücresine birikir; Octo'ya emir değildir.
 * @param {ReturnType<typeof createRhizohMemoryV0>} memory
 * @param {{ target: string, weight?: number, source?: string }} hint
 */
export function enqueueRhizohAttentionHintV0(memory, hint) {
  const deposited = depositRhizohAttentionFieldV0(
    memory.attentionField,
    hint?.target,
    clamp01(hint?.weight ?? 0.3)
  );
  if (!deposited) return null;
  return Object.freeze({
    ...deposited,
    source: String(hint?.source || "rhizoh_memory"),
    atMs: Date.now()
  });
}

/**
 * @param {ReturnType<typeof createRhizohMemoryV0>} memory
 */
export function snapshotRhizohInteractionPatternsV0(memory) {
  const p = memory.interactionPatterns;
  const modeTotal = p.worldModeSamples + p.conversationModeSamples;
  const explorationBias = modeTotal > 0 ? p.worldModeSamples / modeTotal : p.explorationBias;

  return Object.freeze({
    avgSessionMinutes: p.avgSessionMinutes,
    avgPromptLength: p.avgPromptLength,
    explorationBias: clamp01(explorationBias),
    worldModeSamples: p.worldModeSamples,
    conversationModeSamples: p.conversationModeSamples,
    prefersWorldMode: explorationBias >= 0.58,
    prefersConversationMode: explorationBias <= 0.42 && modeTotal > 0
  });
}

/**
 * @param {ReturnType<typeof createRhizohMemoryV0>} memory
 */
export function snapshotRhizohMemoryV0(memory) {
  return Object.freeze({
    schema: RHIZOH_MEMORY_SCHEMA_V0,
    topicSignals: Object.freeze(rankTopicSignalsV0(memory.topicSignals)),
    interactionPatterns: snapshotRhizohInteractionPatternsV0(memory),
    attentionHistory: Object.freeze(memory.attentionHistory.slice(-ATTENTION_HISTORY_LIMIT_V0)),
    attentionField: Object.freeze({ ...memory.attentionField }),
    observationInbox: Object.freeze(memory.observationInbox.slice(-32)),
    observationCount: memory.observationCount,
    lastObservationAtMs: memory.lastObservationAtMs
  });
}

/**
 * @param {ReturnType<typeof createRhizohMemoryV0>} memory
 * @param {{
 *   nowMs?: number,
 *   deltaMs?: number,
 *   draftText?: string,
 *   replyText?: string,
 *   fieldState?: string,
 *   mapSurfaceActive?: boolean,
 *   engine?: object
 * }} ctx
 */
export function stepRhizohMemoryV0(memory, ctx = {}) {
  const nowMs = ctx.nowMs ?? Date.now();
  const deltaMs = Math.max(0, Number(ctx.deltaMs) || 0);
  const draftText = String(ctx.draftText || "");
  const replyText = String(ctx.replyText || "");
  const patterns = memory.interactionPatterns;

  /** @type {Array<{ topic: string, mentions: number, lastSeenAtMs: number }>} */
  let topicTouches = [];
  /** @type {ReturnType<typeof recordRhizohAttentionV0> | null} */
  let attentionEntry = null;

  if (draftText && draftText !== memory.lastDraftSnapshot) {
    memory.lastDraftSnapshot = draftText;
    const topics = extractRhizohTopicSignalsV0(draftText);
    topicTouches = recordRhizohTopicMentionsV0(memory.topicSignals, topics, nowMs);
    patterns.promptCount += 1;
    patterns.totalPromptChars += draftText.trim().length;
    patterns.avgPromptLength = patterns.totalPromptChars / Math.max(1, patterns.promptCount);

    for (const topic of topics) {
      const mentions = memory.topicSignals[topic]?.mentions ?? 1;
      const strength = clamp01(0.28 + Math.min(mentions, 12) * 0.05);
      attentionEntry = recordRhizohAttentionV0(memory, topic, strength, nowMs);
    }
  }

  if (replyText && replyText !== memory.lastReplySnapshot) {
    memory.lastReplySnapshot = replyText;
    const topics = extractRhizohTopicSignalsV0(replyText);
    if (topics.length) {
      topicTouches = recordRhizohTopicMentionsV0(memory.topicSignals, topics, nowMs);
      for (const topic of topics) {
        const mentions = memory.topicSignals[topic]?.mentions ?? 1;
        attentionEntry = recordRhizohAttentionV0(memory, topic, clamp01(0.22 + mentions * 0.04), nowMs);
      }
    }
  }

  const mapActive = ctx.mapSurfaceActive === true;
  const conversationActive =
    draftText.trim().length > 0 ||
    replyText.trim().length > 0 ||
    /speaking|listening|thinking|executing|generating/i.test(String(ctx.fieldState || ""));

  if (mapActive) patterns.worldModeSamples += deltaMs > 0 ? 1 : 0;
  if (conversationActive) patterns.conversationModeSamples += deltaMs > 0 ? 1 : 0;

  const modeTotal = patterns.worldModeSamples + patterns.conversationModeSamples;
  patterns.explorationBias = modeTotal > 0 ? patterns.worldModeSamples / modeTotal : patterns.explorationBias;
  patterns.avgSessionMinutes = Math.max(0, (nowMs - patterns.sessionStartedAtMs) / 60000);

  const engine = ctx.engine;
  if (engine) {
    const classified = classifyCubeGeometryV0(engine.targetTopology ?? engine.currentTopology ?? {});
    const geometry = classified.geometry;
    if (geometry && geometry !== "neutral" && geometry !== memory.lastGeometryAttention) {
      memory.lastGeometryAttention = geometry;
      attentionEntry = recordRhizohAttentionV0(memory, geometry, 0.48, nowMs);
    }
    const dominant = String(engine.dominant || "").toLowerCase();
    if (dominant && dominant !== "neutral" && dominant !== memory.lastDominantAttention) {
      memory.lastDominantAttention = dominant;
      attentionEntry = recordRhizohAttentionV0(memory, dominant, 0.42, nowMs);
    }
  }

  if (mapActive && memory.lastMapAttention !== true) {
    memory.lastMapAttention = true;
    attentionEntry = recordRhizohAttentionV0(memory, "map", 0.76, nowMs);
  } else if (!mapActive) {
    memory.lastMapAttention = false;
  }

  if (topicTouches.length || attentionEntry || deltaMs > 0) {
    memory.observationCount += 1;
    memory.lastObservationAtMs = nowMs;
  }

  const attentionField = stepRhizohAttentionFieldV0(memory.attentionField, deltaMs, {
    attentionEntry,
    topicTouches
  });

  return Object.freeze({
    schema: RHIZOH_MEMORY_TICK_SCHEMA_V0,
    topicTouches: Object.freeze(topicTouches),
    attentionEntry,
    attentionField,
    interactionPatterns: snapshotRhizohInteractionPatternsV0(memory),
    snapshot: snapshotRhizohMemoryV0(memory)
  });
}
