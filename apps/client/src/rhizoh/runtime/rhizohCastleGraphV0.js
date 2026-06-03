/**
 * Castle Graph v0.1 — shared projection graph (attention topology, single WAL + ICL).
 * Castle ≠ separate world · Castle = perception node on shared world.
 * @see docs/RHIZOH_WORLD_EXPANSION_LAYER_V0.1.md
 */

import { readCastleProjectionV0 } from "./rhizohCastleProjectionLayerV0.js";
import { readWorldIdentityV0 } from "./rhizohWorldIdentityV0.js";
import { readLastIdentityConsistencyReportV0, ICL_DRIFT_CLASS_V0 } from "./rhizohIdentityConsistencyLayerV0.js";

export const CASTLE_GRAPH_SCHEMA_V0 = "castle.rhizoh.castle_graph.v0";

export const CASTLE_GRAPH_MODE_V0 = "shared_projection_graph";

export const CASTLE_EDGE_KIND_V0 = Object.freeze({
  ATTENTION: "attention_based",
  VISUAL_ECHO: "visual_echo",
  STUDIO_BROADCAST: "studio_broadcast",
  AGENT_PRESENCE: "shared_agent_presence",
  DRIFT_SYNC: "synchronized_drift"
});

/** @type {Map<string, { castle_node_id: string, atMs: number }>} */
const castleNodes = new Map();

/** @type {object[]} */
let castleEdges = [];

function readRhizohV0() {
  return typeof window !== "undefined" ? window.__rhizoh || {} : {};
}

/**
 * @param {{ castle_node_id: string, label?: string }} spec
 */
export function registerCastleGraphNodeV0(spec) {
  const id = String(spec?.castle_node_id || "").trim();
  if (!id) return false;
  castleNodes.set(
    id,
    Object.freeze({
      castle_node_id: id,
      label: spec.label || id,
      atMs: Date.now()
    })
  );
  publishCastleGraphV0();
  return true;
}

/**
 * @param {{
 *   from: string,
 *   to: string,
 *   kind?: string,
 *   weight?: number
 * }} spec
 */
export function linkCastleGraphNodesV0(spec) {
  const from = String(spec?.from || "").trim();
  const to = String(spec?.to || "").trim();
  if (!from || !to || from === to) return false;

  castleEdges.push(
    Object.freeze({
      from,
      to,
      kind: spec.kind || CASTLE_EDGE_KIND_V0.ATTENTION,
      weight: Math.max(0, Math.min(1, Number(spec.weight) || 0.5)),
      atMs: Date.now()
    })
  );
  if (castleEdges.length > 128) castleEdges = castleEdges.slice(-128);
  publishCastleGraphV0();
  return true;
}

export function buildCastleGraphSnapshotV0() {
  const castle = readCastleProjectionV0();
  const identity = readWorldIdentityV0();
  const icl = readLastIdentityConsistencyReportV0();
  const localId = castle?.castle_node_id || "castle_local";

  if (!castleNodes.has(localId)) {
    registerCastleGraphNodeV0({ castle_node_id: localId });
  }

  const singleWorld =
    castle?.single_world !== false &&
    icl?.equivalence?.same_world !== false &&
    icl?.drift?.drift_class !== ICL_DRIFT_CLASS_V0.IDENTITY_BREAK;

  return Object.freeze({
    schema: CASTLE_GRAPH_SCHEMA_V0,
    atMs: Date.now(),
    mode: CASTLE_GRAPH_MODE_V0,
    edges: "attention_based",
    constraint: "single_world_only",
    world_identity_id: identity?.world_identity_id || null,
    shared_wal: castle?.shared_wal !== false,
    icl_enforced: castle?.icl_enforced === true,
    single_world: singleWorld,
    local_node_id: localId,
    nodes: Object.freeze([...castleNodes.values()]),
    graph_edges: Object.freeze(castleEdges.slice(-64)),
    interaction_types: Object.freeze([
      CASTLE_EDGE_KIND_V0.VISUAL_ECHO,
      CASTLE_EDGE_KIND_V0.STUDIO_BROADCAST,
      CASTLE_EDGE_KIND_V0.AGENT_PRESENCE,
      CASTLE_EDGE_KIND_V0.DRIFT_SYNC
    ]),
    ok: singleWorld
  });
}

export function publishCastleGraphV0() {
  const graph = buildCastleGraphSnapshotV0();
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.castleGraph = graph;
  }
  return graph;
}

export function readCastleGraphV0() {
  return readRhizohV0().castleGraph || null;
}

export function resetRhizohCastleGraphForTestV0() {
  castleNodes.clear();
  castleEdges = [];
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.castleGraph;
  }
}
