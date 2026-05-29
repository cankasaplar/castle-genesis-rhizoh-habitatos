/**
 * Phase 20b — Temporal interference layering (full tick history, not snapshot).
 * Barcelona / Kadıköy history patterns — read-only analysis.
 */

import { EPISTEMIC_EVENT_CLASS_V0 } from "../epistemicEventBusV0.js";

export const TEMPORAL_INTERFERENCE_LAYER_SCHEMA_V0 =
  "castle.rhizoh.temporal_interference_layer.v0.20b";

const FRAME_BUCKET_SIZE_V0 = 5;

/**
 * @typedef {Object} TemporalInterferenceBucketV0
 * @property {number} frameStart
 * @property {number} frameEnd
 * @property {number} eventCount
 * @property {number} meanSeverity
 */

/**
 * @typedef {Object} NodeTemporalInterferenceLayerV0
 * @property {string} nodeId
 * @property {TemporalInterferenceBucketV0[]} historyPattern
 * @property {number} cumulativeIntensity
 * @property {number} tickSpan
 * @property {boolean} isHistoryNotSnapshot
 */

/**
 * @param {readonly import('../epistemicEventBusV0.js').EpistemicEventEnvelopeV0[]} trace
 */
export function buildTemporalInterferenceLayersV0(trace) {
  const physics = trace
    .filter((e) => e.eventClass === EPISTEMIC_EVENT_CLASS_V0.PHYSICS)
    .sort((a, b) => a.atFrame - b.atFrame || a.seq - b.seq);

  /** @type {Set<string>} */
  const nodeIds = new Set();
  for (const e of physics) {
    nodeIds.add(e.nodeId);
    if (e.focusNodeId) nodeIds.add(String(e.focusNodeId));
  }

  /** @type {NodeTemporalInterferenceLayerV0[]} */
  const layers = [];

  for (const nodeId of nodeIds) {
    const events = physics.filter(
      (e) => e.nodeId === nodeId || e.focusNodeId === nodeId
    );
    if (!events.length) continue;

    const minFrame = events[0].atFrame;
    const maxFrame = events[events.length - 1].atFrame;
    /** @type {Map<number, { count: number, severitySum: number }>} */
    const buckets = new Map();

    for (const e of events) {
      const bucketKey =
        Math.floor(e.atFrame / FRAME_BUCKET_SIZE_V0) * FRAME_BUCKET_SIZE_V0;
      const b = buckets.get(bucketKey) || { count: 0, severitySum: 0 };
      b.count += 1;
      b.severitySum += Number(e.severity) || 0;
      buckets.set(bucketKey, b);
    }

    const historyPattern = [...buckets.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([frameStart, b]) => ({
        frameStart,
        frameEnd: frameStart + FRAME_BUCKET_SIZE_V0 - 1,
        eventCount: b.count,
        meanSeverity: Number((b.severitySum / b.count).toFixed(4))
      }));

    const cumulativeIntensity = Number(
      Math.min(
        1,
        historyPattern.reduce(
          (s, h) => s + h.eventCount * 0.08 + h.meanSeverity * 0.15,
          0
        )
      ).toFixed(4)
    );

    layers.push({
      nodeId,
      historyPattern,
      cumulativeIntensity,
      tickSpan: maxFrame - minFrame,
      isHistoryNotSnapshot: true
    });
  }

  return layers.sort((a, b) => b.cumulativeIntensity - a.cumulativeIntensity);
}

/**
 * Cross-node temporal interference: history overlap intensity (not instant window only).
 *
 * @param {NodeTemporalInterferenceLayerV0[]} layers
 * @param {string} nodeA
 * @param {string} nodeB
 */
export function computeTemporalCrossNodeInterferenceV0(layers, nodeA, nodeB) {
  const la = layers.find((l) => l.nodeId === nodeA);
  const lb = layers.find((l) => l.nodeId === nodeB);
  if (!la || !lb) return 0;

  const frameSetA = new Set(la.historyPattern.map((h) => h.frameStart));
  let overlap = 0;
  for (const h of lb.historyPattern) {
    if (frameSetA.has(h.frameStart)) overlap += 1;
  }

  return Number(
    Math.min(
      1,
      overlap * 0.1 + la.cumulativeIntensity * 0.25 + lb.cumulativeIntensity * 0.25
    ).toFixed(4)
  );
}

/**
 * @param {NodeTemporalInterferenceLayerV0[]} layers
 * @param {string} nodeId
 */
export function getTemporalLayerForNodeV0(layers, nodeId) {
  return layers.find((l) => l.nodeId === nodeId) ?? null;
}
