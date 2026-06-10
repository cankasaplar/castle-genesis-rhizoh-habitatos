/**
 * Castle Attention Field v1 — Dynamic Weighted Reality Graph (RTAOS core).
 * Event = reality node, not input. Field tick = deterministic graph update.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1.md
 */

import { clamp01V1 } from "../rhizoh/runtime/rhizohCoPresenceRuntimeV1.js";

export const CASTLE_ATTENTION_FIELD_SCHEMA_V1 = "castle.attention_field.v1";
export const CASTLE_ATTENTION_FIELD_GRAPH_SCHEMA_V1 = "castle.attention_field.graph.v1";

export const ATTENTION_EVENT_SOURCE_V1 = Object.freeze({
  MIC: "mic",
  TV: "tv",
  YOUTUBE: "youtube",
  CAMERA: "camera",
  FILE: "file",
  WEB: "web",
  MEDIA: "media",
  SYSTEM: "system",
  ARCHIVE: "archive",
  CHAT: "chat",
  ACTION: "action",
  OTHER_AGENT: "other_agent"
});

export const ATTENTION_EVENT_TYPE_V1 = Object.freeze({
  NOISE: "noise",
  NARRATIVE: "narrative",
  REFERENCE: "reference",
  INTENT: "intent",
  EMERGENCY: "emergency"
});

export const ATTENTION_TEMPORAL_SPAN_V1 = Object.freeze({
  INSTANT: "instant",
  SHORT: "short",
  LONG: "long"
});

/** Equal-weight reality signals — no source is primary. */
export const SOURCE_WEIGHT_V1 = Object.freeze({
  [ATTENTION_EVENT_SOURCE_V1.MIC]: 1,
  [ATTENTION_EVENT_SOURCE_V1.TV]: 1,
  [ATTENTION_EVENT_SOURCE_V1.YOUTUBE]: 1,
  [ATTENTION_EVENT_SOURCE_V1.CAMERA]: 1,
  [ATTENTION_EVENT_SOURCE_V1.FILE]: 1,
  [ATTENTION_EVENT_SOURCE_V1.WEB]: 1,
  [ATTENTION_EVENT_SOURCE_V1.MEDIA]: 1,
  [ATTENTION_EVENT_SOURCE_V1.SYSTEM]: 1,
  [ATTENTION_EVENT_SOURCE_V1.ARCHIVE]: 1,
  [ATTENTION_EVENT_SOURCE_V1.CHAT]: 1,
  [ATTENTION_EVENT_SOURCE_V1.ACTION]: 1,
  [ATTENTION_EVENT_SOURCE_V1.OTHER_AGENT]: 1
});

const DECAY_LAMBDA_V1 = 1 / 90_000;

export const CONTEXTUAL_RELATION_V1 = Object.freeze({
  TEMPORAL_ADJACENT: "temporal_adjacent",
  SAME_SOURCE: "same_source",
  REFERENCE_ANCHOR: "reference_anchor",
  INTENT_ON_NARRATIVE: "intent_on_narrative",
  CROSS_MODAL: "cross_modal"
});

export const FIELD_DECAY_FUNCTION_V1 = "temporal+salience";

