/**
 * Castle Spike Engine v1 — salience collapse function.
 * evaluate(field) → Spike[]; understanding happens here, not in bus or kernel.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1.md
 */

import { clamp01V1 } from "../rhizoh/runtime/rhizohCoPresenceRuntimeV1.js";
import { ATTENTION_EVENT_TYPE_V1 } from "./castleAttentionFieldV1.js";

export const CASTLE_SPIKE_ENGINE_SCHEMA_V1 = "castle.spike_engine.v1";

export const SPIKE_TYPE_V1 = Object.freeze({
  INTENT: "intent",
  EMERGENCY: "emergency",
  ANALYTICAL: "analytical",
  REFERENCE: "reference",
  SOCIAL_CALL: "social_call"
});

const COLLAPSE_MASS_THRESHOLD_V1 = 0.22;
const COLLAPSE_ENTROPY_LIMIT_V1 = 0.72;
const ANALYTICAL_PATTERNS_V1 = [
  /\b(neden|niye|analiz|pozisyon|hamle|why|analyze)\b/i,
  /(açıkla|explain)/i
];
const SOCIAL_CALL_PATTERNS_V1 = [/\b(rhizoh|rizo|rizoh)\b/i];

/** @type {object[]} */
const lastCollapsedSpikesV1 = [];

/**
 * Cluster type entropy — low = coherent collapse candidate.
 * @param {object[]} nodes
 */
function clusterEntropyV1(nodes) {
  if (!nodes.length) return 1;
  /** @type {Record<string, number>} */
  const counts = {};
  for (const n of nodes) {
    counts[n.type] = (counts[n.type] || 0) + 1;
  }
  const total = nodes.length;
  let entropy = 0;
  for (const c of Object.values(counts)) {
    const p = c / total;
    entropy -= p * Math.log2(p);
  }
  const maxEntropy = Math.log2(Math.max(Object.keys(counts).length, 1));
  return maxEntropy > 0 ? entropy / maxEntropy : 0;
}

/**
 * Map graph node type → spike type.
 * @param {object} node
 * @param {string} preview
 */
function resolveSpikeTypeV1(node, preview = "") {
  if (node.type === ATTENTION_EVENT_TYPE_V1.EMERGENCY) return SPIKE_TYPE_V1.EMERGENCY;
  if (node.type === ATTENTION_EVENT_TYPE_V1.REFERENCE) return SPIKE_TYPE_V1.REFERENCE;
  if (SOCIAL_CALL_PATTERNS_V1.some((re) => re.test(preview))) return SPIKE_TYPE_V1.SOCIAL_CALL;
  if (ANALYTICAL_PATTERNS_V1.some((re) => re.test(preview))) return SPIKE_TYPE_V1.ANALYTICAL;
  if (node.type === ATTENTION_EVENT_TYPE_V1.INTENT) return SPIKE_TYPE_V1.INTENT;
  return SPIKE_TYPE_V1.INTENT;
}

/**
 * Collapse rule: cluster.mass > threshold && entropy < limit → emitSpike.
 * @param {object} input
 */
export function evaluateSpikeCollapseV1(input = {}) {
  const graph = input.graph || input.fieldGraph;
  const field = input.field;
  const nowMs = Number(input.atMs) || Date.now();
  const zones = graph?.resonanceZones || field?.resonanceZones || [];
  const nodes = graph?.nodes || [];

  /** @type {object[]} */
  const spikes = [];

  for (const zone of zones) {
    if (zone.mass < COLLAPSE_MASS_THRESHOLD_V1) continue;
    const clusterNodes = nodes.filter((n) => zone.nodeIds.includes(n.id));
    const entropy = clusterEntropyV1(clusterNodes);
    if (entropy > COLLAPSE_ENTROPY_LIMIT_V1) continue;

    const seed = clusterNodes.sort((a, b) => (b.mass ?? b.salience) - (a.mass ?? a.salience))[0];
    if (!seed) continue;

    const preview = seed.signal?.preview || "";
    const spikeType = resolveSpikeTypeV1(seed, preview);
    const salienceScore = Number(
      clamp01V1(Math.max(seed.mass ?? seed.salience, zone.mass * (seed.mass ?? seed.salience))).toFixed(4)
    );

    if (salienceScore < 0.28 && spikeType !== SPIKE_TYPE_V1.EMERGENCY) continue;

    spikes.push(
      Object.freeze({
        schema: CASTLE_SPIKE_ENGINE_SCHEMA_V1,
        type: spikeType,
        salienceScore,
        sourceCluster: Object.freeze({ ...zone }),
        nodeId: seed.id,
        source: seed.source,
        preview,
        mediaPositionMs: seed.signal?.mediaPositionMs ?? null,
        atMs: nowMs
      })
    );
  }

  for (const node of nodes) {
    if (spikes.some((s) => s.nodeId === node.id)) continue;
    const nodeMass = node.mass ?? node.salience ?? 0;
    if (nodeMass < 0.28) continue;
    if (
      node.type === ATTENTION_EVENT_TYPE_V1.EMERGENCY ||
      node.type === ATTENTION_EVENT_TYPE_V1.INTENT
    ) {
      const preview = node.signal?.preview || "";
      spikes.push(
        Object.freeze({
          schema: CASTLE_SPIKE_ENGINE_SCHEMA_V1,
          type: resolveSpikeTypeV1(node, preview),
          salienceScore: Number(clamp01V1(nodeMass).toFixed(4)),
          sourceCluster: null,
          nodeId: node.id,
          source: node.source,
          preview,
          mediaPositionMs: node.signal?.mediaPositionMs ?? null,
          atMs: nowMs
        })
      );
    }
  }

  for (const node of nodes) {
    if (node.type !== ATTENTION_EVENT_TYPE_V1.EMERGENCY) continue;
    if (spikes.some((s) => s.nodeId === node.id)) continue;
    spikes.push(
      Object.freeze({
        schema: CASTLE_SPIKE_ENGINE_SCHEMA_V1,
        type: SPIKE_TYPE_V1.EMERGENCY,
        salienceScore: Number(clamp01V1(node.mass ?? node.salience).toFixed(4)),
        sourceCluster: null,
        nodeId: node.id,
        source: node.source,
        preview: node.signal?.preview || "",
        mediaPositionMs: node.signal?.mediaPositionMs ?? null,
        atMs: nowMs
      })
    );
  }

  spikes.sort((a, b) => b.salienceScore - a.salienceScore);
  lastCollapsedSpikesV1.length = 0;
  lastCollapsedSpikesV1.push(...spikes);

  if (typeof window !== "undefined") {
    window.__castle = window.__castle || {};
    window.__castle.lastSpikeCollapse = Object.freeze([...spikes]);
  }

  return Object.freeze(spikes);
}

export function getLastSpikeCollapseV1() {
  return Object.freeze([...lastCollapsedSpikesV1]);
}

/** @internal vitest */
export function __resetSpikeEngineForTestV1() {
  lastCollapsedSpikesV1.length = 0;
}
