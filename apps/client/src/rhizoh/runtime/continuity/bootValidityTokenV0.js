/**
 * CORE-ELIGIBLE: Boot atomic seal check — bootValidityToken
 *
 * hash(livingWorldId + checkpoint + revokeState + auditSealHead)
 * Runtime mismatch → revoke + reload (no ghost context / half-revoked state).
 */

import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "./walHashChainV0.js";
import {
  IDB_STORE_BOOT_ATOMIC_SEAL_V0,
  IDB_STORE_LIVING_WORLD_BOOTSTRAP_V0,
  IDB_STORE_REVOKE_LOG_V0,
  resolveSubstrateContinuityDiskKeyV0
} from "../substrateContinuityIdbV0.js";
import { readFixationSealV0, readLivingWorldBootstrapV0 } from "./worldSealerV0.js";
import { getAuditIntegrityChainStateV0 } from "./temporalAuditIntegrityV0.js";

export const BOOT_VALIDITY_TOKEN_SCHEMA_V0 = "castle.rhizoh.boot_validity_token.v0";
export const BOOT_SEAL_VERSION_SCHEMA_V0 = "castle.rhizoh.boot_seal_version.v0";

export const REVOKE_STATE_CLEAN_V0 = "revoke_clean";

/**
 * @typedef {Object} BootSealVersionStateV0
 * @property {string} diskKey
 * @property {number} monotonicCounter
 * @property {number} bootSealVersion
 * @property {string} bootSealChainHead
 * @property {string|null} bootValidityToken
 * @property {number} [sealedAtMs]
 */

/** @type {Map<string, import('./bootValidityTokenV0.js').RevokeLogRecordV0>} */
const inMemoryRevokeLogV0 = new Map();

/**
 * @typedef {Object} BootAtomicSealInputsV0
 * @property {string|null} livingWorldId
 * @property {number|null} checkpointTick
 * @property {string} revokeState
 * @property {string} auditSealHead
 * @property {string|null} fixationPhase
 */

/**
 * @typedef {Object} RevokeLogRecordV0
 * @property {string} diskKey
 * @property {number} seq
 * @property {string} headHash
 * @property {string|null} lastReason
 * @property {number} lastAtMs
 */

/**
 * @param {BootAtomicSealInputsV0} inputs
 */
/**
 * Monotonic counter + hash chain link for each boot atomic seal.
 *
 * @param {BootSealVersionStateV0 | null | undefined} prev
 * @param {string} bootValidityToken
 */
export function issueNextBootSealVersionV0(prev, bootValidityToken) {
  const prevCounter = Number(prev?.monotonicCounter) || 0;
  const prevChain = String(prev?.bootSealChainHead || WAL_HASH_CHAIN_GENESIS_V0);
  const monotonicCounter = prevCounter + 1;
  const bootSealChainHead = foldWalSegmentHashV0(prevChain, {
    monotonicCounter,
    bootValidityToken: String(bootValidityToken || "")
  });
  return {
    monotonicCounter,
    bootSealVersion: monotonicCounter,
    bootSealChainHead
  };
}

/**
 * Watchdog applies only forward-time seal snapshots.
 *
 * @param {number} diskVersion
 * @param {number} lastAppliedVersion
 */
export function shouldApplyBootSealSnapshotV0(diskVersion, lastAppliedVersion) {
  const disk = Number(diskVersion) || 0;
  const applied = Number(lastAppliedVersion) || 0;
  return disk >= applied;
}

/**
 * @returns {number}
 */
export function getLastAppliedBootSealVersionV0() {
  if (typeof window === "undefined") return 0;
  return Number(window.__rhizoh_last_applied_boot_seal_version) || 0;
}

/**
 * @param {number} version
 * @param {string|null} [token]
 */
export function commitLastAppliedBootSealVersionV0(version, token) {
  if (typeof window === "undefined") return;
  window.__rhizoh_last_applied_boot_seal_version = Number(version) || 0;
  if (token != null) {
    window.__rhizoh_boot_validity_token = String(token);
  }
}

export function clearBootSealRuntimeAnchorsV0() {
  if (typeof window === "undefined") return;
  try {
    delete window.__rhizoh_boot_validity_token;
    delete window.__rhizoh_last_applied_boot_seal_version;
    delete window.__rhizoh_boot_seal_chain_head;
  } catch {
    /* noop */
  }
}

/**
 * @param {IDBDatabase | null} db
 * @param {string} [diskKey]
 */