const SOURCE_MAP_V1 = Object.freeze({
  mic: ATTENTION_EVENT_SOURCE_V1.MIC,
  tv: ATTENTION_EVENT_SOURCE_V1.TV,
  youtube: ATTENTION_EVENT_SOURCE_V1.YOUTUBE,
  youtube_audio: ATTENTION_EVENT_SOURCE_V1.YOUTUBE,
  camera: ATTENTION_EVENT_SOURCE_V1.CAMERA,
  camera_context: ATTENTION_EVENT_SOURCE_V1.CAMERA,
  file: ATTENTION_EVENT_SOURCE_V1.FILE,
  file_stream: ATTENTION_EVENT_SOURCE_V1.FILE,
  filesystem: ATTENTION_EVENT_SOURCE_V1.FILE,
  web: ATTENTION_EVENT_SOURCE_V1.WEB,
  media: ATTENTION_EVENT_SOURCE_V1.MEDIA,
  media_player: ATTENTION_EVENT_SOURCE_V1.MEDIA,
  mediaplayer: ATTENTION_EVENT_SOURCE_V1.MEDIA,
  system: ATTENTION_EVENT_SOURCE_V1.SYSTEM,
  system_audio: ATTENTION_EVENT_SOURCE_V1.SYSTEM,
  archive: ATTENTION_EVENT_SOURCE_V1.ARCHIVE,
  memory_clip: ATTENTION_EVENT_SOURCE_V1.ARCHIVE,
  chat: ATTENTION_EVENT_SOURCE_V1.CHAT,
  action: ATTENTION_EVENT_SOURCE_V1.ACTION,
  user_action: ATTENTION_EVENT_SOURCE_V1.ACTION,
  other_agent: ATTENTION_EVENT_SOURCE_V1.OTHER_AGENT,
  otheragent: ATTENTION_EVENT_SOURCE_V1.OTHER_AGENT,
  otheragents: ATTENTION_EVENT_SOURCE_V1.OTHER_AGENT
});

const TYPE_SALIENCE_PRIOR_V1 = Object.freeze({
  [ATTENTION_EVENT_TYPE_V1.NOISE]: 0.12,
  [ATTENTION_EVENT_TYPE_V1.NARRATIVE]: 0.38,
  [ATTENTION_EVENT_TYPE_V1.REFERENCE]: 0.52,
  [ATTENTION_EVENT_TYPE_V1.INTENT]: 0.82,
  [ATTENTION_EVENT_TYPE_V1.EMERGENCY]: 0.95
});

const SPAN_HALF_LIFE_MS_V1 = Object.freeze({
  [ATTENTION_TEMPORAL_SPAN_V1.INSTANT]: 8_000,
  [ATTENTION_TEMPORAL_SPAN_V1.SHORT]: 45_000,
  [ATTENTION_TEMPORAL_SPAN_V1.LONG]: 600_000
});

const NARRATIVE_SOURCES_V1 = new Set([
  ATTENTION_EVENT_SOURCE_V1.TV,
  ATTENTION_EVENT_SOURCE_V1.YOUTUBE,
  ATTENTION_EVENT_SOURCE_V1.MEDIA,
  ATTENTION_EVENT_SOURCE_V1.FILE,
  ATTENTION_EVENT_SOURCE_V1.SYSTEM
]);

const INTENT_PATTERNS_V1 = [
  /\?/,
  /\b(rhizoh|rizo|rizoh)\b/i,
  /(not\s+al|hatırla|açıkla|anlat|explain|remember|what\s+was)/i,
  /\b(neden|niye|why|how)\b/i
];

const EMERGENCY_PATTERNS_V1 = [
  /\b(yard[iı]m|imdat|acil|help|emergency|mayday)\b/i
];

const GRAPH_NODE_MAX_V1 = 200;
const GRAPH_EDGE_MAX_V1 = 400;
const FIELD_WINDOW_MS_V1 = 90_000;
const RESONANCE_WINDOW_MS_V1 = 15_000;

/** @type {Map<string, object>} */
const graphNodesV1 = new Map();
/** @type {object[]} */
const graphEdgesV1 = [];
/** @type {object[]} */
const ingestQueueV1 = [];
/** @type {object | null} */
let activeRoomV1 = null;
let tickCounterV1 = 0;
/** @type {object | null} */
let frozenGraphSnapshotV1 = null;

/**
 * @param {string} raw
 */
export function mapAttentionSourceV1(raw) {
  const key = String(raw || ATTENTION_EVENT_SOURCE_V1.MIC).toLowerCase();
  return SOURCE_MAP_V1[key] || ATTENTION_EVENT_SOURCE_V1.MIC;
}

