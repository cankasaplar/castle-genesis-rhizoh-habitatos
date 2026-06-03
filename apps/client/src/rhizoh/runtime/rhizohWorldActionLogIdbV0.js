/**
 * World Action Log — IndexedDB persistence (B2+).
 * Episodic WAL entries + meta (episode cursor, identity chain head).
 * @see docs/RHIZOH_WORLD_WAL_PERSISTENCE_B2_V0.md
 */

import { WAL_SCHEMA_V0 } from "./rhizohWorldActionLogV0.js";

export const WORLD_WAL_IDB_NAME_V0 = "castle.rhizoh.world_action_log.v0";
export const WORLD_WAL_IDB_VERSION_V0 = 1;
export const WORLD_WAL_IDB_SCHEMA_V0 = "castle.rhizoh.world_action_log_idb.v0";

export const WORLD_WAL_IDB_STORE_ENTRIES_V0 = "wal_entries";
export const WORLD_WAL_IDB_STORE_META_V0 = "wal_meta";

export const WORLD_WAL_META_KEY_V0 = "world_wal_meta_v0";

/** @type {Promise<IDBDatabase> | null} */
let dbPromise = null;

/** @type {WorldWalIdbBackendV0 | null} */
let testBackend = null;

/**
 * @typedef {object} WorldWalIdbBackendV0
 * @property {() => Promise<ReturnType<import("./rhizohWorldActionLogV0.js").buildWorldActionLogEntryV0> | null>} [getEntry]
 * @property {(entry: ReturnType<import("./rhizohWorldActionLogV0.js").buildWorldActionLogEntryV0>) => Promise<boolean>} [putEntry]
 * @property {(limit?: number) => Promise<ReturnType<import("./rhizohWorldActionLogV0.js").buildWorldActionLogEntryV0>[]>} [listRecent]
 * @property {() => Promise<object | null>} [readMeta]
 * @property {(meta: object) => Promise<boolean>} [writeMeta]
 * @property {() => Promise<boolean>} [clear]
 */

/**
 * In-memory backend for vitest / no-IDB environments.
 */
export function createInMemoryWorldWalIdbBackendV0() {
  /** @type {Map<string, object>} */
  const entries = new Map();
  /** @type {object[]} */
  const seqList = [];
  /** @type {object | null} */
  let meta = null;

  return Object.freeze({
    async putEntry(entry) {
      if (!entry?.entry_id) return false;
      if (!entries.has(entry.entry_id)) {
        seqList.push(entry);
        seqList.sort((a, b) => a.episode_seq - b.episode_seq);
      }
      entries.set(entry.entry_id, entry);
      return true;
    },
    async getEntry(entryId) {
      return entries.get(String(entryId || "")) || null;
    },
    async listRecent(limit = 256) {
      const n = Math.max(1, Number(limit) || 256);
      return seqList.slice(-n);
    },
    async readMeta() {
      return meta;
    },
    async writeMeta(next) {
      meta = Object.freeze({ ...next });
      return true;
    },
    async clear() {
      entries.clear();
      seqList.length = 0;
      meta = null;
      return true;
    }
  });
}

/** @internal vitest */
export function __setWorldWalIdbBackendForTestV0(backend) {
  testBackend = backend;
}

/** @internal vitest */
export function __resetWorldWalIdbForTestV0() {
  testBackend = null;
  dbPromise = null;
}

function resolveBackendV0() {
  if (testBackend) return testBackend;
  if (typeof indexedDB === "undefined") return null;
  return null;
}

function openWorldWalDbV0() {
  if (resolveBackendV0()) {
    return Promise.reject(new Error("idb_backend_delegated"));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(WORLD_WAL_IDB_NAME_V0, WORLD_WAL_IDB_VERSION_V0);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(WORLD_WAL_IDB_STORE_ENTRIES_V0)) {
          const store = db.createObjectStore(WORLD_WAL_IDB_STORE_ENTRIES_V0, {
            keyPath: "entry_id"
          });
          store.createIndex("by_episode_seq", "episode_seq", { unique: false });
        }
        if (!db.objectStoreNames.contains(WORLD_WAL_IDB_STORE_META_V0)) {
          db.createObjectStore(WORLD_WAL_IDB_STORE_META_V0, { keyPath: "key" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error("idb_open_failed"));
    });
  }
  return dbPromise;
}

