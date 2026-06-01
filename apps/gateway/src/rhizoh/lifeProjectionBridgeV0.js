/**
 * L2 → UI projection bundle (computed, regenerable).
 * @see docs/RHIZOH_L2_ENTITY_CORE_V0.md
 */

import { LIFE_ENTITY_CONTRACT_V0 } from "./lifeEntityGraphV0.js";
import { getLifeEntityGraphV0 } from "./lifeEntityGraphV0.js";
import { getLifeContinuityStoreV0 } from "./lifeContinuityStoreV0.js";

/**
 * @param {import('./lifeEntityGraphV0.js').LifeEntityGraphV0} graph
 * @param {string} user_id
 * @param {string} castle_id
 */
function locationForCastle(graph, user_id, castle_id) {
  const edges = graph.listEdgesForUser(user_id, { rel: "located_at", from_id: castle_id });
  if (!edges.edges.length) return null;
  const locId = edges.edges[0].to_id;
  const loc = graph.getNode(locId, { user_id });
  return loc.ok ? loc.node : null;
}

/**
 * @param {{
 *   user_id: string,
 *   graph?: import('./lifeEntityGraphV0.js').LifeEntityGraphV0,
 *   store?: import('./lifeContinuityStoreV0.js').LifeContinuityStoreV0,
 *   kinds?: string[]
 * }} input
 */
export function buildProjectionBundleV0(input) {
  const user_id = String(input.user_id || "").trim();
  if (user_id.length < 8) return { ok: false, code: "invalid_user_id" };

  const graph = input.graph || getLifeEntityGraphV0();
  const store = input.store || getLifeContinuityStoreV0();
  const want = new Set(input.kinds || ["map_pin", "thread_list", "continuity_strip"]);

  /** @type {Record<string, unknown>[]} */
  const projections = [];

  if (want.has("map_pin")) {
    const castles = graph.listNodesForUser(user_id, { entity_kind: "castle" });
    for (const castle of castles.nodes) {
      const loc = locationForCastle(graph, user_id, String(castle.entity_id));
      if (!loc?.payload) continue;
      const p = loc.payload;
      projections.push(
        Object.freeze({
          projection_kind: "map_pin",
          entity_id: castle.entity_id,
          label: castle.label,
          source_entity_ids: [castle.entity_id, loc.entity_id],
          location: Object.freeze({
            lat: Number(p.lat),
            lon: Number(p.lon),
            place_name: p.place_name ? String(p.place_name) : undefined
          })
        })
      );
    }
  }

  if (want.has("thread_list") || want.has("continuity_strip")) {
    const threads = graph.listNodesForUser(user_id, { entity_kind: "castle" });
    for (const castle of threads.nodes) {
      const linked = graph.listEdgesForUser(user_id, {
        rel: "linked_thread",
        from_id: String(castle.entity_id)
      });
      for (const edge of linked.edges) {
        const thread_id = String(edge.payload?.thread_id || "").trim();
        if (!thread_id) continue;
        const thr = store.getThread(thread_id, { user_id });
        if (!thr.ok) continue;

        if (want.has("thread_list")) {
          projections.push(
            Object.freeze({
              projection_kind: "thread_list",
              entity_id: castle.entity_id,
              label: thr.thread.title,
              source_entity_ids: [castle.entity_id],
              thread_id,
              evidence_refs: [{ thread_id }]
            })
          );
        }

        if (want.has("continuity_strip")) {
          projections.push(
            Object.freeze({
              projection_kind: "continuity_strip",
              entity_id: castle.entity_id,
              label: `Continue at ${castle.label}`,
              source_entity_ids: [castle.entity_id],
              thread_id
            })
          );
        }
      }
    }
  }

  const bundle = Object.freeze({
    contract_version: LIFE_ENTITY_CONTRACT_V0,
    user_id,
    as_of: new Date().toISOString(),
    projections
  });

  return { ok: true, bundle };
}