/**
 * Lightweight content vector (v1 — not full embedding).
 * @param {string} text
 */
export function buildContentVectorV1(text) {
  return Object.freeze(
    String(text || "")
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 8)
  );
}

/**
 * @param {object} raw
 */
export function classifyAttentionEventTypeV1(raw = {}) {
  const text = String(raw.text || raw.preview || raw.rawReference?.preview || "").trim();
  const source = mapAttentionSourceV1(raw.source);
  const userInitiated = raw.userInitiated === true || source === ATTENTION_EVENT_SOURCE_V1.MIC;

  if (text && EMERGENCY_PATTERNS_V1.some((re) => re.test(text))) {
    return Object.freeze({
      type: ATTENTION_EVENT_TYPE_V1.EMERGENCY,
      salience: TYPE_SALIENCE_PRIOR_V1[ATTENTION_EVENT_TYPE_V1.EMERGENCY],
      temporalSpan: ATTENTION_TEMPORAL_SPAN_V1.INSTANT,
      reason: "emergency_lexicon"
    });
  }

  if (userInitiated && text && INTENT_PATTERNS_V1.some((re) => re.test(text))) {
    return Object.freeze({
      type: ATTENTION_EVENT_TYPE_V1.INTENT,
      salience: TYPE_SALIENCE_PRIOR_V1[ATTENTION_EVENT_TYPE_V1.INTENT],
      temporalSpan: ATTENTION_TEMPORAL_SPAN_V1.INSTANT,
      reason: "intent_spike"
    });
  }

  if (
    raw.reference === true ||
    raw.userAction === "pause" ||
    raw.userAction === "seek" ||
    raw.userAction === "highlight"
  ) {
    return Object.freeze({
      type: ATTENTION_EVENT_TYPE_V1.REFERENCE,
      salience: TYPE_SALIENCE_PRIOR_V1[ATTENTION_EVENT_TYPE_V1.REFERENCE],
      temporalSpan: ATTENTION_TEMPORAL_SPAN_V1.SHORT,
      reason: "shared_reference_moment"
    });
  }

  if (NARRATIVE_SOURCES_V1.has(source)) {
    const span =
      source === ATTENTION_EVENT_SOURCE_V1.FILE
        ? ATTENTION_TEMPORAL_SPAN_V1.LONG
        : ATTENTION_TEMPORAL_SPAN_V1.SHORT;
    return Object.freeze({
      type: ATTENTION_EVENT_TYPE_V1.NARRATIVE,
      salience: TYPE_SALIENCE_PRIOR_V1[ATTENTION_EVENT_TYPE_V1.NARRATIVE],
      temporalSpan: span,
      reason: "background_narrative_stream"
    });
  }

  return Object.freeze({
    type: ATTENTION_EVENT_TYPE_V1.NOISE,
    salience: TYPE_SALIENCE_PRIOR_V1[ATTENTION_EVENT_TYPE_V1.NOISE],
    temporalSpan: ATTENTION_TEMPORAL_SPAN_V1.INSTANT,
    reason: "ambient_context"
  });
}

/**
 * Reality node from normalized ingress.
 * @param {object} raw
 */
