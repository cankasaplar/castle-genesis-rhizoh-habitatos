/**
 * Rhizoh Experience Fabric v1 — multi-source event stream + attention field + spike engine.
 * Living context interpreter; input = lived world snapshot.
 * @see apps/client/docs/RHIZOH_EXPERIENCE_FABRIC_V1.md
 */

import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import { clamp01V1, noteCoPresenceSpikeResponseV1 } from "./rhizohCoPresenceRuntimeV1.js";
import { evaluateStreamingAttentionSpikeV0 } from "./rhizohStreamingAttentionGateV0.js";

export const RHIZOH_EXPERIENCE_FABRIC_SCHEMA_V1 = "rhizoh.experience_fabric.v1";

/** Normalized fabric source ids (multi-world). */
export const FABRIC_SOURCE_V1 = Object.freeze({
  MIC: "mic",
  YOUTUBE: "youtube",
  MEDIA: "media",
  SYSTEM: "system",
  IMAGE: "image",
  ARCHIVE: "archive",
  ACTION: "action"
});

export const FABRIC_SPIKE_INTENT_V1 = Object.freeze({
  NONE: "none",
  MEMORY_WRITE: "memory_write",
  MEMORY_RETRIEVAL: "memory_retrieval",
  ANALYTICAL: "analytical",
  EXPLAIN_MOMENT: "explain_moment",
  NOTE_TAKE: "note_take",
  EMERGENCY: "emergency",
  CONVERSATION: "conversation"
});

const SOURCE_SALIENCE_V1 = Object.freeze({
  [FABRIC_SOURCE_V1.MIC]: 0.88,
  [FABRIC_SOURCE_V1.ACTION]: 0.94,
  [FABRIC_SOURCE_V1.YOUTUBE]: 0.32,
  [FABRIC_SOURCE_V1.MEDIA]: 0.52,
  [FABRIC_SOURCE_V1.SYSTEM]: 0.28,
  [FABRIC_SOURCE_V1.IMAGE]: 0.62,
  [FABRIC_SOURCE_V1.ARCHIVE]: 0.68
});

const SOURCE_MAP_V1 = Object.freeze({
  mic: FABRIC_SOURCE_V1.MIC,
  youtube: FABRIC_SOURCE_V1.YOUTUBE,
  youtube_audio: FABRIC_SOURCE_V1.YOUTUBE,
  media: FABRIC_SOURCE_V1.MEDIA,
  media_player: FABRIC_SOURCE_V1.MEDIA,
  file_stream: FABRIC_SOURCE_V1.MEDIA,
  system: FABRIC_SOURCE_V1.SYSTEM,
  system_audio: FABRIC_SOURCE_V1.SYSTEM,
  external_device: FABRIC_SOURCE_V1.SYSTEM,
  image: FABRIC_SOURCE_V1.IMAGE,
  camera_context: FABRIC_SOURCE_V1.IMAGE,
  screen_context: FABRIC_SOURCE_V1.IMAGE,
  archive: FABRIC_SOURCE_V1.ARCHIVE,
  memory_clip: FABRIC_SOURCE_V1.ARCHIVE,
  action: FABRIC_SOURCE_V1.ACTION,
  user_action: FABRIC_SOURCE_V1.ACTION
});

const FIELD_INTERACTION_PATTERNS_V1 = [
  /\b(dur|durdu|pause|durdur)\b/i,
  /(geri\s+sar|rewind|seek|atla)/i,
  /(not\s+al|not\s+yaz|bookmark|highlight|işaretle)/i,
  /(burayı|şunu|bunu)\s+(açıkla|anlat|yorumla|hatırla)/i,
  /\b(remember|explain|note\s+this|what\s+was\s+that)\b/i
];

const FIELD_MEMORY_RECALL_PATTERNS_V1 = [
  /(hatırla|kaydet|not\s+et|remember\s+this|save\s+this\s+scene)/i,
  /(bu\s+sahne|this\s+scene|this\s+moment)/i
];

