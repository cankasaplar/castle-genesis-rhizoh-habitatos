/**
 * Faz 2.0 — local continuity substrate (IndexedDB), minimal scope.
 *
 * In scope: wal_segments append + replay_cursor with monotonic/hash guards.
 * Out of scope (by design): snapshots, outbox, peer_state, network replay, gateway sync.
 *
 * @see apps/client/docs/SUBSTRATE_CONTINUITY_PHASE2_V0.md
 */

import { REALITY_SEAL_DISK_KEY_V0 } from "./realitySealDiskV0.js";
import { validateWalSegmentIntegrityV0 } from "./continuity/walSegmentIntegrityV0.js";

export const SUBSTRATE_CONTINUITY_IDB_NAME_V0 = "castle.rhizoh.substrate_continuity.v0";
export const SUBSTRATE_CONTINUITY_IDB_VERSION_V0 = 3;
export const SUBSTRATE_CONTINUITY_IDB_SCHEMA_V0 = "castle.rhizoh.substrate_continuity_idb.v0";

export const IDB_STORE_WAL_SEGMENTS_V0 = "wal_segments";
export const IDB_STORE_REPLAY_CURSOR_V0 = "replay_cursor";
export const IDB_STORE_LIVING_WORLD_BOOTSTRAP_V0 = "living_world_bootstrap_store";
export const IDB_STORE_FIXATION_STATE_V0 = "fixation_state_store";
export const IDB_STORE_BOOT_ATOMIC_SEAL_V0 = "boot_atomic_seal_store";
export const IDB_STORE_REVOKE_LOG_V0 = "revoke_log_store";

/** Composite key — avoids tick collision across diskKey / profile / branch. */
export const WAL_SEGMENT_KEY_PATH_V0 = Object.freeze(["diskKey", "tick"]);

/** One cursor row per continuity namespace. */
export const REPLAY_CURSOR_KEY_PATH_V0 = "diskKey";

export const CONTINUITY_HYDRATE_MODE_V0 = Object.freeze({
  COLD: "cold",
  WARM_EXISTENCE: "warm_existence",
  CONTINUITY_OK: "continuity_ok",
  CONTINUITY_BROKEN: "continuity_broken"
});

/**
 * Immutable segment id (display / witness); store key remains [diskKey, tick].
 * @param {string} diskKey
 * @param {number} tick
 * @param {string} hash
 */
export function deriveWalSegmentIdV0(diskKey, tick, hash) {
  const dk = String(diskKey || "");
  const t = Number(tick);
  const h = String(hash || "");
  return `${dk}:${t}:${h}`;
}

/**
 * @param {string} [diskKey]
 */
export function resolveSubstrateContinuityDiskKeyV0(diskKey) {
  const k = String(diskKey || "").trim();
  return k || REALITY_SEAL_DISK_KEY_V0;
}

/**
 * Monotonic cursor guard — stale async replay must not regress lastTick.
 * @param {import('./substrateContinuityIdbV0.js').ReplayCursorRecordV0 | null | undefined} persisted
 * @param {import('./substrateContinuityIdbV0.js').ReplayCursorRecordV0} incoming
 */
export function canAdvanceReplayCursorV0(persisted, incoming) {
  const iTick = Number(incoming?.lastTick);
  if (!Number.isFinite(iTick) || iTick < 0) {
    return { ok: false, code: "cursor_tick_invalid" };
  }
  const pTick = persisted == null ? -1 : Number(persisted.lastTick);
  if (Number.isFinite(pTick) && iTick < pTick) {
    return { ok: false, code: "cursor_regressed", persistedTick: pTick, incomingTick: iTick };
  }
  return { ok: true };
}

/**
 * Cursor must not carry truth independent of the segment chain.
 * @param {import('./substrateContinuityIdbV0.js').ReplayCursorRecordV0 | null | undefined} cursor
 * @param {import('./substrateContinuityIdbV0.js').WalSegmentRecordV0 | null | undefined} segment
 */
export function validateCursorSegmentAnchorV0(cursor, segment) {
  if (!cursor) return { ok: false, code: "cursor_missing" };
  if (!segment) return { ok: false, code: "segment_missing" };
  const cTick = Number(cursor.lastTick);
  const sTick = Number(segment.tick);
  if (cTick !== sTick) {
    return { ok: false, code: "cursor_tick_segment_mismatch", cursorTick: cTick, segmentTick: sTick };
  }
  const cHash = String(cursor.lastHash || "");
  const sHash = String(segment.hash || "");
  if (!cHash || !sHash || cHash !== sHash) {
    return { ok: false, code: "cursor_hash_segment_mismatch" };
  }
  const segId = deriveWalSegmentIdV0(segment.diskKey, segment.tick, segment.hash);
  if (cursor.lastSegmentId && cursor.lastSegmentId !== segId) {
    return { ok: false, code: "cursor_segment_id_mismatch" };
  }
  return { ok: true, segmentId: segId };
}