export function createRealityNodeV1(raw = {}) {
  const source = mapAttentionSourceV1(raw.source);
  const classification = classifyAttentionEventTypeV1({ ...raw, source });
  const preview = raw.preview
    ? String(raw.preview).slice(0, 160)
    : raw.text
      ? String(raw.text).slice(0, 160)
      : raw.rawReference?.preview
        ? String(raw.rawReference.preview).slice(0, 160)
        : null;
  const timestamp = Number(raw.atMs || raw.timestamp) || Date.now();
  const baseSalience = clamp01V1(
    Number(raw.salience) ||
      classification.salience * (raw.userInitiated ? 1.1 : 1) * (Number(raw.confidence) || 1)
  );

  return {
    schema: CASTLE_ATTENTION_FIELD_GRAPH_SCHEMA_V1,
    id: raw.id || raw.nodeId || `node_${timestamp.toString(36)}_${graphNodesV1.size}`,
    source,
    type: classification.type,
    salience: Number(baseSalience.toFixed(4)),
    baseSalience: Number(baseSalience.toFixed(4)),
    mass: Number(baseSalience.toFixed(4)),
    sourceWeight: SOURCE_WEIGHT_V1[source] ?? 1,
    temporalSpan: raw.temporalSpan || classification.temporalSpan,
    contentVector: raw.contentVector || buildContentVectorV1(preview || raw.text),
    timestamp,
    signal: {
      preview,
      mediaPositionMs: Number.isFinite(Number(raw.mediaPositionMs))
        ? Number(raw.mediaPositionMs)
        : raw.spatialContext?.mediaPositionMs ?? null,
      confidence: Number.isFinite(Number(raw.confidence)) ? Number(raw.confidence) : null
    },
    reason: classification.reason,
    active: true,
    tickBorn: tickCounterV1
  };
}

/** @param {object} raw */
export function normalizeAttentionEventV1(raw = {}) {
  const node = createRealityNodeV1(raw);
  return Object.freeze({
    schema: CASTLE_ATTENTION_FIELD_SCHEMA_V1,
    id: node.id,
    source: node.source,
    type: node.type,
    salience: node.salience,
    temporalSpan: node.temporalSpan,
    contentVector: node.contentVector,
    signal: Object.freeze({ ...node.signal, raw: raw.text ?? previewOrNull(node) }),
    timestamp: node.timestamp,
    reason: node.reason
  });
}

function previewOrNull(node) {
  return node.signal?.preview ?? null;
}

export function buildCastleRoomV1(input = {}) {
  const roomId = String(input.roomId || "local_room").trim();
  const participants = Array.isArray(input.participants)
    ? Object.freeze(input.participants.map((p) => String(p)))
    : Object.freeze(["user_local", "rhizoh_local"]);

  return Object.freeze({
    schema: "castle.room.v1",
    roomId,
    participants,
    streams: Object.freeze({
      mic: input.streams?.mic ?? [],
      video: input.streams?.video ?? [],
      media: input.streams?.media ?? [],
      docs: input.streams?.docs ?? [],
      system: input.streams?.system ?? []
    }),
    atMs: Date.now()
  });
}

export function setCastleRoomV1(room) {
  activeRoomV1 = buildCastleRoomV1(room);
  publishAttentionFieldSnapshotV1();
  return activeRoomV1;
}

/**
 * Queue reality node for next tick (deterministic batch ingest).
 * @param {object} raw
 */
export function queueRealityNodeV1(raw = {}) {
  ingestQueueV1.push(createRealityNodeV1(raw));
  return ingestQueueV1.length;
}

/** @deprecated alias — queues + ticks immediately */
export function ingestAttentionEventV1(raw = {}) {
  queueRealityNodeV1(raw);
  tickAttentionFieldV1();
  const nodes = [...graphNodesV1.values()];
  return normalizeAttentionEventV1(nodes[nodes.length - 1] || raw);
}

function temporalDecayV1(ageMs, span) {
  const halfLife = SPAN_HALF_LIFE_MS_V1[span] || SPAN_HALF_LIFE_MS_V1[ATTENTION_TEMPORAL_SPAN_V1.SHORT];
  const decay = Math.exp(-ageMs / halfLife);
  return clamp01V1(decay);
}

function ingestEventsV1() {
  while (ingestQueueV1.length) {
    const node = ingestQueueV1.shift();
    graphNodesV1.set(node.id, node);
    linkContextualRelationsV1(node);
    if (graphNodesV1.size > GRAPH_NODE_MAX_V1) {
      const oldest = [...graphNodesV1.values()].sort((a, b) => a.timestamp - b.timestamp)[0];
      if (oldest) graphNodesV1.delete(oldest.id);
    }
  }
}

