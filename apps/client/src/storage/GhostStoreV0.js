/**
 * Ghost store — persisted simulation entities (replaces ghostArchive.push snapshot).
 */

import { canPersistUserTopologyN12V0 } from "../pwa/rhizohPwaPermissionsN12V0.js";
import {
  idbSimGetAllByIndexV0,
  idbSimGetV0,
  idbSimPutV0,
  SIM_STORE_GHOSTS_V0,
  withRhizohSimulationDbV0
} from "./rhizohSimulationDbV0.js";

export const RHIZOH_GHOST_STORE_SCHEMA_V0 = "castle.rhizoh.ghost_store.v0";

/**
 * @param {{
 *   id?: string,
 *   type?: string,
 *   origin?: string,
 *   destination?: string,
 *   cycleLayer?: number,
 *   preference?: string,
 *   entropy?: number,
 *   archived?: boolean
 * }} ghost
 */
export async function addGhostV0(ghost = {}) {
  if (!canPersistUserTopologyN12V0()) {
    return Object.freeze({ ok: false, reason: "n12_topology_denied" });
  }
  const id = String(ghost.id || `ghost_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`);
  const record = Object.freeze({
    schema: RHIZOH_GHOST_STORE_SCHEMA_V0,
    id,
    type: String(ghost.type || "mirror"),
    origin: String(ghost.origin || ""),
    destination: String(ghost.destination || ""),
    createdAt: Date.now(),
    cycleLayer: Math.max(0, Number(ghost.cycleLayer) || 0),
    preference: String(ghost.preference || "adaptive"),
    entropy: Math.max(0, Math.min(1, Number(ghost.entropy) || 0.5)),
    archived: ghost.archived === true
  });

  return withRhizohSimulationDbV0(async (db) => {
    await idbSimPutV0(db, SIM_STORE_GHOSTS_V0, record);
    return Object.freeze({ ok: true, ghost: record });
  });
}

/**
 * @param {string} ghostId
 */
export async function archiveGhostV0(ghostId) {
  if (!canPersistUserTopologyN12V0()) {
    return Object.freeze({ ok: false, reason: "n12_topology_denied" });
  }
  const id = String(ghostId || "").trim();
  if (!id) return Object.freeze({ ok: false, reason: "missing_id" });

  return withRhizohSimulationDbV0(async (db) => {
    const existing = await idbSimGetV0(db, SIM_STORE_GHOSTS_V0, id);
    if (!existing) return Object.freeze({ ok: false, reason: "not_found" });
    const updated = Object.freeze({ ...existing, archived: true, archivedAt: Date.now() });
    await idbSimPutV0(db, SIM_STORE_GHOSTS_V0, updated);
    return Object.freeze({ ok: true, ghost: updated });
  });
}

/**
 * @param {{ includeArchived?: boolean }} [opts]
 */
export async function listGhostsV0(opts = {}) {
  if (!canPersistUserTopologyN12V0()) {
    return Object.freeze({ ok: false, reason: "n12_topology_denied", ghosts: [] });
  }
  return withRhizohSimulationDbV0(async (db) => {
    const all = await idbSimGetAllByIndexV0(db, SIM_STORE_GHOSTS_V0, "createdAt");
    const ghosts = opts.includeArchived === true ? all : all.filter((g) => g?.archived !== true);
    return Object.freeze({ ok: true, ghosts: Object.freeze(ghosts) });
  });
}
