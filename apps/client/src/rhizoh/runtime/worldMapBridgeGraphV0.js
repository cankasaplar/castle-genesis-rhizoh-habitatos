/**
 * V11 regional bridge graph — colorful Istanbul cluster edges for first-entry domain map.
 */

import { SOVEREIGN_CORE_NODES_V0 } from "./sovereignWorldMapNodesV0.js";

const REGIONAL_LAT_RADIUS_V0 = 8;
const REGIONAL_LON_RADIUS_V0 = 12;

/**
 * @param {{ id?: string, lat?: number, lon?: number, color?: string }} node
 */
export function isRegionalMapBridgeNodeV0(node) {
  const lat = Number(node?.lat);
  const lon = Number(node?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  const home = SOVEREIGN_CORE_NODES_V0[0];
  return (
    Math.abs(lat - home.lat) <= REGIONAL_LAT_RADIUS_V0 &&
    Math.abs(lon - home.lon) <= REGIONAL_LON_RADIUS_V0
  );
}

/**
 * Hub + ring — all core regional nodes connected with per-target colors.
 * @param {ReadonlyArray<{ id: string, lat: number, lon: number, color?: string }>} [nodes]
 */
export function buildSovereignRegionalBridgeEdgesV0(nodes = SOVEREIGN_CORE_NODES_V0) {
  const regional = nodes.filter(isRegionalMapBridgeNodeV0);
  if (regional.length < 2) return Object.freeze([]);

  const byId = new Map(regional.map((n) => [n.id, n]));
  const hub = byId.get("castle") || regional[0];
  /** @type {Array<{ source: string, target: string, color: string, kind: string }>} */
  const edges = [];
  const seen = new Set();

  const pushEdge = (source, target, color, kind) => {
    const key = [source, target].sort().join("|");
    if (seen.has(key)) return;
    seen.add(key);
    edges.push(Object.freeze({ source, target, color, kind }));
  };

  for (const node of regional) {
    if (node.id === hub.id) continue;
    pushEdge(hub.id, node.id, String(node.color || hub.color || "#06b6d4"), "hub_spoke");
  }

  const ring = regional.filter((n) => n.id !== hub.id);
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    pushEdge(a.id, b.id, blendBridgeColorV0(a.color, b.color), "regional_ring");
  }

  return Object.freeze(edges);
}

/**
 * @param {string} [a]
 * @param {string} [b]
 */
function blendBridgeColorV0(a, b) {
  return String(a || b || "#a855f7");
}

export const SOVEREIGN_REGIONAL_BRIDGE_EDGES_V0 = buildSovereignRegionalBridgeEdgesV0();