/**
 * @param {ReturnType<import("./rhizohWorldActionLogV0.js").buildWorldActionLogEntryV0>} entry
 */
export async function putWorldWalEntryToIdbV0(entry) {
  if (entry?.schema !== WAL_SCHEMA_V0) return false;
  const backend = resolveBackendV0();
  if (backend?.putEntry) return backend.putEntry(entry);

  const db = await openWorldWalDbV0();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(WORLD_WAL_IDB_STORE_ENTRIES_V0, "readwrite");
    const store = tx.objectStore(WORLD_WAL_IDB_STORE_ENTRIES_V0);
    const req = store.put(entry);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error || new Error("idb_put_failed"));
  });
}

/**
 * @param {string} entryId
 */
export async function getWorldWalEntryFromIdbV0(entryId) {
  const id = String(entryId || "");
  if (!id) return null;
  const backend = resolveBackendV0();
  if (backend?.getEntry) return backend.getEntry(id);

  const db = await openWorldWalDbV0();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(WORLD_WAL_IDB_STORE_ENTRIES_V0, "readonly");
    const store = tx.objectStore(WORLD_WAL_IDB_STORE_ENTRIES_V0);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error || new Error("idb_get_failed"));
  });
}

/**
 * @param {number} [limit]
 */
export async function listRecentWorldWalEntriesFromIdbV0(limit = 256) {
  const backend = resolveBackendV0();
  if (backend?.listRecent) return backend.listRecent(limit);

  const db = await openWorldWalDbV0();
  const n = Math.max(1, Number(limit) || 256);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(WORLD_WAL_IDB_STORE_ENTRIES_V0, "readonly");
    const store = tx.objectStore(WORLD_WAL_IDB_STORE_ENTRIES_V0);
    const index = store.index("by_episode_seq");
    const req = index.openCursor(null, "prev");
    /** @type {object[]} */
    const out = [];
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor || out.length >= n) {
        resolve(Object.freeze(out.reverse()));
        return;
      }
      out.push(cursor.value);
      cursor.continue();
    };
    req.onerror = () => reject(req.error || new Error("idb_cursor_failed"));
  });
}

export async function readWorldWalMetaFromIdbV0() {
  const backend = resolveBackendV0();
  if (backend?.readMeta) return backend.readMeta();

  const db = await openWorldWalDbV0();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(WORLD_WAL_IDB_STORE_META_V0, "readonly");
    const store = tx.objectStore(WORLD_WAL_IDB_STORE_META_V0);
    const req = store.get(WORLD_WAL_META_KEY_V0);
    req.onsuccess = () => resolve(req.result?.value || null);
    req.onerror = () => reject(req.error || new Error("idb_meta_read_failed"));
  });
}

/**
 * @param {object} meta
 */
export async function writeWorldWalMetaToIdbV0(meta) {
  const backend = resolveBackendV0();
  if (backend?.writeMeta) return backend.writeMeta(meta);

  const db = await openWorldWalDbV0();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(WORLD_WAL_IDB_STORE_META_V0, "readwrite");
    const store = tx.objectStore(WORLD_WAL_IDB_STORE_META_V0);
    const req = store.put(
      Object.freeze({
        key: WORLD_WAL_META_KEY_V0,
        value: Object.freeze(meta)
      })
    );
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error || new Error("idb_meta_write_failed"));
  });
}

export async function clearWorldWalIdbV0() {
  const backend = resolveBackendV0();
  if (backend?.clear) return backend.clear();
  if (typeof indexedDB === "undefined") return false;
  __resetWorldWalIdbForTestV0();
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(WORLD_WAL_IDB_NAME_V0);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error || new Error("idb_delete_failed"));
  });
}

export function isWorldWalIdbAvailableV0() {
  return Boolean(resolveBackendV0() || typeof indexedDB !== "undefined");
}
