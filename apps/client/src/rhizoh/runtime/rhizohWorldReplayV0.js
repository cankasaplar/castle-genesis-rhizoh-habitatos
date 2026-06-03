/**
 * World replay v0 — read-only restore from WAL (episodic world engine).
 * @see docs/RHIZOH_WORLD_REPLAY_V0.md
 */

import {
  getWorldActionLogEntryV0,
  getLastWorldActionLogEntryV0,
  listWorldActionLogEntriesV0
} from "./rhizohWorldActionLogV0.js";
import { publishRhizohSurfaceStackV0 } from "./rhizohSurfaceStackPublishV0.js";
import {
  readWorldIdentityV0,
  verifyWorldIdentityForReplayV0
} from "./rhizohWorldIdentityV0.js";
import { resolveWorldWalEntryV0 } from "./rhizohWorldWalPersistenceV0.js";
import {
  runWorldIdentityConsistencyHarnessV0,
  snapshotLiveWorldForConsistencyV0
} from "./rhizohIdentityConsistencyLayerV0.js";

export const WORLD_REPLAY_SCHEMA_V0 = "castle.rhizoh.world_replay.v0";

export const RHIZOH_WORLD_REPLAY_EVENT_V0 = "rhizoh:world-replay-v0";

/** @type {ReturnType<typeof replayWorldActionLogEntryV0> | null} */
let lastReplay = null;

/**
 * Read-only replay — restores published SSOT snapshots; does not re-run cognition.
 * @param {string} entryId
 * @param {{ entry?: ReturnType<import("./rhizohWorldActionLogV0.js").buildWorldActionLogEntryV0> | null }} [opts]
 */
export function replayWorldActionLogEntryV0(entryId, opts = {}) {
  const entry = opts.entry || getWorldActionLogEntryV0(entryId);
  if (!entry) return null;

  const liveBefore =
    opts.liveSnapshot || (opts.runIcl === false ? null : snapshotLiveWorldForConsistencyV0());

  const identityCheck = verifyWorldIdentityForReplayV0(entry, readWorldIdentityV0());

  const replay = Object.freeze({
    schema: WORLD_REPLAY_SCHEMA_V0,
    mode: "read_only",
    entry_id: entry.entry_id,
    episode_seq: entry.episode_seq,
    atMs: entry.atMs,
    replayed_at_ms: Date.now(),
    identity: Object.freeze({
      same_world: identityCheck.same_world === true,
      drift: identityCheck.drift === true,
      code: identityCheck.code
    })
  });
  lastReplay = replay;

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.replayMode = true;
    window.__rhizoh.replayedWorldState = Object.freeze({
      entry,
      replay,
      identity_check: identityCheck
    });

    if (entry.t0_frame && Object.keys(entry.t0_frame).length) {
      window.__rhizoh.presenceFrame = entry.t0_frame;
      window.__rhizoh.t0UnifiedFrame = entry.t0_frame;
    }

    const bindings = entry.surface_bindings;
    if (bindings && Object.keys(bindings).length) {
      window.__rhizoh.surfaceBindings = bindings;
      publishRhizohSurfaceStackV0(entry.t0_frame, null, null);
    } else {
      publishRhizohSurfaceStackV0(entry.t0_frame, null, null);
    }

    window.__rhizoh.worldEpisode = Object.freeze({
      current_seq: entry.episode_seq,
      coherence_id: entry.stream_coherence_id || entry.t0_frame?.coherenceId || null,
      experiential_now_id: entry.experiential_now_id,
      atMs: entry.atMs,
      wal_entry_id: entry.entry_id,
      replay: true
    });

    if (entry.pet_citizen && Object.keys(entry.pet_citizen).length) {
      window.__rhizoh.petCitizen = Object.freeze({
        schema: "castle.rhizoh.pet_citizen.v0",
        pet_id: "pet_citizen_v0",
        seq: entry.pet_citizen.seq ?? 0,
        inhabited: entry.pet_citizen.inhabited === true,
        owns_state: false,
        validates_scr: entry.pet_citizen.validates_scr === true,
        position: entry.pet_citizen.position || null,
        coherence_id: entry.stream_coherence_id || entry.t0_frame?.coherenceId || null,
        wal_entry_id: entry.entry_id,
        episode_seq: entry.episode_seq
      });
    }

    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_WORLD_REPLAY_EVENT_V0, {
          detail: Object.freeze({ replay, entry })
        })
      );
    } catch {
      /* noop */
    }

    if (opts.runIcl !== false) {
      const icl = runWorldIdentityConsistencyHarnessV0({
        entryId: entry.entry_id,
        liveSnapshot: liveBefore,
        restoreLive: opts.restoreLiveAfterIcl !== false,
        skipReplay: true
      });
      window.__rhizoh.replayedWorldState = Object.freeze({
        ...window.__rhizoh.replayedWorldState,
        icl_report: icl
      });
    }
  }
  return replay;
}

/**
 * Replay from hot ring or IDB (async resolve).
 * @param {string} entryId
 */
export async function replayWorldActionLogEntryAsyncV0(entryId) {
  const entry = await resolveWorldWalEntryV0(entryId);
  if (!entry) return null;
  return replayWorldActionLogEntryV0(entry.entry_id, { entry });
}

/**
 * Replay nearest WAL entry at or before atMs.
 * @param {number} atMs
 */
export function replayWorldStateAtMsV0(atMs) {
  const target = Number(atMs);
  const entries = listWorldActionLogEntriesV0(256);
  let best = null;
  for (const e of entries) {
    if (Number(e.atMs) <= target) best = e;
    else break;
  }
  return replayWorldActionLogEntryV0(best?.entry_id || getLastWorldActionLogEntryV0()?.entry_id);
}

export function clearWorldReplayModeV0() {
  lastReplay = null;
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.replayMode = false;
    window.__rhizoh.replayedWorldState = null;
  }
}

export function readLastWorldReplayV0() {
  return lastReplay;
}

export function resetRhizohWorldReplayForTestV0() {
  lastReplay = null;
  clearWorldReplayModeV0();
}
