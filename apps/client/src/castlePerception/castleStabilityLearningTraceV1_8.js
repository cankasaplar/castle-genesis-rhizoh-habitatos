/**
 * Castle Stability Learning Trace v1.8 — every learning action is observable.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_8.md
 */

export const CASTLE_STABILITY_LEARNING_TRACE_SCHEMA_V1_8 = "castle.stability_learning_trace.v1.8";

export const LEARNING_TRACE_KIND_V1_8 = Object.freeze({
  MEMORY_OBSERVE: "memory_observe",
  IMPLICIT_BIAS: "implicit_bias",
  DECAY: "decay",
  RENORMALIZE: "renormalize",
  PERSIST: "persist",
  SYNC_EXPORT: "sync_export",
  SYNC_IMPORT: "sync_import",
  PRIOR_APPLIED: "prior_applied"
});

const TRACE_RING_MAX_V1_8 = 64;

/** @type {Map<string, object[]>} */
const learningTraceRingV1_8 = new Map();

let traceCounterV1_8 = 0;

function nextTraceIdV1_8() {
  traceCounterV1_8 += 1;
  return `learn_trace_${traceCounterV1_8}`;
}

function pushTraceV1_8(ownerId, entry) {
  const key = String(ownerId);
  if (!learningTraceRingV1_8.has(key)) learningTraceRingV1_8.set(key, []);
  const ring = learningTraceRingV1_8.get(key);
  ring.push(entry);
  while (ring.length > TRACE_RING_MAX_V1_8) ring.shift();
}

export function appendLearningTraceV1_8(ownerId, input = {}) {
  const entry = Object.freeze({
    schema: CASTLE_STABILITY_LEARNING_TRACE_SCHEMA_V1_8,
    traceId: nextTraceIdV1_8(),
    atMs: Number(input.atMs) || Date.now(),
    ownerId: String(ownerId),
    kind: input.kind || LEARNING_TRACE_KIND_V1_8.MEMORY_OBSERVE,
    reason: String(input.reason || "stability_learning"),
    modality: input.modality || null,
    timeBucket: input.timeBucket || null,
    source: input.source || "system",
    deltas: Object.freeze(input.deltas || {}),
    attributableTo: "system_learning_v1_8",
    humanVisible: true,
    correlationId: input.correlationId || null
  });
  pushTraceV1_8(ownerId, entry);
  return entry;
}

export function getLearningTraceV1_8(ownerId, limit = 16) {
  const ring = learningTraceRingV1_8.get(String(ownerId)) || [];
  return Object.freeze({
    schema: CASTLE_STABILITY_LEARNING_TRACE_SCHEMA_V1_8,
    ownerId: String(ownerId),
    entries: Object.freeze(ring.slice(-limit).map((e) => e)),
    totalCount: ring.length
  });
}

export function getLastLearningTraceV1_8(ownerId) {
  const ring = learningTraceRingV1_8.get(String(ownerId)) || [];
  return ring.length ? ring[ring.length - 1] : null;
}

/** @internal vitest */
export function __resetStabilityLearningTraceForTestV1_8() {
  learningTraceRingV1_8.clear();
  traceCounterV1_8 = 0;
}
