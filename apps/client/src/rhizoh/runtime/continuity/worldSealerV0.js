/**
 * CORE-ELIGIBLE: Temporal World Sealer & Hydrate Gate Enforcer (Faz 2.8 wire)
 *
 * Persists living world bootstrap + fixation anchor to continuity IDB;
 * enforces hydrate gate before runtime / visual layer boot.
 */

import { REALITY_SEAL_DISK_KEY_V0 } from "../realitySealDiskV0.js";
import {
  IDB_STORE_FIXATION_STATE_V0,
  IDB_STORE_LIVING_WORLD_BOOTSTRAP_V0,
  openSubstrateContinuityIdbV0,
  resolveSubstrateContinuityDiskKeyV0
} from "../substrateContinuityIdbV0.js";
import { FIXATION_PHASE_V0 } from "./temporalAuthorityFixationV0.js";
import { invalidateTemporalAuthorityFixationV0 } from "./temporalAuthorityFixationV0.js";
import { clearAuditIntegrityChainStateV0 } from "./temporalAuditIntegrityV0.js";
import { CONTINUITY_HYDRATE_MODE_V0 } from "../substrateContinuityIdbV0.js";

export const WORLD_SEALER_SCHEMA_V0 = "castle.rhizoh.world_sealer.v0";

export const HYDRATE_GATE_MODE_V0 = Object.freeze({
  CONTINUITY_OK: "CONTINUITY_OK",
  QUARANTINE: "QUARANTINE",
  COLD: "COLD"
});

/**
 * @typedef {Object} PersistedLivingWorldBootstrapV0
 * @property {string} schema
 * @property {string} diskKey
 * @property {string|null} livingWorldId
 * @property {string|null} livingNodeId
 * @property {number|null} checkpointTick
 * @property {number|null} replayFromTick
 * @property {boolean} mayBootstrapRuntime
 * @property {string|null} epistemicPast
 * @property {string|null} rehydrateGate
 * @property {number} sealedAtMs
 * @property {string|null} selectionVerdict
 * @property {string|null} [bootValidityToken]
 * @property {string|null} [auditSealHeadSnapshot]
 * @property {string|null} [revokeStateSnapshot]
 */

/**
 * @typedef {Object} PersistedFixationSealV0
 * @property {string} diskKey
 * @property {string|null} fixedExecutorNodeId
 * @property {string} fixationPhase
 * @property {number|null} lastSyncTick
 * @property {number} updatedAtMs
 */

/** @type {Map<string, { bootstrap: PersistedLivingWorldBootstrapV0, fixation: PersistedFixationSealV0 }>} */
const inMemoryWorldSealStoreV0 = new Map();

/**
 * TEST-ONLY — in-memory backend when IndexedDB unavailable.
 */
export function useInMemoryWorldSealerBackendV0(enabled = true) {
  return { enabled, clear: () => inMemoryWorldSealStoreV0.clear() };
}

/**
 * @param {Awaited<ReturnType<import('./temporalWorldSelectionV0.js').buildLivingWorldBootstrapV0>>} bootstrapResult
 * @param {import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0 | null} activeContract
 * @param {string} [diskKey]
 */
export function normalizeBootstrapForSealV0(bootstrapResult, activeContract, diskKey) {
  const dk = resolveSubstrateContinuityDiskKeyV0(diskKey || bootstrapResult?.diskKey || activeContract?.diskKey);
  return {
    schema: WORLD_SEALER_SCHEMA_V0,
    diskKey: dk,
    livingWorldId: bootstrapResult?.worldId ?? null,
    livingNodeId: bootstrapResult?.nodeId ?? activeContract?.nodeId ?? null,
    checkpointTick:
      bootstrapResult?.trustedCheckpointTick != null
        ? Number(bootstrapResult.trustedCheckpointTick)
        : null,
    replayFromTick:
      bootstrapResult?.replayFromTick != null ? Number(bootstrapResult.replayFromTick) : null,
    mayBootstrapRuntime: bootstrapResult?.mayBootstrapRuntime === true,
    epistemicPast: bootstrapResult?.epistemicPast ?? activeContract?.epistemicPast ?? null,
    rehydrateGate: bootstrapResult?.rehydrateGate ?? null,
    sealedAtMs: Date.now(),
    selectionVerdict: bootstrapResult?.verdict ?? null
  };
}