function linkContextualRelationsV1(node) {
  const recent = [...graphNodesV1.values()].filter(
    (n) => n.id !== node.id && n.active && node.timestamp - n.timestamp <= FIELD_WINDOW_MS_V1
  );

  for (const other of recent) {
    if (other.source === node.source && node.timestamp - other.timestamp <= 30_000) {
      pushEdgeV1(node.id, other.id, CONTEXTUAL_RELATION_V1.SAME_SOURCE, 0.42);
      pushEdgeV1(node.id, other.id, CONTEXTUAL_RELATION_V1.TEMPORAL_ADJACENT, 0.35);
    }

    if (
      (node.type === ATTENTION_EVENT_TYPE_V1.INTENT || node.type === ATTENTION_EVENT_TYPE_V1.EMERGENCY) &&
      (other.type === ATTENTION_EVENT_TYPE_V1.NARRATIVE || other.type === ATTENTION_EVENT_TYPE_V1.REFERENCE) &&
      node.timestamp - other.timestamp <= FIELD_WINDOW_MS_V1
    ) {
      pushEdgeV1(node.id, other.id, CONTEXTUAL_RELATION_V1.INTENT_ON_NARRATIVE, 0.68);
    }

    const posA = node.signal.mediaPositionMs;
    const posB = other.signal.mediaPositionMs;
    if (
      Number.isFinite(posA) &&
      Number.isFinite(posB) &&
      node.source !== other.source &&
      Math.abs(posA - posB) <= 3000
    ) {
      pushEdgeV1(node.id, other.id, CONTEXTUAL_RELATION_V1.CROSS_MODAL, 0.72);
    }

    if (node.type === ATTENTION_EVENT_TYPE_V1.REFERENCE && other.type === ATTENTION_EVENT_TYPE_V1.NARRATIVE) {
      pushEdgeV1(node.id, other.id, CONTEXTUAL_RELATION_V1.REFERENCE_ANCHOR, 0.58);
    }
  }
}

function pushEdgeV1(fromId, toId, relation, weight) {
  const key = `${fromId}|${toId}|${relation}`;
  if (graphEdgesV1.some((e) => e.key === key)) return;
  graphEdgesV1.push({ key, fromId, toId, relation, weight: Number(weight.toFixed(3)) });
  if (graphEdgesV1.length > GRAPH_EDGE_MAX_V1) graphEdgesV1.shift();
}

function updateNodeMassV1(nowMs) {
  for (const node of graphNodesV1.values()) {
    if (!node.active) continue;
    const ageMs = nowMs - node.timestamp;
    const recency = Math.exp(-DECAY_LAMBDA_V1 * ageMs);
    const spanDecay = temporalDecayV1(ageMs, node.temporalSpan);
    const sourceWeight = node.sourceWeight ?? SOURCE_WEIGHT_V1[node.source] ?? 1;
    let edgeBoost = 0;

    for (const edge of graphEdgesV1) {
      if (edge.toId !== node.id) continue;
      const parent = graphNodesV1.get(edge.fromId);
      if (!parent?.active) continue;
      edgeBoost += (parent.mass ?? parent.salience) * edge.weight * 0.12;
    }

    node.mass = Number(
      clamp01V1(node.baseSalience * recency * spanDecay * sourceWeight + edgeBoost).toFixed(4)
    );
    node.salience = node.mass;
  }
}

function computeEdgesV1() {
  const nodes = [...graphNodesV1.values()].filter((n) => n.active);
  for (const node of nodes.slice(-8)) {
    linkContextualRelationsV1(node);
  }
}

function decayOldNodesV1(nowMs) {
  for (const node of graphNodesV1.values()) {
    const ageMs = nowMs - node.timestamp;
    const maxAge =
      node.temporalSpan === ATTENTION_TEMPORAL_SPAN_V1.LONG
        ? 600_000
        : node.temporalSpan === ATTENTION_TEMPORAL_SPAN_V1.SHORT
          ? 180_000
          : 60_000;
    if (ageMs > maxAge || (node.mass ?? node.salience) < 0.04) {
      node.active = false;
    }
  }
}