const SPIKE_INTENT_PATTERNS_V1 = [
  {
    intent: FABRIC_SPIKE_INTENT_V1.MEMORY_WRITE,
    re: /(not\s+al|not\s+yaz|hatırla|kaydet|bookmark|işaretle|save\s+this)/i,
    weight: 0.9
  },
  {
    intent: FABRIC_SPIKE_INTENT_V1.MEMORY_RETRIEVAL,
    re: /(şu\s+sahne\s+neydi|bu\s+neydi|what\s+was\s+that|hatırlıyor\s+musun)/i,
    weight: 0.86
  },
  {
    intent: FABRIC_SPIKE_INTENT_V1.EXPLAIN_MOMENT,
    re: /(burada\s+ne\s+oldu|açıkla|anlat|explain\s+this|what\s+happened\s+here)/i,
    weight: 0.84
  },
  {
    intent: FABRIC_SPIKE_INTENT_V1.ANALYTICAL,
    re: /(analiz|pozisyon|hamle|foul|neden|niye|why|analyze)/i,
    weight: 0.82
  },
  {
    intent: FABRIC_SPIKE_INTENT_V1.NOTE_TAKE,
    re: /(not\s+et|note\s+this|yaz\s+bunu)/i,
    weight: 0.8
  }
];

const EVENT_STREAM_MAX_V1 = 160;
const ANCHOR_GRAPH_MAX_V1 = 64;
const ATTENTION_FIELD_WINDOW_MS_V1 = 90_000;

/** @type {object[]} */
const eventStreamV1 = [];
/** @type {object[]} */
const memoryAnchorsV1 = [];
/** @type {Record<string, object>} */
const mediaSyncV1 = {};

/**
 * @param {string} rawSource
 */
export function mapToFabricSourceV1(rawSource) {
  const key = String(rawSource || FABRIC_SOURCE_V1.MIC).toLowerCase();
  return SOURCE_MAP_V1[key] || FABRIC_SOURCE_V1.MIC;
}

/**
 * Field signal classifier (no unified-field import — avoids circular dependency).
 * @param {object} input
 */
export function classifyExperienceAttentionSignalsV1(input = {}) {
  const text = String(input.text || input.preview || "").trim();
  const userAction = String(input.userAction || input.action || "").trim().toLowerCase();
  /** @type {{ kind: string, score: number, reason: string }[]} */
  const signals = [];

  if (userAction) {
    signals.push({
      kind: "interaction",
      score: 0.88,
      reason: `user_action_${userAction}`
    });
  }
  if (["pause", "seek", "highlight", "bookmark", "rewind"].includes(userAction)) {
    signals.push({
      kind: "media_state",
      score: 0.82,
      reason: `media_state_${userAction}`
    });
  }
  if (text) {
    if (FIELD_MEMORY_RECALL_PATTERNS_V1.some((re) => re.test(text))) {
      signals.push({
        kind: "memory_recall",
        score: 0.86,
        reason: "memory_recall_lexicon"
      });
    }
    if (FIELD_INTERACTION_PATTERNS_V1.some((re) => re.test(text))) {
      signals.push({
        kind: "interaction",
        score: 0.8,
        reason: "interaction_verbs"
      });
    }
  }
  if (input.visual === true || mapToFabricSourceV1(input.source) === FABRIC_SOURCE_V1.IMAGE) {
    signals.push({ kind: "visual", score: 0.72, reason: "visual_context_present" });
  }
  if (input.sceneChange === true) {
    signals.push({ kind: "scene_change", score: 0.68, reason: "scene_change" });
  }
  return Object.freeze(signals);
}

function resolveActiveMediaPositionMsV1() {
  for (const src of [FABRIC_SOURCE_V1.YOUTUBE, FABRIC_SOURCE_V1.MEDIA, FABRIC_SOURCE_V1.SYSTEM]) {
    const sync = mediaSyncV1[src];
    if (sync && Number.isFinite(sync.positionMs) && sync.positionMs > 0) {
      return sync.positionMs;
    }
  }
  return null;
}

/**
 * Multi-source event normalizer.
 * @param {object} raw
 */
export function normalizeExperienceEventV1(raw = {}) {
  const source = mapToFabricSourceV1(raw.source);
  const preview = raw.preview
    ? String(raw.preview).slice(0, 160)
    : raw.text
      ? String(raw.text).slice(0, 160)
      : null;
  const timestamp = Number(raw.atMs || raw.timestamp) || Date.now();
  const semanticHint =
    raw.semanticHint ||
    (preview ? preview.split(/\s+/).slice(0, 4).join(" ").toLowerCase() : null);
  const salienceHint = clamp01V1(
    Number(raw.salienceHint) ||
      SOURCE_SALIENCE_V1[source] * (raw.userInitiated ? 1.08 : 1)
  );

  return Object.freeze({
    schema: RHIZOH_EXPERIENCE_FABRIC_SCHEMA_V1,
    source,
    signal: Object.freeze({
      raw: raw.signal?.raw ?? preview ?? raw.text ?? null,
      preview,
      confidence: Number.isFinite(Number(raw.confidence)) ? Number(raw.confidence) : null,
      mediaPositionMs: Number.isFinite(Number(raw.mediaPositionMs))
        ? Number(raw.mediaPositionMs)
        : mediaSyncV1[source]?.positionMs ?? null
    }),
    timestamp,
    semantic_hint: semanticHint,
    salience_hint: Number(salienceHint.toFixed(3))
  });
}