export async function readBootSealVersionStateV0(db, diskKey) {
  const row = await readBootAtomicSealRecordV0(db, diskKey);
  if (!row) return null;
  const counter = Number(row.monotonicCounter) || 0;
  return {
    diskKey: row.diskKey,
    monotonicCounter: counter,
    bootSealVersion: counter,
    bootSealChainHead: String(row.bootSealChainHead || WAL_HASH_CHAIN_GENESIS_V0),
    bootValidityToken: row.bootValidityToken ?? null,
    sealedAtMs: row.sealedAtMs
  };
}

export function computeBootValidityTokenV0(inputs) {
  const payload = {
    livingWorldId: String(inputs.livingWorldId || ""),
    checkpoint: Number(inputs.checkpointTick) || 0,
    revokeState: String(inputs.revokeState || REVOKE_STATE_CLEAN_V0),
    auditSealHead: String(inputs.auditSealHead || WAL_HASH_CHAIN_GENESIS_V0)
  };
  return foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, payload);
}

/**
 * Atomic read — bootstrap + fixation + revoke log + audit head.
 *
 * @param {IDBDatabase | null} db
 * @param {string} [diskKey]
 */
export async function collectBootAtomicSealInputsV0(db, diskKey) {
  const dk = resolveSubstrateContinuityDiskKeyV0(diskKey);
  const bootstrap = await readLivingWorldBootstrapV0(db, dk);
  const fixation = await readFixationSealV0(db, dk);
  const revokeLog = await readRevokeLogHeadV0(db, dk);
  const auditFromMemory = getAuditIntegrityChainStateV0(dk);
  const auditSealHead =
    auditFromMemory?.chainHeadHash ||
    (await readPersistedAuditSealHeadV0(db, dk)) ||
    WAL_HASH_CHAIN_GENESIS_V0;

  const revokeState = revokeLog?.headHash || REVOKE_STATE_CLEAN_V0;

  return {
    livingWorldId: bootstrap?.livingWorldId ?? null,
    checkpointTick: bootstrap?.checkpointTick ?? null,
    revokeState,
    auditSealHead,
    fixationPhase: fixation?.fixationPhase ?? null,
    bootstrapPresent: Boolean(bootstrap?.mayBootstrapRuntime),
    revokeSeq: revokeLog?.seq ?? 0
  };
}

/**
 * @param {IDBDatabase | null} db
 * @param {string} [diskKey]
 */
export async function getBootValidityTokenV0(db, diskKey) {
  return getBootAtomicSealV0(db, diskKey);
}

/**
 * @param {IDBDatabase | null} db
 * @param {string} [diskKey]
 */
export async function getBootAtomicSealV0(db, diskKey) {
  const inputs = await collectBootAtomicSealInputsV0(db, diskKey);
  const token = computeBootValidityTokenV0(inputs);
  const versionState = await readBootSealVersionStateV0(db, diskKey);
  const bootSealVersion = versionState?.bootSealVersion ?? 0;
  return {
    schema: BOOT_VALIDITY_TOKEN_SCHEMA_V0,
    versionSchema: BOOT_SEAL_VERSION_SCHEMA_V0,
    token,
    bootSealVersion,
    bootSealChainHead: versionState?.bootSealChainHead ?? WAL_HASH_CHAIN_GENESIS_V0,
    versionState,
    inputs,
    statement: "Boot atomic seal (token + monotonic version) from disk snapshot."
  };
}

/**
 * @param {string|null} expectedToken
 * @param {IDBDatabase | null} db
 * @param {string} [diskKey]
 */
export async function assertBootValidityTokenV0(expectedToken, db, diskKey, opts = {}) {
  if (!expectedToken) {
    return { ok: false, code: "missing_expected_token", mismatch: true };
  }

  const lastApplied =
    opts.lastAppliedBootSealVersion != null
      ? Number(opts.lastAppliedBootSealVersion)
      : getLastAppliedBootSealVersionV0();
  const fresh = await getBootAtomicSealV0(db, diskKey);

  if (!shouldApplyBootSealSnapshotV0(fresh.bootSealVersion, lastApplied)) {
    return {
      schema: BOOT_VALIDITY_TOKEN_SCHEMA_V0,
      ok: true,
      skipped: true,
      code: "stale_boot_seal_snapshot",
      mismatch: false,
      diskVersion: fresh.bootSealVersion,
      lastAppliedBootSealVersion: lastApplied,
      expectedToken,
      freshToken: fresh.token,
      statement: "Stale boot seal snapshot ignored — no revoke."
    };
  }

  if (fresh.bootSealVersion > lastApplied) {
    return {
      schema: BOOT_VALIDITY_TOKEN_SCHEMA_V0,
      ok: true,
      skipped: false,
      code: "forward_boot_seal",
      mismatch: false,
      forwardAdopt: true,
      diskVersion: fresh.bootSealVersion,
      lastAppliedBootSealVersion: lastApplied,
      expectedToken,
      freshToken: fresh.token,
      freshInputs: fresh.inputs,
      statement: "Forward boot seal version — adopt without revoke."
    };
  }

  const ok = String(expectedToken) === String(fresh.token);

  return {
    schema: BOOT_VALIDITY_TOKEN_SCHEMA_V0,
    ok,
    mismatch: !ok,
    diskVersion: fresh.bootSealVersion,
    lastAppliedBootSealVersion: lastApplied,
    expectedToken,
    freshToken: fresh.token,
    freshInputs: fresh.inputs,
    statement: ok
      ? "Boot validity token matches disk atomic seal."
      : "Boot validity token mismatch — half-revoked or ghost context risk."
  };
}