/**
 * @param {IDBDatabase} db
 * @param {PersistedLivingWorldBootstrapV0} bootstrap
 * @param {import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0 | null} activeContract
 * @param {{
 *   fixation?: { fixedExecutorNodeId?: string | null, fixationPhase?: string, lastSyncTick?: number },
 *   networkExecutorNodeId?: string | null
 * }} [meta]
 */
export async function persistLivingWorldBootstrapV0(db, bootstrap, activeContract, meta = {}) {
  const dk = resolveSubstrateContinuityDiskKeyV0(bootstrap.diskKey);
  const fixationSeal = {
    diskKey: dk,
    fixedExecutorNodeId:
      meta.networkExecutorNodeId ??
      meta.fixation?.fixedExecutorNodeId ??
      activeContract?.nodeId ??
      bootstrap.livingNodeId,
    fixationPhase: meta.fixation?.fixationPhase ?? FIXATION_PHASE_V0.FIXED,
    lastSyncTick: meta.fixation?.lastSyncTick ?? bootstrap.checkpointTick,
    updatedAtMs: Date.now()
  };

  if (inMemoryWorldSealStoreV0.has(`__use_memory__${dk}`)) {
    inMemoryWorldSealStoreV0.set(dk, { bootstrap, fixation: fixationSeal });
    const { finalizeBootAtomicSealV0 } = await import("./bootValidityTokenV0.js");
    const auditHead =
      (await import("./temporalAuditIntegrityV0.js")).getAuditIntegrityChainStateV0(dk)
        ?.chainHeadHash ?? null;
    const atomic = await finalizeBootAtomicSealV0(null, dk, auditHead);
    return { ok: true, diskKey: dk, backend: "memory", bootValidityToken: atomic.token };
  }

  await idbPutLivingWorldSealV0(db, bootstrap, fixationSeal);

  const { finalizeBootAtomicSealV0 } = await import("./bootValidityTokenV0.js");
  const auditHead =
    (await import("./temporalAuditIntegrityV0.js")).getAuditIntegrityChainStateV0(dk)?.chainHeadHash ??
    null;
  const atomic = await finalizeBootAtomicSealV0(db, dk, auditHead);
  return { ok: true, diskKey: dk, backend: "idb", bootValidityToken: atomic.token };
}

/**
 * @param {IDBDatabase} db
 * @param {string} [diskKey]
 */
export async function readLivingWorldBootstrapV0(db, diskKey) {
  const dk = resolveSubstrateContinuityDiskKeyV0(diskKey);
  if (inMemoryWorldSealStoreV0.has(dk)) {
    return inMemoryWorldSealStoreV0.get(dk)?.bootstrap ?? null;
  }
  if (!db) return null;
  return idbGetV0(db, IDB_STORE_LIVING_WORLD_BOOTSTRAP_V0, dk);
}

/**
 * @param {IDBDatabase} db
 * @param {string} [diskKey]
 */
export async function readFixationSealV0(db, diskKey) {
  const dk = resolveSubstrateContinuityDiskKeyV0(diskKey);
  if (inMemoryWorldSealStoreV0.has(dk)) {
    return inMemoryWorldSealStoreV0.get(dk)?.fixation ?? null;
  }
  if (!db) return null;
  return idbGetV0(db, IDB_STORE_FIXATION_STATE_V0, dk);
}

/**
 * @param {PersistedLivingWorldBootstrapV0 | null | undefined} persistedBootstrap
 */
export function enforceHydrateGateV0(persistedBootstrap) {
  if (!persistedBootstrap || persistedBootstrap.mayBootstrapRuntime !== true) {
    return {
      allowExecution: false,
      mode: HYDRATE_GATE_MODE_V0.QUARANTINE,
      hydrateMode: CONTINUITY_HYDRATE_MODE_V0.CONTINUITY_BROKEN,
      statement: "Execution blocked: no eligible living world or bootstrap denied."
    };
  }

  return {
    allowExecution: true,
    mode: HYDRATE_GATE_MODE_V0.CONTINUITY_OK,
    hydrateMode: CONTINUITY_HYDRATE_MODE_V0.CONTINUITY_OK,
    targetTick: persistedBootstrap.checkpointTick,
    replayOrigin: persistedBootstrap.replayFromTick,
    livingWorldId: persistedBootstrap.livingWorldId,
    livingNodeId: persistedBootstrap.livingNodeId,
    statement: "Living world hydrate gate open."
  };
}