/**
 * @param {object} raw
 */
export function ingestFabricEventV1(raw = {}) {
  const event = normalizeExperienceEventV1(raw);
  const row = Object.freeze({
    ...event,
    id: `fab_${event.timestamp.toString(36)}_${eventStreamV1.length}`
  });
  eventStreamV1.push(row);
  if (eventStreamV1.length > EVENT_STREAM_MAX_V1) eventStreamV1.shift();
  publishFabricSnapshotV1();
  return row;
}

/**
 * Co-presence attention field — weighted source mass over window.
 */
export function computeAttentionFieldV1(nowMs = Date.now()) {
  const cutoff = nowMs - ATTENTION_FIELD_WINDOW_MS_V1;
  const recent = eventStreamV1.filter((e) => e.timestamp >= cutoff);
  /** @type {Record<string, number>} */
  const mass = {};
  for (const src of Object.values(FABRIC_SOURCE_V1)) {
    mass[src] = 0;
  }
  for (const e of recent) {
    mass[e.source] = (mass[e.source] || 0) + e.salience_hint * 0.12;
  }
  for (const src of Object.keys(mass)) {
    mass[src] = Number(clamp01V1(mass[src]).toFixed(3));
  }
  const dominant = Object.entries(mass).sort((a, b) => b[1] - a[1])[0]?.[0] || FABRIC_SOURCE_V1.MIC;
  return Object.freeze({
    schema: RHIZOH_EXPERIENCE_FABRIC_SCHEMA_V1,
    windowMs: ATTENTION_FIELD_WINDOW_MS_V1,
    eventCount: recent.length,
    mass: Object.freeze({ ...mass }),
    dominantSource: dominant,
    userStreamPriority: mass[FABRIC_SOURCE_V1.MIC] + mass[FABRIC_SOURCE_V1.ACTION],
    backgroundMass:
      mass[FABRIC_SOURCE_V1.YOUTUBE] +
      mass[FABRIC_SOURCE_V1.SYSTEM] +
      mass[FABRIC_SOURCE_V1.MEDIA] * 0.5
  });
}

/**
 * @param {string} text
 */
export function classifySpikeIntentV1(text) {
  const norm = String(text || "").trim();
  if (!norm) return Object.freeze({ intent: FABRIC_SPIKE_INTENT_V1.NONE, score: 0 });

  for (const pat of SPIKE_INTENT_PATTERNS_V1) {
    if (pat.re.test(norm)) {
      return Object.freeze({ intent: pat.intent, score: pat.weight, reason: "pattern_match" });
    }
  }
  if (/\?/.test(norm) || norm.length >= 8) {
    return Object.freeze({
      intent: FABRIC_SPIKE_INTENT_V1.CONVERSATION,
      score: 0.62,
      reason: "directed_speech"
    });
  }
  return Object.freeze({ intent: FABRIC_SPIKE_INTENT_V1.NONE, score: 0, reason: "ambient" });
}

/**
 * Temporal anchor graph node — memory is not flat storage.
 * @param {object} spike
 */
export function anchorTemporalMemoryV1(spike) {
  if (
    spike.intent !== FABRIC_SPIKE_INTENT_V1.MEMORY_WRITE &&
    spike.intent !== FABRIC_SPIKE_INTENT_V1.NOTE_TAKE
  ) {
    return null;
  }
  const anchor = Object.freeze({
    schema: RHIZOH_EXPERIENCE_FABRIC_SCHEMA_V1,
    anchorId: `anc_${Date.now().toString(36)}_${memoryAnchorsV1.length}`,
    atMs: spike.atMs || Date.now(),
    mediaPositionMs: spike.mediaPositionMs ?? null,
    source: spike.source || FABRIC_SOURCE_V1.MIC,
    intent: spike.intent,
    semanticCluster: spike.semanticCluster || spike.preview?.slice(0, 48) || "moment",
    preview: spike.preview ? String(spike.preview).slice(0, 160) : null,
    linkedEventIds: spike.linkedEventIds || []
  });
  memoryAnchorsV1.push(anchor);
  if (memoryAnchorsV1.length > ANCHOR_GRAPH_MAX_V1) memoryAnchorsV1.shift();
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.fabricMemoryAnchors = Object.freeze([...memoryAnchorsV1.slice(-12)]);
  }
  logVoiceInfoV0("FABRIC_MEMORY_ANCHOR", {
    anchorId: anchor.anchorId,
    intent: anchor.intent,
    mediaPositionMs: anchor.mediaPositionMs,
    preview: anchor.preview
  });
  return anchor;
}