/**
 * Watchdog / runtime — mismatch forces revoke + clears ghost context.
 *
 * @param {string|null} expectedToken
 * @param {IDBDatabase | null} db
 * @param {string} [diskKey]
 */
export async function enforceRuntimeBootValidityTokenV0(expectedToken, db, diskKey, opts = {}) {
  const check = await assertBootValidityTokenV0(expectedToken, db, diskKey, opts);

  if (check.code === "stale_boot_seal_snapshot") {
    return { ...check, revoked: false, hardReload: false };
  }

  if (check.forwardAdopt) {
    commitLastAppliedBootSealVersionV0(check.diskVersion, check.freshToken);
    if (typeof window !== "undefined" && check.freshToken) {
      window.__rhizoh_boot_seal_chain_head = (
        await readBootSealVersionStateV0(db, diskKey)
      )?.bootSealChainHead;
    }
    return { ...check, revoked: false, hardReload: false, adopted: true };
  }

  if (check.ok) {
    commitLastAppliedBootSealVersionV0(check.diskVersion ?? getLastAppliedBootSealVersionV0(), check.freshToken);
    return { ...check, revoked: false, hardReload: false };
  }

  const dk = resolveSubstrateContinuityDiskKeyV0(diskKey);
  await appendRevokeLogV0(db, dk, "boot_validity_token_mismatch");
  const { revokeLivingWorldBootstrapV0 } = await import("./worldSealerV0.js");
  const revoke = await revokeLivingWorldBootstrapV0(db, dk, "boot_validity_token_mismatch");

  if (typeof window !== "undefined") {
    try {
      delete window.__rhizoh_boot_context;
    } catch {
      /* noop */
    }
    clearBootSealRuntimeAnchorsV0();
  }

  const enforcement = {
    ...check,
    revoked: revoke?.ok === true,
    hardReload: true,
    statement: "Token mismatch at current boot seal version — bootstrap revoked."
  };

  import("../violationObservationLogV0.js")
    .then(({ observeBootValidityEnforcementBreachV0 }) => {
      observeBootValidityEnforcementBreachV0(enforcement, dk);
    })
    .catch(() => {
      /* observation must not break enforcement */
    });

  return enforcement;
}

/**
 * Persist token snapshot after successful seal (single transaction).
 *
 * @param {IDBDatabase | null} db
 * @param {string} [diskKey]
 * @param {string} [auditSealHead]
 */
export async function finalizeBootAtomicSealV0(db, diskKey, auditSealHead) {
  const dk = resolveSubstrateContinuityDiskKeyV0(diskKey);
  const inputs = await collectBootAtomicSealInputsV0(db, dk);
  if (auditSealHead) {
    inputs.auditSealHead = auditSealHead;
  }
  const token = computeBootValidityTokenV0(inputs);
  const prevVersion = await readBootSealVersionStateV0(db, dk);
  const version = issueNextBootSealVersionV0(prevVersion, token);

  const bootstrap = await readLivingWorldBootstrapV0(db, dk);
  if (bootstrap) {
    bootstrap.bootValidityToken = token;
    bootstrap.auditSealHeadSnapshot = inputs.auditSealHead;
    bootstrap.revokeStateSnapshot = inputs.revokeState;
    bootstrap.bootSealVersion = version.bootSealVersion;
    bootstrap.bootSealChainHead = version.bootSealChainHead;
  }

  const atomicRecord = {
    diskKey: dk,
    bootValidityToken: token,
    auditSealHead: inputs.auditSealHead,
    revokeStateHead: inputs.revokeState,
    livingWorldId: inputs.livingWorldId,
    checkpointTick: inputs.checkpointTick,
    monotonicCounter: version.monotonicCounter,
    bootSealVersion: version.bootSealVersion,
    bootSealChainHead: version.bootSealChainHead,
    sealedAtMs: Date.now()
  };

  if (!db) {
    inMemoryRevokeLogV0.set(`__atomic__${dk}`, atomicRecord);
    return { ok: true, token, inputs, backend: "memory", ...version };
  }

  await idbPutBootAtomicSealV0(db, bootstrap, atomicRecord);
  return { ok: true, token, inputs, backend: "idb", ...version };
}

