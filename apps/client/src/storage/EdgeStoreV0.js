/**
 * Edge store (heatmap prep) — weighted topology edges for future AutoDispatchSystem.
 */

import { canPersistUserTopologyN12V0 } from "../pwa/rhizohPwaPermissionsN12V0.js";
import {
  idbSimGetV0,
  idbSimPutV0,
  SIM_STORE_EDGES_V0,
  withRhizohSimulationDbV0
} from "./rhizohSimulationDbV0.js";

export const RHIZOH_EDGE_STORE_SCHEMA_V0 = "castle.rhizoh.edge_store.v0";

/**
 * @param {string} source
 * @param {string} target
 */
export function deriveEdgeIdV0(source, target) {
  return `${String(source || "").trim()}→${String(target || "").trim()}`;
}

/**
 * @param {string} source
 * @param {string} target
 * @param {number} [delta]
 */
export async function incrementEdgeWeightV0(source, target, delta = 1) {
  if (!canPersistUserTopologyN12V0()) {
    return Object.freeze({ ok: false, reason: "n12_topology_denied" });
  }
  const id = deriveEdgeIdV0(source, target);
  if (!id || id === "→") return Object.freeze({ ok: false, reason: "invalid_edge" });

  return withRhizohSimulationDbV0(async (db) => {
    const existing = (await idbSimGetV0(db, SIM_STORE_EDGES_V0, id)) || null;
    const weight = Math.max(0, Number(existing?.weight) || 0) + Math.max(0, Number(delta) || 0);
    const record = Object.freeze({
      schema: RHIZOH_EDGE_STORE_SCHEMA_V0,
      id,
      source: String(source),
      target: String(target),
      weight,
      lastActivity: Date.now()
    });
    await idbSimPutV0(db, SIM_STORE_EDGES_V0, record);
    return Object.freeze({ ok: true, edge: record });
  });
}

/**
 * @param {number} [limit]
 */
export async function listStrongestEdgesV0(limit = 8) {
  if (!canPersistUserTopologyN12V0()) {
    return Object.freeze({ ok: false, reason: "n12_topology_denied", edges: [] });
  }
  return withRhizohSimulationDbV0(async (db) => {
    const tx = db.transaction(SIM_STORE_EDGES_V0, "readonly");
    const all = await new Promise((resolve, reject) => {
      const req = tx.objectStore(SIM_STORE_EDGES_V0).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    const edges = all
      .slice()
      .sort((a, b) => Number(b.weight) - Number(a.weight))
      .slice(0, Math.max(1, limit));
    return Object.freeze({ ok: true, edges: Object.freeze(edges) });
  });
}
