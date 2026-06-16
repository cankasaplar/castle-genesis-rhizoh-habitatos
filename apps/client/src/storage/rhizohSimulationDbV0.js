/**
 * Rhizoh simulation persistence — event-sourced IDB (separate from substrate continuity WAL).
 * STATE = f(EVENTS); ghosts/events/edges/engrams/snapshots live here.
 */

export const RHIZOH_SIMULATION_IDB_NAME_V0 = "castle.rhizoh.simulation.v0";
export const RHIZOH_SIMULATION_IDB_VERSION_V0 = 1;
export const RHIZOH_SIMULATION_IDB_SCHEMA_V0 = "castle.rhizoh.simulation_idb.v0";

export const SIM_STORE_EVENTS_V0 = "events";
export const SIM_STORE_GHOSTS_V0 = "ghosts";
export const SIM_STORE_EDGES_V0 = "edges";
export const SIM_STORE_ENGRAMS_V0 = "engrams";
export const SIM_STORE_SNAPSHOTS_V0 = "snapshots";
export const SIM_STORE_META_V0 = "sim_meta";

export const SIM_META_EVENT_SEQ_KEY_V0 = "event_seq";

/**
 * @returns {Promise<IDBDatabase>}
 */
export function openRhizohSimulationDbV0() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("indexeddb_unavailable"));
  }
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(RHIZOH_SIMULATION_IDB_NAME_V0, RHIZOH_SIMULATION_IDB_VERSION_V0);
    req.onerror = () => reject(req.error || new Error("sim_idb_open_failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (ev) => {
      const db = /** @type {IDBOpenDBRequest} */ (ev.target).result;

      if (!db.objectStoreNames.contains(SIM_STORE_EVENTS_V0)) {
        const events = db.createObjectStore(SIM_STORE_EVENTS_V0, { keyPath: "id" });
        events.createIndex("seq", "seq", { unique: true });
        events.createIndex("ts", "ts", { unique: false });
        events.createIndex("cycle", "cycle", { unique: false });
      }

      if (!db.objectStoreNames.contains(SIM_STORE_GHOSTS_V0)) {
        const ghosts = db.createObjectStore(SIM_STORE_GHOSTS_V0, { keyPath: "id" });
        ghosts.createIndex("archived", "archived", { unique: false });
        ghosts.createIndex("createdAt", "createdAt", { unique: false });
      }

      if (!db.objectStoreNames.contains(SIM_STORE_EDGES_V0)) {
        db.createObjectStore(SIM_STORE_EDGES_V0, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(SIM_STORE_ENGRAMS_V0)) {
        db.createObjectStore(SIM_STORE_ENGRAMS_V0, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(SIM_STORE_SNAPSHOTS_V0)) {
        db.createObjectStore(SIM_STORE_SNAPSHOTS_V0, { keyPath: "eventOffset" });
      }

      if (!db.objectStoreNames.contains(SIM_STORE_META_V0)) {
        db.createObjectStore(SIM_STORE_META_V0, { keyPath: "key" });
      }
    };
  });
}

/**
 * @template T
 * @param {(db: IDBDatabase) => Promise<T>} fn
 */
export async function withRhizohSimulationDbV0(fn) {
  const db = await openRhizohSimulationDbV0();
  try {
    return await fn(db);
  } finally {
    db.close();
  }
}

/**
 * @param {IDBDatabase} db
 * @param {string} store
 * @param {IDBValidKey} key
 */
export function idbSimGetV0(db, store, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error || new Error("sim_idb_get_failed"));
  });
}

/**
 * @param {IDBDatabase} db
 * @param {string} store
 * @param {Record<string, unknown>} value
 */
export function idbSimPutV0(db, store, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).put(value);
    req.onsuccess = () => resolve(value);
    req.onerror = () => reject(req.error || new Error("sim_idb_put_failed"));
    tx.onerror = () => reject(tx.error || req.error || new Error("sim_idb_tx_failed"));
  });
}

/**
 * @param {IDBDatabase} db
 * @param {string} store
 * @param {string} indexName
 * @param {IDBKeyRange} [range]
 */
export function idbSimGetAllByIndexV0(db, store, indexName, range) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).index(indexName).getAll(range);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error || new Error("sim_idb_get_all_failed"));
  });
}

/**
 * @param {IDBDatabase} db
 */
export async function nextSimulationEventSeqV0(db) {
  const row = await idbSimGetV0(db, SIM_STORE_META_V0, SIM_META_EVENT_SEQ_KEY_V0);
  const next = Math.max(0, Number(row?.value) || 0) + 1;
  await idbSimPutV0(db, SIM_STORE_META_V0, { key: SIM_META_EVENT_SEQ_KEY_V0, value: next });
  return next;
}

/** @internal vitest */
export async function __resetRhizohSimulationDbMetaForTestV0() {
  if (typeof indexedDB === "undefined") return;
  await new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(RHIZOH_SIMULATION_IDB_NAME_V0);
    req.onsuccess = () => resolve(undefined);
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve(undefined);
  });
}
