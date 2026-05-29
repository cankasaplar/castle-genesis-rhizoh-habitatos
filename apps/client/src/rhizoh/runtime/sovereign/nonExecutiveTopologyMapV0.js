/**
 * Phase 19 — Non-executive topology map (observation-only graph view).
 */

import { buildShadowCoherenceGraphV0 } from "./shadowCoherenceGraphV0.js";

export const NON_EXECUTIVE_TOPOLOGY_MAP_SCHEMA_V0 =
  "castle.rhizoh.non_executive_topology_map.v0.19";

function djb2HexV0(str) {
  let h = 5381;
  const s = String(str || "");
  for (let i = 0; i < s.length; i += 1) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(16).padStart(8, "0");
}

/**
 * @returns {import('./nonExecutiveTopologyMapV0.js').NonExecutiveTopologyMapV0}
 */
export function buildNonExecutiveTopologyMapV0() {
  const graph = buildShadowCoherenceGraphV0();
  const basis = JSON.stringify({
    nodes: graph.nodes.map((n) => n.nodeId).sort(),
    edges: graph.edges.map((e) => `${e.from}|${e.to}|${e.shadowCoherence}`)
  });

  const map = Object.freeze({
    schema: NON_EXECUTIVE_TOPOLOGY_MAP_SCHEMA_V0,
    executive: false,
    witnessWrite: false,
    executionWrite: false,
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    graph,
    topologyMapSignature: `epi_topo_map_${djb2HexV0(basis)}`,
    statement: "Topology map for observation — not navigation or execution authority."
  });

  if (typeof window !== "undefined") {
    window.__rhizoh_non_executive_topology_map = map;
  }
  return map;
}