function computeResonanceZonesV1(nowMs) {
  const active = [...graphNodesV1.values()].filter((n) => n.active && nowMs - n.timestamp <= FIELD_WINDOW_MS_V1);
  /** @type {object[]} */
  const zones = [];
  const visited = new Set();

  for (const seed of active) {
    if (visited.has(seed.id)) continue;
    const cluster = collectClusterV1(seed, active, nowMs);
    cluster.nodeIds.forEach((id) => visited.add(id));
    if (cluster.mass >= 0.18) zones.push(cluster);
  }

  return zones.sort((a, b) => b.mass - a.mass).slice(0, 8);
}

function collectClusterV1(seed, active, nowMs) {
  /** @type {string[]} */
  const nodeIds = [seed.id];
  let mass = seed.mass ?? seed.salience;

  for (const other of active) {
    if (other.id === seed.id) continue;
    if (Math.abs(other.timestamp - seed.timestamp) > RESONANCE_WINDOW_MS_V1) continue;
    const linked = graphEdgesV1.some(
      (e) =>
        (e.fromId === seed.id && e.toId === other.id) ||
        (e.toId === seed.id && e.fromId === other.id) ||
        (other.source === seed.source && Math.abs(other.timestamp - seed.timestamp) <= 5000)
    );
    if (linked) {
      nodeIds.push(other.id);
      mass += other.mass ?? other.salience;
    }
  }

  const nodes = nodeIds.map((id) => graphNodesV1.get(id)).filter(Boolean);
  const dominantType =
    nodes.sort((a, b) => (b.mass ?? b.salience) - (a.mass ?? a.salience))[0]?.type ||
    ATTENTION_EVENT_TYPE_V1.NOISE;

  return Object.freeze({
    clusterId: `rz_${seed.id}`,
    nodeIds: Object.freeze([...nodeIds]),
    mass: Number(clamp01V1(mass / Math.max(nodeIds.length, 1)).toFixed(4)),
    dominantType,
    centroidSource: seed.source,
    atMs: nowMs
  });
}

/**
 * Field update loop — deterministic graph tick (no spike collapse here).
 * @param {number} [nowMs]
 */
export function tickAttentionFieldV1(nowMs = Date.now()) {
  tickCounterV1 += 1;
  ingestEventsV1();
  updateNodeMassV1(nowMs);
  decayOldNodesV1(nowMs);
  computeEdgesV1();
  const resonanceZones = computeResonanceZonesV1(nowMs);
  const globalMass = Number(
    clamp01V1(
      [...graphNodesV1.values()]
        .filter((n) => n.active && nowMs - n.timestamp <= FIELD_WINDOW_MS_V1)
        .reduce((sum, n) => sum + (n.mass ?? n.salience), 0) / 8
    ).toFixed(4)
  );

  frozenGraphSnapshotV1 = Object.freeze({
    schema: CASTLE_ATTENTION_FIELD_GRAPH_SCHEMA_V1,
    tickId: tickCounterV1,
    tickAtMs: nowMs,
    decayFunction: FIELD_DECAY_FUNCTION_V1,
    globalMass,
    nodes: Object.freeze(
      [...graphNodesV1.values()]
        .filter((n) => n.active)
        .map((n) =>
          Object.freeze({
            id: n.id,
            source: n.source,
            type: n.type,
            salience: n.salience,
            mass: n.mass ?? n.salience,
            sourceWeight: n.sourceWeight,
            temporalSpan: n.temporalSpan,
            contentVector: n.contentVector,
            timestamp: n.timestamp,
            signal: Object.freeze({ ...n.signal })
          })
        )
    ),
    edges: Object.freeze(graphEdgesV1.slice(-64).map((e) => Object.freeze({ ...e }))),
    resonanceZones: Object.freeze(resonanceZones.map((z) => Object.freeze({ ...z }))),
    room: activeRoomV1
  });

  publishAttentionFieldSnapshotV1();
  return frozenGraphSnapshotV1;
}