/**
 * Hydrate assessment — existence ≠ continuity.
 * Faz 2.0: warm when cursor exists; Faz 2.1+: requires segment + hash anchor.
 *
 * @param {{
 *   cursor: import('./substrateContinuityIdbV0.js').ReplayCursorRecordV0 | null;
 *   segmentAtCursor: import('./substrateContinuityIdbV0.js').WalSegmentRecordV0 | null;
 *   requireContinuityProof?: boolean;
 * }} input
 */
export function assessContinuityHydrateV0(input) {
  const cursor = input?.cursor ?? null;
  const segmentAtCursor = input?.segmentAtCursor ?? null;
  const requireProof = Boolean(input?.requireContinuityProof);

  if (!cursor) {
    return { mode: CONTINUITY_HYDRATE_MODE_V0.COLD, ok: true, issues: [] };
  }

  if (!requireProof) {
    return {
      mode: CONTINUITY_HYDRATE_MODE_V0.WARM_EXISTENCE,
      ok: true,
      issues: [],
      lastTick: cursor.lastTick
    };
  }

  const anchor = validateCursorSegmentAnchorV0(cursor, segmentAtCursor);
  if (!anchor.ok) {
    return {
      mode: CONTINUITY_HYDRATE_MODE_V0.CONTINUITY_BROKEN,
      ok: false,
      issues: [anchor.code],
      lastTick: cursor.lastTick
    };
  }

  return {
    mode: CONTINUITY_HYDRATE_MODE_V0.CONTINUITY_OK,
    ok: true,
    issues: [],
    lastTick: cursor.lastTick,
    segmentId: anchor.segmentId
  };
}

/**
 * @returns {Promise<IDBDatabase>}
 */
export function openSubstrateContinuityIdbV0() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("indexeddb_unavailable"));
  }
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SUBSTRATE_CONTINUITY_IDB_NAME_V0, SUBSTRATE_CONTINUITY_IDB_VERSION_V0);
    req.onerror = () => reject(req.error || new Error("idb_open_failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (ev) => {
      const db = /** @type {IDBOpenDBRequest} */ (ev.target).result;
      if (!db.objectStoreNames.contains(IDB_STORE_WAL_SEGMENTS_V0)) {
        const wal = db.createObjectStore(IDB_STORE_WAL_SEGMENTS_V0, { keyPath: WAL_SEGMENT_KEY_PATH_V0 });
        wal.createIndex("segmentId", "segmentId", { unique: true });
      }
      if (!db.objectStoreNames.contains(IDB_STORE_REPLAY_CURSOR_V0)) {
        db.createObjectStore(IDB_STORE_REPLAY_CURSOR_V0, { keyPath: REPLAY_CURSOR_KEY_PATH_V0 });
      }
      if (!db.objectStoreNames.contains(IDB_STORE_LIVING_WORLD_BOOTSTRAP_V0)) {
        db.createObjectStore(IDB_STORE_LIVING_WORLD_BOOTSTRAP_V0, { keyPath: REPLAY_CURSOR_KEY_PATH_V0 });
      }
      if (!db.objectStoreNames.contains(IDB_STORE_FIXATION_STATE_V0)) {
        db.createObjectStore(IDB_STORE_FIXATION_STATE_V0, { keyPath: REPLAY_CURSOR_KEY_PATH_V0 });
      }
      if (!db.objectStoreNames.contains(IDB_STORE_BOOT_ATOMIC_SEAL_V0)) {
        db.createObjectStore(IDB_STORE_BOOT_ATOMIC_SEAL_V0, { keyPath: REPLAY_CURSOR_KEY_PATH_V0 });
      }
      if (!db.objectStoreNames.contains(IDB_STORE_REVOKE_LOG_V0)) {
        db.createObjectStore(IDB_STORE_REVOKE_LOG_V0, { keyPath: REPLAY_CURSOR_KEY_PATH_V0 });
      }
    };
  });
}

/**
 * Short-lived session — prefer over holding a global db ref across runtime lifetime.
 * @template T
 * @param {string} diskKey
 * @param {(adapter: ReturnType<typeof createSubstrateContinuityIdbAdapterV0>) => Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function withSubstrateContinuityIdbSessionV0(diskKey, fn) {
  const db = await openSubstrateContinuityIdbV0();
  try {
    const adapter = createSubstrateContinuityIdbAdapterV0(db, resolveSubstrateContinuityDiskKeyV0(diskKey));
    return await fn(adapter);
  } finally {
    db.close();
  }
}

/**
 * @param {IDBDatabase} db
 * @param {string} diskKey
 */
