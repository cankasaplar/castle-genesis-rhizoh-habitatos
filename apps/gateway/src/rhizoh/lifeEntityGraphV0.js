/**
 * L2-alpha entity graph — nodes + edges (in-memory).
 * @see docs/RHIZOH_L2_ENTITY_CORE_V0.md
 */

export const LIFE_ENTITY_CONTRACT_V0 = "life-entity-v0";

/**
 * @param {unknown} value
 * @param {number} max
 */
function clampString(value, max) {
  return String(value ?? "").slice(0, max);
}

function isoNow() {
  return new Date().toISOString();
}

/**
 * @param {string} prefix
 */
function newEntityId(prefix) {
  const tail =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}_${tail}`;
}

/**
 * @returns {import('./lifeEntityGraphV0.js').LifeEntityGraphV0}
 */
export function createLifeEntityGraphV0() {
  /** @type {Map<string, Record<string, unknown>>} */
  const nodes = new Map();
  /** @type {Map<string, Record<string, unknown>>} */
  const edges = new Map();

  function edgeKey(edge_id) {
    return edge_id;
  }

  return {
    contract_version: LIFE_ENTITY_CONTRACT_V0,

    /**
     * @param {Record<string, unknown>} input
     */
    upsertNode(input) {
      const user_id = clampString(input.user_id, 128);
      const entity_id = clampString(input.entity_id, 128) || newEntityId("ent");
      const entity_kind = clampString(input.entity_kind, 32);
      const label = clampString(input.label, 280);
      if (user_id.length < 8 || !label) return { ok: false, code: "invalid_node" };

      const existing = nodes.get(entity_id);
      const at = isoNow();
      const node = Object.freeze({
        contract_version: LIFE_ENTITY_CONTRACT_V0,
        entity_id,
        entity_kind,
        user_id,
        label,
        status: clampString(input.status, 16) || "active",
        created_at: existing ? existing.created_at : clampString(input.created_at, 40) || at,
        updated_at: at,
        payload:
          input.payload && typeof input.payload === "object"
            ? Object.freeze({ .../** @type {object} */ (input.payload) })
            : undefined
      });
      nodes.set(entity_id, node);
      return { ok: true, node, created: !existing };
    },

    getNode(entity_id, opts = {}) {
      const id = clampString(entity_id, 128);
      const n = nodes.get(id);
      if (!n || n.status === "erased") return { ok: false, code: "not_found" };
      if (opts.user_id && n.user_id !== clampString(opts.user_id, 128)) {
        return { ok: false, code: "user_mismatch" };
      }
      return { ok: true, node: n };
    },

    /**
     * @param {Record<string, unknown>} input
     */
    upsertEdge(input) {
      const user_id = clampString(input.user_id, 128);
      const rel = clampString(input.rel, 32);
      const from_id = clampString(input.from_id, 128);
      const to_id = clampString(input.to_id, 128);
      if (user_id.length < 8 || !rel || !from_id || !to_id) {
        return { ok: false, code: "invalid_edge" };
      }

      const edge_id =
        clampString(input.edge_id, 128) || `edge_${rel}_${from_id}_${to_id}`.slice(0, 128);
      const existing = edges.get(edgeKey(edge_id));
      const at = isoNow();
      const edge = Object.freeze({
        contract_version: LIFE_ENTITY_CONTRACT_V0,
        edge_id,
        user_id,
        rel,
        from_id,
        to_id,
        status: "active",
        created_at: existing ? existing.created_at : at,
        payload:
          input.payload && typeof input.payload === "object"
            ? Object.freeze({ .../** @type {object} */ (input.payload) })
            : undefined
      });
      edges.set(edgeKey(edge_id), edge);
      return { ok: true, edge, created: !existing };
    },

    /**
     * @param {string} userId
     * @param {{ rel?: string, from_id?: string, to_id?: string }} [filter]
     */
    listEdgesForUser(userId, filter = {}) {
      const user_id = clampString(userId, 128);
      const rows = [];
      for (const e of edges.values()) {
        if (e.user_id !== user_id || e.status === "erased") continue;
        if (filter.rel && e.rel !== filter.rel) continue;
        if (filter.from_id && e.from_id !== filter.from_id) continue;
        if (filter.to_id && e.to_id !== filter.to_id) continue;
        rows.push(e);
      }
      return { ok: true, edges: rows };
    },

    /**
     * @param {string} userId
     * @param {{ entity_kind?: string }} [filter]
     */
    listNodesForUser(userId, filter = {}) {
      const user_id = clampString(userId, 128);
      const rows = [];
      for (const n of nodes.values()) {
        if (n.user_id !== user_id || n.status === "erased") continue;
        if (filter.entity_kind && n.entity_kind !== filter.entity_kind) continue;
        rows.push(n);
      }
      return { ok: true, nodes: rows };
    },

    _stats() {
      return { nodes: nodes.size, edges: edges.size };
    },

    _reset() {
      nodes.clear();
      edges.clear();
    }
  };
}

/** @type {ReturnType<typeof createLifeEntityGraphV0> | null} */
let graphSingleton = null;

export function getLifeEntityGraphV0() {
  if (!graphSingleton) graphSingleton = createLifeEntityGraphV0();
  return graphSingleton;
}

export function resetLifeEntityGraphV0() {
  graphSingleton = null;
}

/**
 * @typedef {ReturnType<typeof createLifeEntityGraphV0>} LifeEntityGraphV0
 */