export function getAttentionFieldGraphV1() {
  return (
    frozenGraphSnapshotV1 ||
    tickAttentionFieldV1()
  );
}

/** Legacy mass summary — derived from graph. */
export function computeCastleAttentionFieldV1(nowMs = Date.now()) {
  const graph = getAttentionFieldGraphV1();
  const recent = graph.nodes.filter((n) => nowMs - n.timestamp <= FIELD_WINDOW_MS_V1);

  /** @type {Record<string, number>} */
  const sourceMass = {};
  /** @type {Record<string, number>} */
  const typeMass = {};
  for (const src of Object.values(ATTENTION_EVENT_SOURCE_V1)) sourceMass[src] = 0;
  for (const typ of Object.values(ATTENTION_EVENT_TYPE_V1)) typeMass[typ] = 0;

  for (const n of recent) {
    sourceMass[n.source] = Number(clamp01V1((sourceMass[n.source] || 0) + n.salience * 0.12).toFixed(3));
    typeMass[n.type] = Number(clamp01V1((typeMass[n.type] || 0) + n.salience * 0.14).toFixed(3));
  }

  const intentMass = typeMass[ATTENTION_EVENT_TYPE_V1.INTENT] + typeMass[ATTENTION_EVENT_TYPE_V1.EMERGENCY];
  const narrativeMass =
    typeMass[ATTENTION_EVENT_TYPE_V1.NARRATIVE] + typeMass[ATTENTION_EVENT_TYPE_V1.REFERENCE];

  return Object.freeze({
    schema: CASTLE_ATTENTION_FIELD_SCHEMA_V1,
    graphTickId: graph.tickId,
    globalMass: graph.globalMass,
    decayFunction: graph.decayFunction,
    windowMs: FIELD_WINDOW_MS_V1,
    eventCount: recent.length,
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    resonanceZoneCount: graph.resonanceZones.length,
    sourceMass: Object.freeze({ ...sourceMass }),
    typeMass: Object.freeze({ ...typeMass }),
    dominantSource:
      Object.entries(sourceMass).sort((a, b) => b[1] - a[1])[0]?.[0] || ATTENTION_EVENT_SOURCE_V1.MIC,
    userStreamPriority:
      sourceMass[ATTENTION_EVENT_SOURCE_V1.MIC] + sourceMass[ATTENTION_EVENT_SOURCE_V1.ACTION],
    narrativeMass,
    intentMass,
    isIntentSpike: intentMass >= 0.35,
    resonanceZones: graph.resonanceZones,
    room: activeRoomV1
  });
}

export function getCastleAttentionFieldSnapshotV1() {
  const graph = getAttentionFieldGraphV1();
  return Object.freeze({
    schema: CASTLE_ATTENTION_FIELD_SCHEMA_V1,
    identity: "dynamic_weighted_reality_graph",
    role: "rtaos_attention_field",
    graph,
    field: computeCastleAttentionFieldV1(),
    sources: ATTENTION_EVENT_SOURCE_V1,
    types: ATTENTION_EVENT_TYPE_V1,
    relations: CONTEXTUAL_RELATION_V1
  });
}

function publishAttentionFieldSnapshotV1() {
  if (typeof window === "undefined") return;
  const snap = getCastleAttentionFieldSnapshotV1();
  window.__castle = window.__castle || {};
  window.__castle.attentionField = snap;
  window.__castle.attentionFieldGraph = snap.graph;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.castleAttentionField = snap;
}

/** @internal vitest */
export function __resetCastleAttentionFieldForTestV1() {
  graphNodesV1.clear();
  graphEdgesV1.length = 0;
  ingestQueueV1.length = 0;
  activeRoomV1 = null;
  tickCounterV1 = 0;
  frozenGraphSnapshotV1 = null;
}
