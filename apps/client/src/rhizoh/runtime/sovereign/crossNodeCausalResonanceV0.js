/**
 * Phase 20 — Cross-node causal resonance (observation-only).
 * Kadıköy ↔ Barcelona interference · event bus correlation — no execution.
 */

import { EPISTEMIC_EVENT_CLASS_V0 } from "../epistemicEventBusV0.js";
import { buildShadowCoherenceGraphV0 } from "./shadowCoherenceGraphV0.js";
import {
  buildTemporalInterferenceLayersV0,
  computeTemporalCrossNodeInterferenceV0
} from "./temporalInterferenceLayerV0.js";
import { assessObserverResonanceEntanglementRiskV0 } from "./multiObserverEntanglementGuardV0.js";

export const CROSS_NODE_CAUSAL_RESONANCE_SCHEMA_V0 =
  "castle.rhizoh.cross_node_causal_resonance.v0.20";

const RESONANCE_WINDOW_MS_V0 = 1200;

/**
 * @typedef {Object} CrossNodeResonancePairV0
 * @property {string} from
 * @property {string} to
 * @property {number} interferenceScore
 * @property {number} correlatedEventCount
 * @property {number[]} evidenceSeqs
 * @property {string} patternKind
 * @property {number} instantInterferenceScore
 * @property {number} temporalInterferenceScore
 */

/**
 * @typedef {Object} CrossNodeCausalResonanceReportV0
 * @property {string} schema
 * @property {boolean} executive
 * @property {boolean} witnessWrite
 * @property {boolean} executionWrite
 * @property {number} analyzedAtMs
 * @property {number} traceLength
 * @property {CrossNodeResonancePairV0[]} pairs
 * @property {string|null} dominantPair
 * @property {import('./temporalInterferenceLayerV0.js').NodeTemporalInterferenceLayerV0[]} temporalLayers
 * @property {import('./multiObserverEntanglementGuardV0.js').EntanglementRiskAssessmentV0} entanglementGuard
 */

/**
 * @param {readonly import('../epistemicEventBusV0.js').EpistemicEventEnvelopeV0[]} trace
 * @param {{ correlationWindowMs?: number }} [opts]
 */
export function correlateEventsAcrossNodesV0(trace, opts = {}) {
  const windowMs = Number(opts.correlationWindowMs) || RESONANCE_WINDOW_MS_V0;
  const physics = trace
    .filter((e) => e.eventClass === EPISTEMIC_EVENT_CLASS_V0.PHYSICS)
    .sort((a, b) => a.atMs - b.atMs);

  /** @type {CrossNodeResonancePairV0[]} */
  const pairs = [];
  const graph = buildShadowCoherenceGraphV0();

  for (const edge of graph.edges) {
    const nodeA = edge.from;
    const nodeB = edge.to;
    const eventsA = physics.filter((e) => e.nodeId === nodeA || e.focusNodeId === nodeA);
    const eventsB = physics.filter((e) => e.nodeId === nodeB || e.focusNodeId === nodeB);
    /** @type {number[]} */
    const evidence = [];
    let hits = 0;

    for (const ea of eventsA) {
      for (const eb of eventsB) {
        const delta = Math.abs(ea.atMs - eb.atMs);
        if (delta <= windowMs) {
          hits += 1;
          evidence.push(ea.seq, eb.seq);
        }
      }
    }

    const instantScore = Math.min(1, hits * 0.12 + edge.shadowCoherence * 0.35);

    pairs.push({
      from: nodeA,
      to: nodeB,
      interferenceScore: Number(instantScore.toFixed(4)),
      instantInterferenceScore: Number(instantScore.toFixed(4)),
      temporalInterferenceScore: 0,
      correlatedEventCount: hits,
      evidenceSeqs: [...new Set(evidence)].slice(0, 16),
      patternKind:
        edge.edgeClass === "mediterranean_shadow_link"
          ? "mediterranean_interference"
          : "shadow_coherence_resonance"
    });
  }

  return pairs.sort((a, b) => b.interferenceScore - a.interferenceScore);
}

/**
 * Merge instant resonance with full tick-history temporal layers.
 *
 * @param {CrossNodeResonancePairV0[]} pairs
 * @param {import('./temporalInterferenceLayerV0.js').NodeTemporalInterferenceLayerV0[]} temporalLayers
 */
export function applyTemporalInterferenceToPairsV0(pairs, temporalLayers) {
  return pairs.map((p) => {
    const temporal = computeTemporalCrossNodeInterferenceV0(
      temporalLayers,
      p.from,
      p.to
    );
    const merged = Math.min(1, p.instantInterferenceScore * 0.45 + temporal * 0.55);
    return {
      ...p,
      temporalInterferenceScore: temporal,
      interferenceScore: Number(merged.toFixed(4)),
      patternKind:
        temporal > p.instantInterferenceScore
          ? "temporal_history_interference"
          : p.patternKind
    };
  }).sort((a, b) => b.interferenceScore - a.interferenceScore);
}

/**
 * @param {readonly import('../epistemicEventBusV0.js').EpistemicEventEnvelopeV0[]} trace
 */
export function analyzeCrossNodeCausalResonanceV0(trace) {
  const temporalLayers = buildTemporalInterferenceLayersV0(trace);
  let pairs = correlateEventsAcrossNodesV0(trace);
  pairs = applyTemporalInterferenceToPairsV0(pairs, temporalLayers);
  const entanglementGuard = assessObserverResonanceEntanglementRiskV0({
    trace,
    resonanceReport: { pairs }
  });
  const report = Object.freeze({
    schema: CROSS_NODE_CAUSAL_RESONANCE_SCHEMA_V0,
    executive: false,
    witnessWrite: false,
    executionWrite: false,
    analyzedAtMs: Date.now(),
    traceLength: trace.length,
    pairs,
    temporalLayers,
    entanglementGuard,
    dominantPair: pairs.length
      ? `${pairs[0].from}↔${pairs[0].to}`
      : null
  });

  if (typeof window !== "undefined") {
    window.__rhizoh_cross_node_resonance = report;
  }
  return report;
}