/**
 * Boot path — read seal then enforce gate (before Cesium / map).
 *
 * @param {string} [diskKey]
 */
export async function enforceHydrateGateFromDiskV0(diskKey) {
  const dk = resolveSubstrateContinuityDiskKeyV0(diskKey);
  if (typeof indexedDB === "undefined" && !inMemoryWorldSealStoreV0.has(dk)) {
    return {
      allowExecution: false,
      mode: HYDRATE_GATE_MODE_V0.COLD,
      hydrateMode: CONTINUITY_HYDRATE_MODE_V0.COLD,
      statement: "No persisted bootstrap — cold start."
    };
  }

  const db = typeof indexedDB !== "undefined" ? await openSubstrateContinuityIdbV0() : null;
  try {
    const persisted = db ? await readLivingWorldBootstrapV0(db, dk) : inMemoryWorldSealStoreV0.get(dk)?.bootstrap;
    return enforceHydrateGateV0(persisted);
  } finally {
    db?.close();
  }
}

/**
 * Seal pipeline output to disk.
 *
 * @param {Awaited<ReturnType<import('./temporalAuditRefixationV0.js').runTemporalExecutionPipelineV0>>} pipeline
 * @param {IDBDatabase} [db]
 */
export async function sealPipelineLivingWorldV0(pipeline, db) {
  if (!pipeline?.livingWorldBootstrap) {
    return { ok: false, code: "no_bootstrap" };
  }

  const bootstrap = normalizeBootstrapForSealV0(
    pipeline.livingWorldBootstrap,
    pipeline.activeContract,
    pipeline.activeContract?.diskKey
  );

  const database = db ?? (typeof indexedDB !== "undefined" ? await openSubstrateContinuityIdbV0() : null);
  const closeDb = !db && database;

  try {
    if (!database) {
      const dk = bootstrap.diskKey;
      inMemoryWorldSealStoreV0.set(`__use_memory__${dk}`, { bootstrap, fixation: {} });
      inMemoryWorldSealStoreV0.set(dk, {
        bootstrap,
        fixation: {
          diskKey: dk,
          fixedExecutorNodeId: pipeline.networkExecutorNodeId ?? bootstrap.livingNodeId,
          fixationPhase: pipeline.fixationPhase ?? FIXATION_PHASE_V0.FIXED,
          lastSyncTick: bootstrap.checkpointTick,
          updatedAtMs: Date.now()
        }
      });
      const { finalizeBootAtomicSealV0 } = await import("./bootValidityTokenV0.js");
      const auditHead =
        (await import("./temporalAuditIntegrityV0.js")).getAuditIntegrityChainStateV0(dk)
          ?.chainHeadHash ?? null;
      await finalizeBootAtomicSealV0(null, dk, auditHead);
      return { ok: true, bootstrap, backend: "memory" };
    }

    return await persistLivingWorldBootstrapV0(database, bootstrap, pipeline.activeContract, {
      networkExecutorNodeId: pipeline.networkExecutorNodeId,
      fixation: {
        fixedExecutorNodeId: pipeline.networkExecutorNodeId,
        fixationPhase: pipeline.fixationPhase,
        lastSyncTick: bootstrap.checkpointTick
      }
    });
  } finally {
    if (closeDb) database.close();
  }
}

/**
 * @param {IDBDatabase} db
 * @param {PersistedLivingWorldBootstrapV0} bootstrap
 * @param {PersistedFixationSealV0} fixation
 */
async function idbPutLivingWorldSealV0(db, bootstrap, fixation) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      [IDB_STORE_LIVING_WORLD_BOOTSTRAP_V0, IDB_STORE_FIXATION_STATE_V0],
      "readwrite"
    );
    tx.objectStore(IDB_STORE_LIVING_WORLD_BOOTSTRAP_V0).put(bootstrap);
    tx.objectStore(IDB_STORE_FIXATION_STATE_V0).put(fixation);
    tx.oncomplete = () => resolve(undefined);
    tx.onerror = () => reject(tx.error || new Error("world_seal_tx_failed"));
  });
}

