/**
 * B2+ — WAL persistence orchestration (IndexedDB + versioned world identity).
 * @see docs/RHIZOH_WORLD_WAL_PERSISTENCE_B2_V0.md
 */

import {
  getWorldActionLogEntryV0,
  importWorldActionLogFromHydrateV0
} from "./rhizohWorldActionLogV0.js";
import {
  isWorldWalIdbAvailableV0,
  listRecentWorldWalEntriesFromIdbV0,
  putWorldWalEntryToIdbV0,
  readWorldWalMetaFromIdbV0,
  writeWorldWalMetaToIdbV0
} from "./rhizohWorldActionLogIdbV0.js";
import {
  buildWorldIdentityFromWalEntryV0,
  publishWorldIdentityV0,
  readWorldIdentityV0
} from "./rhizohWorldIdentityV0.js";

export const WORLD_WAL_PERSISTENCE_SCHEMA_V0 = "castle.rhizoh.world_wal_persistence.v0";

export const RHIZOH_WORLD_WAL_PERSISTENCE_EVENT_V0 = "rhizoh:world-wal-persistence-v0";

/** @type {"memory_only" | "wal_v0" | "wal_idb_v0"} */
let persistenceMode = "memory_only";

let hydratePromise = null;
let hydrated = false;

/**
 * @param {ReturnType<import("./rhizohWorldActionLogV0.js").buildWorldActionLogEntryV0>} entry
 */
export async function persistWorldWalEntryV0(entry) {
  if (!entry?.entry_id || !isWorldWalIdbAvailableV0()) {
    return { ok: false, persistence: persistenceMode };
  }

  await initRhizohWorldWalPersistenceV0();

  const prevIdentity = readWorldIdentityV0();
  const identity = buildWorldIdentityFromWalEntryV0({
    entry,
    prevIdentity
  });

  const storedEntry = Object.freeze({
    ...entry,
    identity_link: Object.freeze({
      chain_head_hash: identity.chain_head_hash,
      world_identity_id: identity.world_identity_id,
      identity_version: identity.identity_version
    })
  });

  await putWorldWalEntryToIdbV0(storedEntry);
  await writeWorldWalMetaToIdbV0(
    Object.freeze({
      schema: WORLD_WAL_PERSISTENCE_SCHEMA_V0,
      last_episode_seq: entry.episode_seq,
      last_entry_id: entry.entry_id,
      world_identity_id: identity.world_identity_id,
      identity_version: identity.identity_version,
      chain_head_hash: identity.chain_head_hash,
      hydrated_at_ms: Date.now()
    })
  );

  publishWorldIdentityV0(identity);
  persistenceMode = "wal_idb_v0";
  publishPersistenceStatusV0();

  return Object.freeze({ ok: true, persistence: persistenceMode, identity });
}

/**
 * Hydrate in-memory ring from IDB on boot (lazy).
 * @param {import("./rhizohWorldActionLogV0.js").resetRhizohWorldActionLogForTestV0 extends Function ? object : never} [opts]
 */
export async function initRhizohWorldWalPersistenceV0(opts = {}) {
  if (hydrated && !opts.force) return readWalPersistenceStatusV0();
  if (!isWorldWalIdbAvailableV0()) {
    persistenceMode = "wal_v0";
    return readWalPersistenceStatusV0();
  }

  if (!hydratePromise || opts.force) {
    hydratePromise = hydrateWorldWalFromIdbV0(opts);
  }
  return hydratePromise;
}

/**
 * @param {{ importEntries?: (entries: object[], meta: object | null) => void }} [opts]
 */
async function hydrateWorldWalFromIdbV0(opts = {}) {
  const meta = await readWorldWalMetaFromIdbV0();
  const entries = await listRecentWorldWalEntriesFromIdbV0(256);

  if (entries.length) {
    importWorldActionLogFromHydrateV0(entries, meta);
  }

  if (meta?.chain_head_hash && meta?.world_identity_id) {
    publishWorldIdentityV0(
      Object.freeze({
        schema: "castle.rhizoh.world_identity.v0",
        world_identity_id: meta.world_identity_id,
        identity_version: meta.identity_version || 0,
        chain_head_hash: meta.chain_head_hash,
        last_entry_id: meta.last_entry_id || null,
        last_episode_seq: meta.last_episode_seq || 0,
        last_coherence_id: null,
        experiential_now_id: null,
        atMs: meta.hydrated_at_ms || Date.now()
      })
    );
    persistenceMode = "wal_idb_v0";
  } else if (entries.length) {
    persistenceMode = "wal_idb_v0";
  } else {
    persistenceMode = "wal_v0";
  }

  hydrated = true;
  publishPersistenceStatusV0();
  return readWalPersistenceStatusV0();
}

function publishPersistenceStatusV0() {
  if (typeof window === "undefined") return;
  const status = readWalPersistenceStatusV0();
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.worldWalPersistence = status;
  if (window.__rhizoh.worldActionLog) {
    window.__rhizoh.worldActionLog = Object.freeze({
      ...window.__rhizoh.worldActionLog,
      persistence: status.persistence,
      durable: status.durable,
      world_identity_id: status.world_identity_id
    });
  }
  try {
    window.dispatchEvent(
      new CustomEvent(RHIZOH_WORLD_WAL_PERSISTENCE_EVENT_V0, {
        detail: Object.freeze({ status })
      })
    );
  } catch {
    /* noop */
  }
}

export function readWalPersistenceStatusV0() {
  const identity = readWorldIdentityV0();
  return Object.freeze({
    schema: WORLD_WAL_PERSISTENCE_SCHEMA_V0,
    persistence: persistenceMode,
    durable: persistenceMode === "wal_idb_v0",
    hydrated,
    world_identity_id: identity?.world_identity_id || null,
    identity_version: identity?.identity_version || 0,
    chain_head_hash: identity?.chain_head_hash || null
  });
}

/**
 * Resolve entry from hot ring or IDB.
 * @param {string} entryId
 */
export async function resolveWorldWalEntryV0(entryId) {
  const hot = getWorldActionLogEntryV0(entryId);
  if (hot) return hot;
  const { getWorldWalEntryFromIdbV0 } = await import("./rhizohWorldActionLogIdbV0.js");
  return getWorldWalEntryFromIdbV0(entryId);
}

export function resetRhizohWorldWalPersistenceForTestV0() {
  persistenceMode = "memory_only";
  hydratePromise = null;
  hydrated = false;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.worldWalPersistence;
    delete window.__rhizoh.worldIdentity;
  }
}
