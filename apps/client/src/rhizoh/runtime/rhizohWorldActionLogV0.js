/**
 * WAL v0 — World Action Log (episodic world history).
 * Enables replayable world state — not ephemeral AI output.
 * @see docs/RHIZOH_WORLD_ACTION_LOG_V0.md
 */

export const WAL_SCHEMA_V0 = "castle.rhizoh.world_action_log.v0";

export const RHIZOH_WORLD_ACTION_LOG_EVENT_V0 = "rhizoh:world-action-log-v0";

const RING_MAX_V0 = 256;

/** @type {ReturnType<typeof appendWorldActionLogEntryV0>[]} */
const ring = [];

/** @type {Map<string, ReturnType<typeof appendWorldActionLogEntryV0>>} */
const byId = new Map();

let episodeSeq = 0;

/**
 * @param {object} input
 */
export function buildWorldActionLogEntryV0(input = {}) {
  episodeSeq += 1;
  const atMs = Number(input.atMs) || Date.now();
  const entry_id = `wal_${atMs}_${episodeSeq}`;

  return Object.freeze({
    schema: WAL_SCHEMA_V0,
    entry_id,
    episode_seq: episodeSeq,
    atMs,
    t0_frame: Object.freeze(input.t0_frame || {}),
    rcal: Object.freeze(input.rcal || {}),
    surface_bindings: Object.freeze(input.surface_bindings || {}),
    artifact_ref: Object.freeze({
      artifact_id: input.artifact_id || null,
      pack_id: input.pack_id || null,
      kind: input.artifact_kind || null
    }),
    lineage: Object.freeze(input.lineage || {}),
    experiential_now_id: input.experiential_now_id || null,
    stream_coherence_id: input.stream_coherence_id || null,
    pet_citizen: Object.freeze(input.pet_citizen || {})
  });
}

/**
 * @param {ReturnType<typeof buildWorldActionLogEntryV0>} entry
 */
export function appendWorldActionLogEntryV0(entry) {
  if (typeof window !== "undefined" && window.__rhizoh?.worldWriteFreeze?.frozen === true) {
    try {
      window.dispatchEvent(
        new CustomEvent("rhizoh:world-write-freeze-v0", {
          detail: Object.freeze({
            code: "world_write_frozen",
            atMs: Date.now()
          })
        })
      );
    } catch {
      /* noop */
    }
    return null;
  }
  const e = entry?.schema === WAL_SCHEMA_V0 ? entry : buildWorldActionLogEntryV0(entry);
  ring.push(e);
  byId.set(e.entry_id, e);
  if (ring.length > RING_MAX_V0) {
    const removed = ring.shift();
    if (removed) byId.delete(removed.entry_id);
  }

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    const walPersist = window.__rhizoh.worldWalPersistence;
    window.__rhizoh.worldActionLog = Object.freeze({
      schema: WAL_SCHEMA_V0,
      count: ring.length,
      last_entry_id: e.entry_id,
      last_episode_seq: e.episode_seq,
      persistence: walPersist?.persistence || "wal_v0",
      durable: walPersist?.durable === true,
      world_identity_id: walPersist?.world_identity_id || window.__rhizoh.worldIdentity?.world_identity_id || null,
      entries: listWorldActionLogEntriesV0(48)
    });
    window.__rhizoh.worldEpisode = Object.freeze({
      current_seq: e.episode_seq,
      coherence_id: e.stream_coherence_id || e.t0_frame?.coherenceId || null,
      experiential_now_id: e.experiential_now_id,
      atMs: e.atMs,
      wal_entry_id: e.entry_id
    });
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_WORLD_ACTION_LOG_EVENT_V0, {
          detail: Object.freeze({ entry: e })
        })
      );
    } catch {
      /* noop */
    }
    void import("./rhizohWorldWalPersistenceV0.js").then((m) => m.persistWorldWalEntryV0(e));
  }
  return e;
}

/**
 * Restore hot ring + episode counter from IDB hydrate (B2+).
 * @param {ReturnType<typeof buildWorldActionLogEntryV0>[]} entries
 * @param {object | null} meta
 */
export function importWorldActionLogFromHydrateV0(entries, meta) {
  if (!Array.isArray(entries) || !entries.length) return;
  for (const e of entries) {
    if (e?.schema !== WAL_SCHEMA_V0) continue;
    if (!byId.has(e.entry_id)) {
      ring.push(e);
      byId.set(e.entry_id, e);
      episodeSeq = Math.max(episodeSeq, Number(e.episode_seq) || 0);
    }
  }
  while (ring.length > RING_MAX_V0) {
    const removed = ring.shift();
    if (removed) byId.delete(removed.entry_id);
  }
  if (meta?.last_episode_seq) {
    episodeSeq = Math.max(episodeSeq, Number(meta.last_episode_seq) || 0);
  }
}

/**
 * Replace hot ring from snapshot restore (rollback / hydrate reset).
 * @param {ReturnType<typeof buildWorldActionLogEntryV0>[]} entries
 * @param {object | null} [meta]
 */
export function replaceWorldActionLogFromEntriesV0(entries, meta) {
  ring.length = 0;
  byId.clear();
  episodeSeq = 0;
  importWorldActionLogFromHydrateV0(entries, meta);
  if (typeof window !== "undefined" && ring.length) {
    const last = ring[ring.length - 1];
    window.__rhizoh = window.__rhizoh || {};
    const walPersist = window.__rhizoh.worldWalPersistence;
    window.__rhizoh.worldActionLog = Object.freeze({
      schema: WAL_SCHEMA_V0,
      count: ring.length,
      last_entry_id: last.entry_id,
      last_episode_seq: last.episode_seq,
      persistence: walPersist?.persistence || "wal_v0",
      durable: walPersist?.durable === true,
      world_identity_id:
        walPersist?.world_identity_id || window.__rhizoh.worldIdentity?.world_identity_id || null,
      entries: listWorldActionLogEntriesV0(48)
    });
    window.__rhizoh.worldEpisode = Object.freeze({
      current_seq: last.episode_seq,
      coherence_id: last.stream_coherence_id || last.t0_frame?.coherenceId || null,
      experiential_now_id: last.experiential_now_id,
      atMs: last.atMs,
      wal_entry_id: last.entry_id
    });
  }
}

export function listWorldActionLogEntriesV0(limit = 32) {
  return Object.freeze(ring.slice(-limit));
}

export function getWorldActionLogEntryV0(entryId) {
  return byId.get(String(entryId || "")) || null;
}

export function getLastWorldActionLogEntryV0() {
  return ring.length ? ring[ring.length - 1] : null;
}

export function resetRhizohWorldActionLogForTestV0() {
  episodeSeq = 0;
  ring.length = 0;
  byId.clear();
}
