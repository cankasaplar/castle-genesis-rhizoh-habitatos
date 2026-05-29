/**
 * Phase 19 — Shadow coherence graph (non-executive edges).
 */

import { listSatelliteNodesV0 } from "./satelliteNodeRegistryV0.js";

export const SHADOW_COHERENCE_GRAPH_SCHEMA_V0 =
  "castle.rhizoh.shadow_coherence_graph.v0.19";

/**
 * @typedef {Object} ShadowCoherenceEdgeV0
 * @property {string} from
 * @property {string} to
 * @property {number} shadowCoherence
 * @property {boolean} executive
 * @property {string} edgeClass
 */

/**
 * Haversine km (approx).
 */
function distanceKmV0(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/**
 * @param {readonly import('./satelliteNodeRegistryV0.js').SatelliteNodeRecordV0[]} nodes
 * @returns {ShadowCoherenceEdgeV0[]}
 */
export function buildShadowCoherenceEdgesV0(nodes) {
  const edges = [];
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      const km = distanceKmV0(a.anchor, b.anchor);
      const shadowCoherence = Math.max(0.15, Math.min(0.98, 1 - km / 12000));
      const isMediterraneanPair =
        (a.nodeId.includes("kadikoy") && b.nodeId.includes("barcelona")) ||
        (a.nodeId.includes("barcelona") && b.nodeId.includes("kadikoy"));

      edges.push(
        Object.freeze({
          from: a.nodeId,
          to: b.nodeId,
          shadowCoherence: isMediterraneanPair
            ? Number(Math.min(0.92, shadowCoherence + 0.12).toFixed(4))
            : Number(shadowCoherence.toFixed(4)),
          executive: false,
          edgeClass: isMediterraneanPair ? "mediterranean_shadow_link" : "shadow_coherence"
        })
      );
    }
  }
  return edges;
}

/**
 * @returns {{ schema: string, nodes: object[], edges: ShadowCoherenceEdgeV0[], executive: boolean }}
 */
export function buildShadowCoherenceGraphV0() {
  const nodes = listSatelliteNodesV0();
  const edges = buildShadowCoherenceEdgesV0(nodes);
  const graph = Object.freeze({
    schema: SHADOW_COHERENCE_GRAPH_SCHEMA_V0,
    nodes: nodes.map((n) => ({
      nodeId: n.nodeId,
      zone: n.zone,
      localPrimary: n.localPrimary,
      anchor: n.anchor
    })),
    edges,
    executive: false
  });

  if (typeof window !== "undefined") {
    window.__rhizoh_shadow_coherence_graph = graph;
  }
  return graph;
}