/**
 * @param {IDBDatabase} db
 * @param {string} store
 * @param {string} key
 */
function idbGetV0(db, store, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error || new Error("idb_get_failed"));
  });
}

/**
 * Enable in-memory seal for tests.
 * @param {string} diskKey
 */
export function enableInMemoryWorldSealerForDiskV0(diskKey) {
  const dk = resolveSubstrateContinuityDiskKeyV0(diskKey);
  inMemoryWorldSealStoreV0.set(`__use_memory__${dk}`, { bootstrap: null, fixation: null });
}

export function clearInMemoryWorldSealerV0() {
  inMemoryWorldSealStoreV0.clear();
}

/**
 * Invalidate sealed living world — forces fresh selection on next boot.
 *
 * Triggers: stale_audit_interpretation, drift_exceeded, re_election, quarantine.
 *
 * @param {IDBDatabase | null} db
 * @param {string} [diskKey]
 * @param {string} [reason]
 */
export async function revokeLivingWorldBootstrapV0(db, diskKey, reason = "bootstrap_revoked") {
  const dk = resolveSubstrateContinuityDiskKeyV0(diskKey);
  invalidateTemporalAuthorityFixationV0(dk, reason);
  clearAuditIntegrityChainStateV0(dk);

  const { appendRevokeLogV0, clearInMemoryBootAtomicSealCacheV0 } = await import(
    "./bootValidityTokenV0.js"
  );
  await appendRevokeLogV0(db, dk, reason);

  if (inMemoryWorldSealStoreV0.has(dk) || inMemoryWorldSealStoreV0.has(`__use_memory__${dk}`)) {
    inMemoryWorldSealStoreV0.delete(dk);
    inMemoryWorldSealStoreV0.delete(`__use_memory__${dk}`);
    clearInMemoryBootAtomicSealCacheV0(dk);
    return { ok: true, diskKey: dk, backend: "memory", reason };
  }

  if (!db || typeof indexedDB === "undefined") {
    clearInMemoryBootAtomicSealCacheV0(dk);
    return { ok: true, diskKey: dk, backend: "none", reason };
  }

  await idbDeleteLivingWorldSealV0(db, dk);
  clearInMemoryBootAtomicSealCacheV0(dk);
  return { ok: true, diskKey: dk, backend: "idb", reason };
}

/**
 * @param {{
 *   drift?: { verdict?: string, requiresReElection?: boolean },
 *   pipeline?: { audit?: { verdict?: string }, auditIntegrity?: { verdict?: string } }
 * }} input
 */
export function shouldRevokeLivingWorldBootstrapV0(input) {
  const driftVerdict = String(input.drift?.verdict || "");
  if (
    driftVerdict === "re_election_required" ||
    driftVerdict === "quarantine" ||
    driftVerdict === "drift_detected"
  ) {
    return { revoke: true, reason: driftVerdict };
  }

  const auditVerdict = String(input.pipeline?.audit?.verdict || "");
  if (auditVerdict === "historical_only" || auditVerdict === "drift_exceeded") {
    return { revoke: true, reason: auditVerdict };
  }

  const integrityVerdict = String(input.pipeline?.auditIntegrity?.verdict || "");
  if (
    integrityVerdict === "stale_audit_interpretation" ||
    integrityVerdict === "grounding_shift" ||
    integrityVerdict === "verdict_contradiction" ||
    integrityVerdict === "chain_breach"
  ) {
    return { revoke: true, reason: integrityVerdict };
  }

  return { revoke: false, reason: null };
}

/**
 * @param {IDBDatabase} db
 * @param {string} diskKey
 */
async function idbDeleteLivingWorldSealV0(db, diskKey) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      [IDB_STORE_LIVING_WORLD_BOOTSTRAP_V0, IDB_STORE_FIXATION_STATE_V0],
      "readwrite"
    );
    tx.objectStore(IDB_STORE_LIVING_WORLD_BOOTSTRAP_V0).delete(diskKey);
    tx.objectStore(IDB_STORE_FIXATION_STATE_V0).delete(diskKey);
    tx.oncomplete = () => resolve(undefined);
    tx.onerror = () => reject(tx.error || new Error("world_seal_delete_failed"));
  });
}