/**
 * @param {string} query
 */
export function resolveMemoryRetrievalV1(query) {
  const q = String(query || "").toLowerCase();
  if (!q || memoryAnchorsV1.length === 0) {
    return Object.freeze({ ok: false, reason: "no_anchors" });
  }
  const tokens = q.split(/\s+/).filter(Boolean);
  let best = null;
  let bestScore = 0;
  for (const a of memoryAnchorsV1) {
    const hay = `${a.preview || ""} ${a.semanticCluster || ""}`.toLowerCase();
    const score = tokens.filter((t) => hay.includes(t)).length / Math.max(tokens.length, 1);
    if (score > bestScore) {
      bestScore = score;
      best = a;
    }
  }
  if (!best || bestScore < 0.2) {
    return Object.freeze({ ok: false, reason: "no_match", anchor: null });
  }
  return Object.freeze({
    ok: true,
    anchor: best,
    score: Number(bestScore.toFixed(3)),
    replayHintMs: best.mediaPositionMs
  });
}

/**
 * Media sync scaffold — YouTube + local player playback head.
 * @param {object} sync
 */
export function registerMediaSyncV1(sync = {}) {
  const source = mapToFabricSourceV1(sync.source || FABRIC_SOURCE_V1.MEDIA);
  mediaSyncV1[source] = Object.freeze({
    source,
    positionMs: Number.isFinite(Number(sync.positionMs)) ? Number(sync.positionMs) : 0,
    durationMs: Number.isFinite(Number(sync.durationMs)) ? Number(sync.durationMs) : null,
    playing: sync.playing !== false,
    atMs: Date.now()
  });
  ingestFabricEventV1({
    source,
    kind: "media_sync",
    mediaPositionMs: mediaSyncV1[source].positionMs,
    salienceHint: SOURCE_SALIENCE_V1[source] * 0.4,
    preview: `sync@${mediaSyncV1[source].positionMs}ms`
  });
  return mediaSyncV1[source];
}

/**
 * Spike Engine — single brain for cross-modal fusion.
 * @param {object} input
 */