export function createSubstrateContinuityIdbAdapterV0(db, diskKey) {
  const dk = resolveSubstrateContinuityDiskKeyV0(diskKey);

  return {
    diskKey: dk,
    schema: SUBSTRATE_CONTINUITY_IDB_SCHEMA_V0,

    /**
     * @param {Omit<WalSegmentRecordV0, 'diskKey' | 'segmentId'> & { tick: number; hash: string; body?: unknown }} segment
     */
    async appendWalSegment(segment) {
      const tick = Number(segment.tick);
      const hash = String(segment.hash || "");
      if (!Number.isFinite(tick) || tick < 0 || !hash) {
        return { ok: false, code: "segment_invalid" };
      }
      const record = {
        diskKey: dk,
        tick,
        hash,
        segmentId: deriveWalSegmentIdV0(dk, tick, hash),
        wallClockMs: Number(segment.wallClockMs) || Date.now(),
        body: segment.body ?? null
      };
      const integrity = validateWalSegmentIntegrityV0(record);
      if (!integrity.ok) return integrity;

      const existing = await idbGetV0(db, IDB_STORE_WAL_SEGMENTS_V0, [dk, tick]);
      if (existing) {
        const same =
          String(existing.hash) === hash &&
          JSON.stringify(existing.body) === JSON.stringify(record.body);
        if (same) return { ok: true, segment: existing, duplicate: true };
        return { ok: false, code: "duplicate_segment", tick };
      }

      try {
        await idbPutV0(db, IDB_STORE_WAL_SEGMENTS_V0, record);
      } catch (err) {
        if (isIdbConstraintErrorV0(err)) {
          return { ok: true, segment: record, duplicate: true };
        }
        throw err;
      }
      return { ok: true, segment: record };
    },

    /** @param {number} tick */
    async getWalSegment(tick) {
      return idbGetV0(db, IDB_STORE_WAL_SEGMENTS_V0, [dk, Number(tick)]);
    },

    async readReplayCursor() {
      return idbGetV0(db, IDB_STORE_REPLAY_CURSOR_V0, dk);
    },

    /**
     * Monotonic cursor write + segment hash anchor when tick advances.
     * @param {Omit<ReplayCursorRecordV0, 'diskKey' | 'updatedAtMs'>} incoming
     */
    async writeReplayCursorMonotonic(incoming) {
      const persisted = await idbGetV0(db, IDB_STORE_REPLAY_CURSOR_V0, dk);
      const guard = canAdvanceReplayCursorV0(persisted, { ...incoming, diskKey: dk });
      if (!guard.ok) return { ok: false, blocked: true, ...guard };

      const iTick = Number(incoming.lastTick);
      const segment = await idbGetV0(db, IDB_STORE_WAL_SEGMENTS_V0, [dk, iTick]);
      const draft = {
        diskKey: dk,
        lastTick: iTick,
        lastHash: String(incoming.lastHash || ""),
        lastSegmentId: String(incoming.lastSegmentId || deriveWalSegmentIdV0(dk, iTick, incoming.lastHash)),
        bootGeneration: Number(incoming.bootGeneration) || (persisted?.bootGeneration ?? 0),
        updatedAtMs: Date.now()
      };

      const anchor = validateCursorSegmentAnchorV0(draft, segment);
      if (!anchor.ok) return { ok: false, ...anchor };

      await idbPutV0(db, IDB_STORE_REPLAY_CURSOR_V0, draft);
      return { ok: true, cursor: draft };
    },

    /**
     * @param {{ requireContinuityProof?: boolean }} [opts]
     */
    async assessHydrate(opts = {}) {
      const cursor = await idbGetV0(db, IDB_STORE_REPLAY_CURSOR_V0, dk);
      const segmentAtCursor =
        cursor != null ? await idbGetV0(db, IDB_STORE_WAL_SEGMENTS_V0, [dk, Number(cursor.lastTick)]) : null;
      return assessContinuityHydrateV0({
        cursor,
        segmentAtCursor,
        requireContinuityProof: Boolean(opts.requireContinuityProof)
      });
    }
  };
}

/**
 * @param {IDBDatabase} db
 * @param {string} store
 * @param {IDBValidKey | IDBKeyRange} key
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
 * @param {IDBDatabase} db
 * @param {string} store
 * @param {Record<string, unknown>} value
 */
function idbPutV0(db, store, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).put(value);
    req.onsuccess = () => resolve(undefined);
    req.onerror = () => reject(req.error || new Error("idb_put_failed"));
    tx.onerror = () => reject(tx.error || req.error || new Error("idb_tx_failed"));
  });
}

/**
 * @param {unknown} err
 */
function isIdbConstraintErrorV0(err) {
  const name = err && typeof err === "object" ? String(/** @type {{ name?: string }} */ (err).name) : "";
  return name === "ConstraintError";
}

/**
 * @typedef {Object} WalSegmentRecordV0
 * @property {string} diskKey
 * @property {number} tick
 * @property {string} hash
 * @property {string} segmentId
 * @property {number} [wallClockMs]
 * @property {unknown} [body]
 */

/**
 * @typedef {Object} ReplayCursorRecordV0
 * @property {string} diskKey
 * @property {number} lastTick
 * @property {string} lastHash
 * @property {string} [lastSegmentId]
 * @property {number} [bootGeneration]
 * @property {number} [trustedCheckpointTick]
 * @property {number} [updatedAtMs]
 */