/**
 * @param {IDBDatabase | null} db
 * @param {string} [diskKey]
 * @param {string} reason
 */
export async function appendRevokeLogV0(db, diskKey, reason) {
  const dk = resolveSubstrateContinuityDiskKeyV0(diskKey);
  const prev = await readRevokeLogHeadV0(db, dk);
  const seq = (Number(prev?.seq) || 0) + 1;
  const record = {
    diskKey: dk,
    seq,
    lastReason: String(reason || "revoke"),
    lastAtMs: Date.now(),
    headHash: foldWalSegmentHashV0(prev?.headHash || WAL_HASH_CHAIN_GENESIS_V0, {
      seq,
      reason: String(reason || ""),
      atMs: Date.now()
    })
  };

  if (!db) {
    inMemoryRevokeLogV0.set(dk, record);
    return record;
  }

  await idbPutRevokeLogV0(db, record);
  return record;
}

/**
 * @param {IDBDatabase | null} db
 * @param {string} [diskKey]
 */
export async function readRevokeLogHeadV0(db, diskKey) {
  const dk = resolveSubstrateContinuityDiskKeyV0(diskKey);
  if (inMemoryRevokeLogV0.has(dk)) {
    return inMemoryRevokeLogV0.get(dk) ?? null;
  }
  if (!db) return null;
  return idbGetV0(db, IDB_STORE_REVOKE_LOG_V0, dk);
}

async function readBootAtomicSealRecordV0(db, diskKey) {
  const dk = resolveSubstrateContinuityDiskKeyV0(diskKey);
  if (!db) {
    return inMemoryRevokeLogV0.get(`__atomic__${dk}`) ?? null;
  }
  return idbGetV0(db, IDB_STORE_BOOT_ATOMIC_SEAL_V0, dk);
}

async function readPersistedAuditSealHeadV0(db, diskKey) {
  const row = await readBootAtomicSealRecordV0(db, diskKey);
  return row?.auditSealHead ?? null;
}

/**
 * @param {IDBDatabase} db
 * @param {import('./worldSealerV0.js').PersistedLivingWorldBootstrapV0 | null} bootstrap
 * @param {object} atomicRecord
 */
async function idbPutBootAtomicSealV0(db, bootstrap, atomicRecord) {
  return new Promise((resolve, reject) => {
    const stores = [IDB_STORE_BOOT_ATOMIC_SEAL_V0];
    if (bootstrap) stores.push(IDB_STORE_LIVING_WORLD_BOOTSTRAP_V0);
    const tx = db.transaction(stores, "readwrite");
    tx.objectStore(IDB_STORE_BOOT_ATOMIC_SEAL_V0).put(atomicRecord);
    if (bootstrap) {
      tx.objectStore(IDB_STORE_LIVING_WORLD_BOOTSTRAP_V0).put(bootstrap);
    }
    tx.oncomplete = () => resolve(undefined);
    tx.onerror = () => reject(tx.error || new Error("boot_atomic_seal_tx_failed"));
  });
}

async function idbPutRevokeLogV0(db, record) {
  return idbPutV0(db, IDB_STORE_REVOKE_LOG_V0, record);
}

function idbGetV0(db, store, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error || new Error("idb_get_failed"));
  });
}

function idbPutV0(db, store, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value);
    tx.oncomplete = () => resolve(undefined);
    tx.onerror = () => reject(tx.error || new Error("idb_put_failed"));
  });
}

export function clearInMemoryBootValidityStateV0(diskKey) {
  if (!diskKey) {
    inMemoryRevokeLogV0.clear();
    return;
  }
  const dk = resolveSubstrateContinuityDiskKeyV0(diskKey);
  inMemoryRevokeLogV0.delete(dk);
  inMemoryRevokeLogV0.delete(`__atomic__${dk}`);
}

/** Revoke log must survive bootstrap clear — only drop persisted atomic mirror. */
export function clearInMemoryBootAtomicSealCacheV0(diskKey) {
  if (!diskKey) return;
  const dk = resolveSubstrateContinuityDiskKeyV0(diskKey);
  inMemoryRevokeLogV0.delete(`__atomic__${dk}`);
}