export function runSpikeEngineV1(input = {}) {
  const source = mapToFabricSourceV1(input.source);
  const text = String(input.text || input.preview || "").trim();
  const atMs = Date.now();

  const event = ingestFabricEventV1({
    ...input,
    source,
    text,
    preview: text || input.preview,
    userInitiated: input.userAction || source === FABRIC_SOURCE_V1.MIC
  });

  const fieldSignals = classifyExperienceAttentionSignalsV1({
    ...input,
    source: input.source || source,
    text
  });

  const speechSpike =
    text && (source === FABRIC_SOURCE_V1.MIC || text.length > 0)
      ? evaluateStreamingAttentionSpikeV0({
          text,
          confidence: input.confidence,
          band: input.band
        })
      : null;

  let intent = classifySpikeIntentV1(text);
  if (speechSpike?.kind === "emergency") {
    intent = Object.freeze({
      intent: FABRIC_SPIKE_INTENT_V1.EMERGENCY,
      score: 0.95,
      reason: "speech_emergency"
    });
  }

  const attentionField = computeAttentionFieldV1(atMs);
  const userPriority = attentionField.userStreamPriority;
  const relevance = clamp01V1(
    intent.score * 0.55 +
      (speechSpike?.score || 0) * 0.35 +
      userPriority * 0.15 +
      event.salience_hint * 0.1
  );

  const respond =
    intent.intent === FABRIC_SPIKE_INTENT_V1.EMERGENCY ||
    speechSpike?.respond === true ||
    (intent.intent !== FABRIC_SPIKE_INTENT_V1.NONE && relevance >= 0.48);

  const mediaPositionMs = Number.isFinite(Number(input.mediaPositionMs))
    ? Number(input.mediaPositionMs)
    : event.signal.mediaPositionMs ?? resolveActiveMediaPositionMsV1();

  const spike = Object.freeze({
    schema: RHIZOH_EXPERIENCE_FABRIC_SCHEMA_V1,
    intent: intent.intent,
    intentScore: Number(intent.score.toFixed(3)),
    relevance: Number(relevance.toFixed(3)),
    respond,
    reason: intent.reason,
    source,
    preview: text.slice(0, 120) || event.signal.preview,
    mediaPositionMs,
    semanticCluster: event.semantic_hint,
    eventId: event.id,
    speechSpike,
    fieldSignals,
    attentionField,
    atMs
  });

  let anchor = null;
  let retrieval = null;
  if (respond) {
    noteCoPresenceSpikeResponseV1({ respond: true, kind: spike.intent, atMs });
    if (
      spike.intent === FABRIC_SPIKE_INTENT_V1.MEMORY_WRITE ||
      spike.intent === FABRIC_SPIKE_INTENT_V1.NOTE_TAKE
    ) {
      anchor = anchorTemporalMemoryV1({
        ...spike,
        linkedEventIds: [event.id]
      });
    }
    if (spike.intent === FABRIC_SPIKE_INTENT_V1.MEMORY_RETRIEVAL) {
      retrieval = resolveMemoryRetrievalV1(text);
    }
    logVoiceInfoV0("FABRIC_SPIKE_ENGINE", {
      intent: spike.intent,
      relevance: spike.relevance,
      respond: spike.respond,
      source: spike.source,
      mediaPositionMs: spike.mediaPositionMs,
      preview: spike.preview
    });
  }

  const result = Object.freeze({
    ...spike,
    anchor,
    retrieval
  });
  publishFabricSnapshotV1(result);
  return result;
}

/**
 * Adapter for voice dual-path router — fabric intent as co-presence spike kind.
 * @param {ReturnType<typeof runSpikeEngineV1>} fabricSpike
 */
export function adaptFabricSpikeForVoicePipelineV1(fabricSpike) {
  const speech = fabricSpike?.speechSpike;
  const kind =
    fabricSpike?.intent && fabricSpike.intent !== FABRIC_SPIKE_INTENT_V1.NONE
      ? fabricSpike.intent
      : speech?.kind || "none";
  return Object.freeze({
    ...(speech || {}),
    kind,
    score: Number(fabricSpike?.relevance ?? speech?.score ?? 0),
    utility: Number(fabricSpike?.relevance ?? speech?.utility ?? 0),
    respond: fabricSpike?.respond === true,
    reason: fabricSpike?.reason || speech?.reason || "fabric",
    preview: fabricSpike?.preview || speech?.preview || null,
    fabric: true,
    fabricIntent: fabricSpike?.intent || FABRIC_SPIKE_INTENT_V1.NONE,
    mediaPositionMs: fabricSpike?.mediaPositionMs ?? null,
    anchor: fabricSpike?.anchor ?? null,
    retrieval: fabricSpike?.retrieval ?? null
  });
}

export function getExperienceFabricSnapshotV1() {
  return Object.freeze({
    schema: RHIZOH_EXPERIENCE_FABRIC_SCHEMA_V1,
    identity: "experience_fabric",
    role: "living_context_interpreter",
    eventStreamCount: eventStreamV1.length,
    anchorCount: memoryAnchorsV1.length,
    attentionField: computeAttentionFieldV1(),
    mediaSync: Object.freeze({ ...mediaSyncV1 }),
    recentEvents: Object.freeze(eventStreamV1.slice(-8)),
    spikeIntents: FABRIC_SPIKE_INTENT_V1,
    sources: FABRIC_SOURCE_V1
  });
}

/** @param {object} [lastSpike] */
function publishFabricSnapshotV1(lastSpike) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.experienceFabric = getExperienceFabricSnapshotV1();
  window.__rhizoh.fabricEventStream = Object.freeze(eventStreamV1.slice(-16));
  window.__rhizoh.fabricAttentionField = computeAttentionFieldV1();
  if (lastSpike) window.__rhizoh.lastFabricSpike = lastSpike;
}

/** @internal vitest */
export function __resetExperienceFabricForTestV1() {
  eventStreamV1.length = 0;
  memoryAnchorsV1.length = 0;
  for (const k of Object.keys(mediaSyncV1)) delete mediaSyncV1[k];
}
