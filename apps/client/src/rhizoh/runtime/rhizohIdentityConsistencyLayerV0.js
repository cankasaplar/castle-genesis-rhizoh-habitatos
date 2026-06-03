/**
 * Identity Consistency Layer (ICL) v0 — equivalence guarantee between live, WAL, replay.
 * System correctness validator: "is it still the same world?"
 * @see docs/RHIZOH_IDENTITY_CONSISTENCY_LAYER_V0.md
 */

import {
  getWorldActionLogEntryV0,
  getLastWorldActionLogEntryV0,
  listWorldActionLogEntriesV0
} from "./rhizohWorldActionLogV0.js";
import {
  foldWorldWalEntryHashV0,
  readWorldIdentityV0,
  verifyWorldIdentityForReplayV0
} from "./rhizohWorldIdentityV0.js";
import { WAL_HASH_CHAIN_GENESIS_V0 } from "./continuity/walHashChainV0.js";
import { readWalPersistenceStatusV0 } from "./rhizohWorldWalPersistenceV0.js";

export const ICL_SCHEMA_V0 = "castle.rhizoh.identity_consistency_layer.v0";

export const RHIZOH_IDENTITY_CONSISTENCY_EVENT_V0 = "rhizoh:identity-consistency-v0";

export const ICL_DRIFT_CLASS_V0 = Object.freeze({
  NONE: "none",
  SOFT: "soft",
  STRUCTURAL: "structural",
  IDENTITY_BREAK: "identity_break"
});

/** @type {ReturnType<typeof runWorldIdentityConsistencyHarnessV0> | null} */
let lastHarnessReport = null;

function readRhizohV0() {
  return typeof window !== "undefined" ? window.__rhizoh || {} : {};
}

/**
 * Minimal live SSOT slice for equivalence checks (non-authoritative copy).
 */
export function snapshotLiveWorldForConsistencyV0() {
  const rh = readRhizohV0();
  const frame = rh.presenceFrame || rh.t0UnifiedFrame || null;
  const episode = rh.worldEpisode || null;
  const identity = readWorldIdentityV0();
  const pet = rh.petCitizen || null;
  const bindings = rh.surfaceBindings || null;
  const pack = rh.studioOutputPack || null;
  const ecc = rh.experienceContinuity || null;

  return Object.freeze({
    schema: "castle.rhizoh.icl_live_snapshot.v0",
    atMs: Date.now(),
    wal_entry_id: episode?.wal_entry_id || null,
    episode_seq: episode?.current_seq ?? null,
    coherence_id:
      frame?.coherenceId ||
      episode?.coherence_id ||
      bindings?.coherence_id ||
      pack?.lived_state?.coherence_id ||
      null,
    stream_coherence_id: ecc?.stream_coherence_id || frame?.stream_coherence_id || null,
    experiential_now_id:
      episode?.experiential_now_id ||
      pack?.lived_state?.experiential_now_id ||
      identity?.experiential_now_id ||
      null,
    temporal_phase: frame?.temporalPhase || null,
    breathe01: frame?.breathe01 ?? null,
    world_identity_id: identity?.world_identity_id || null,
    chain_head_hash: identity?.chain_head_hash || null,
    pet: Object.freeze({
      inhabited: pet?.inhabited === true,
      seq: pet?.seq ?? null,
      coherence_id: pet?.coherence_id || null
    }),
    pack_id: pack?.pack_id || null
  });
}

/**
 * @param {ReturnType<typeof snapshotLiveWorldForConsistencyV0>} snap
 */
export function restoreLiveWorldFromConsistencySnapshotV0(snap) {
  if (typeof window === "undefined" || !snap) return false;
  const rh = readRhizohV0();
  window.__rhizoh.replayMode = false;
  window.__rhizoh.replayedWorldState = null;
  if (snap.wal_entry_id && rh.worldEpisode) {
    window.__rhizoh.worldEpisode = Object.freeze({
      ...rh.worldEpisode,
      wal_entry_id: snap.wal_entry_id,
      current_seq: snap.episode_seq,
      coherence_id: snap.coherence_id,
      replay: false
    });
  }
  return true;
}

/**
 * @param {ReturnType<typeof snapshotLiveWorldForConsistencyV0>} live
 * @param {ReturnType<import("./rhizohWorldActionLogV0.js").buildWorldActionLogEntryV0>} entry
 */
export function diffLiveSnapshotVsWalEntryV0(live, entry) {
  if (!entry) {
    return Object.freeze({ ok: false, mismatches: Object.freeze([{ path: "entry", code: "missing" }]) });
  }
  const t0 = entry.t0_frame || {};
  /** @type {{ path: string, code: string, live?: unknown, wal?: unknown }[]} */
  const mismatches = [];

  const pairs = [
    ["coherence_id", live?.coherence_id, t0.coherenceId || entry.stream_coherence_id],
    ["stream_coherence_id", live?.stream_coherence_id, entry.stream_coherence_id],
    ["experiential_now_id", live?.experiential_now_id, entry.experiential_now_id],
    ["episode_seq", live?.episode_seq, entry.episode_seq],
    ["wal_entry_id", live?.wal_entry_id, entry.entry_id],
    ["pet.inhabited", live?.pet?.inhabited, entry.pet_citizen?.inhabited]
  ];

  for (const [path, a, b] of pairs) {
    if (a == null && b == null) continue;
    if (String(a) !== String(b)) {
      mismatches.push({ path, code: "wal_live_mismatch", live: a, wal: b });
    }
  }

  return Object.freeze({
    ok: mismatches.length === 0,
    mismatches: Object.freeze(mismatches)
  });
}

/**
 * @param {ReturnType<typeof import("./rhizohWorldActionLogV0.js").buildWorldActionLogEntryV0>[]} entries
 */
export function verifyWalChainConsistencyV0(entries) {
  const sorted = [...(entries || [])].sort(
    (a, b) => Number(a.episode_seq) - Number(b.episode_seq)
  );
  if (!sorted.length) {
    return Object.freeze({
      ok: true,
      code: "chain_empty",
      breaks: Object.freeze([]),
      chain_head_hash: WAL_HASH_CHAIN_GENESIS_V0
    });
  }

  let prev = WAL_HASH_CHAIN_GENESIS_V0;
  /** @type {object[]} */
  const breaks = [];

  for (const e of sorted) {
    const expected = foldWorldWalEntryHashV0(e, prev);
    const link = e.identity_link?.chain_head_hash;
    if (link && link !== expected) {
      breaks.push(
        Object.freeze({
          entry_id: e.entry_id,
          episode_seq: e.episode_seq,
          expected,
          actual: link,
          code: "identity_link_mismatch"
        })
      );
    }
    prev = link || expected;
  }

  return Object.freeze({
    ok: breaks.length === 0,
    code: breaks.length ? "chain_break" : "chain_ok",
    breaks: Object.freeze(breaks),
    chain_head_hash: prev,
    entry_count: sorted.length
  });
}

/**
 * @param {{
 *   liveVsWal?: ReturnType<typeof diffLiveSnapshotVsWalEntryV0>,
 *   replayVsWal?: ReturnType<typeof diffLiveSnapshotVsWalEntryV0>,
 *   identityCheck?: ReturnType<typeof verifyWorldIdentityForReplayV0>,
 *   chain?: ReturnType<typeof verifyWalChainConsistencyV0>
 * }} ctx
 */
export function classifyWorldDriftV0(ctx) {
  const identityCheck = ctx.identityCheck;
  const chain = ctx.chain;
  const liveVsWal = ctx.liveVsWal;
  const replayVsWal = ctx.replayVsWal;

  if (identityCheck?.drift === true || chain?.ok === false) {
    return Object.freeze({
      drift_class: ICL_DRIFT_CLASS_V0.IDENTITY_BREAK,
      severity: 3,
      summary: "identity_or_chain_break"
    });
  }

  if (replayVsWal?.ok === true && replayVsWal.mismatches?.length === 0) {
    const liveOnly = liveVsWal?.mismatches || [];
    if (liveOnly.length === 0) {
      return Object.freeze({
        drift_class: ICL_DRIFT_CLASS_V0.NONE,
        severity: 0,
        summary: "same_world"
      });
    }
    return Object.freeze({
      drift_class: ICL_DRIFT_CLASS_V0.SOFT,
      severity: 1,
      summary: "live_snapshot_stale_replay_ok"
    });
  }

  const structuralPaths = new Set([
    "coherence_id",
    "stream_coherence_id",
    "episode_seq",
    "wal_entry_id",
    "experiential_now_id"
  ]);

  const allMismatches = [
    ...(liveVsWal?.mismatches || []),
    ...(replayVsWal?.mismatches || [])
  ];

  if (allMismatches.some((m) => structuralPaths.has(m.path))) {
    return Object.freeze({
      drift_class: ICL_DRIFT_CLASS_V0.STRUCTURAL,
      severity: 2,
      summary: "structural_world_mismatch"
    });
  }

  if (allMismatches.length > 0) {
    return Object.freeze({
      drift_class: ICL_DRIFT_CLASS_V0.SOFT,
      severity: 1,
      summary: "soft_projection_mismatch"
    });
  }

  return Object.freeze({
    drift_class: ICL_DRIFT_CLASS_V0.NONE,
    severity: 0,
    summary: "same_world"
  });
}

/**
 * @param {{
 *   entryId?: string | null,
 *   liveSnapshot?: ReturnType<typeof snapshotLiveWorldForConsistencyV0> | null,
 *   restoreLive?: boolean,
 *   skipReplay?: boolean
 * }} [opts]
 */
export function runWorldIdentityConsistencyHarnessV0(opts = {}) {
  const entryId =
    opts.entryId ||
    getLastWorldActionLogEntryV0()?.entry_id ||
    readRhizohV0().worldEpisode?.wal_entry_id ||
    null;

  const entry = entryId ? getWorldActionLogEntryV0(entryId) : null;
  const liveBefore = opts.liveSnapshot || snapshotLiveWorldForConsistencyV0();

  const identityCheck = verifyWorldIdentityForReplayV0(entry, readWorldIdentityV0());
  const chain = verifyWalChainConsistencyV0(listWorldActionLogEntriesV0(64));
  const liveVsWal = diffLiveSnapshotVsWalEntryV0(liveBefore, entry);

  let replay = null;
  let replayVsWal = Object.freeze({ ok: true, mismatches: Object.freeze([]) });

  if (opts.skipReplay && entry) {
    replayVsWal = diffLiveSnapshotVsWalEntryV0(snapshotLiveWorldForConsistencyV0(), entry);
  }

  return finalizeIdentityConsistencyReportV0({
    entry,
    liveVsWal,
    replayVsWal,
    identityCheck,
    chain,
    replay
  });
}

/**
 * Full harness with replay round-trip (async — avoids replay ↔ ICL import cycle).
 * @param {{
 *   entryId?: string | null,
 *   liveSnapshot?: ReturnType<typeof snapshotLiveWorldForConsistencyV0> | null,
 *   restoreLive?: boolean
 * }} [opts]
 */
export async function runWorldIdentityConsistencyHarnessAsyncV0(opts = {}) {
  const entryId =
    opts.entryId ||
    getLastWorldActionLogEntryV0()?.entry_id ||
    readRhizohV0().worldEpisode?.wal_entry_id ||
    null;

  const entry = entryId ? getWorldActionLogEntryV0(entryId) : null;
  const liveBefore = opts.liveSnapshot || snapshotLiveWorldForConsistencyV0();

  const identityCheck = verifyWorldIdentityForReplayV0(entry, readWorldIdentityV0());
  const chain = verifyWalChainConsistencyV0(listWorldActionLogEntriesV0(64));
  const liveVsWal = diffLiveSnapshotVsWalEntryV0(liveBefore, entry);

  let replay = null;
  let replayVsWal = Object.freeze({ ok: true, mismatches: Object.freeze([]) });

  if (entry?.entry_id) {
    const { replayWorldActionLogEntryV0 } = await import("./rhizohWorldReplayV0.js");
    replay = replayWorldActionLogEntryV0(entry.entry_id, {
      entry,
      runIcl: false,
      restoreLiveAfterIcl: false
    });
    replayVsWal = diffLiveSnapshotVsWalEntryV0(snapshotLiveWorldForConsistencyV0(), entry);
    if (opts.restoreLive !== false) {
      restoreLiveWorldFromConsistencySnapshotV0(liveBefore);
    }
  }

  return finalizeIdentityConsistencyReportV0({
    entry,
    liveVsWal,
    replayVsWal,
    identityCheck,
    chain,
    replay
  });
}

/**
 * @param {object} ctx
 */
function finalizeIdentityConsistencyReportV0(ctx) {
  const { entry, liveVsWal, replayVsWal, identityCheck, chain, replay } = ctx;
  const drift = classifyWorldDriftV0({ liveVsWal, replayVsWal, identityCheck, chain });
  const walPersist = readWalPersistenceStatusV0();

  const equivalence = Object.freeze({
    same_world: drift.drift_class === ICL_DRIFT_CLASS_V0.NONE,
    chain_ok: chain.ok === true,
    identity_ok: identityCheck.ok === true && identityCheck.drift !== true,
    live_matches_wal: liveVsWal.ok === true,
    replay_matches_wal: replayVsWal.ok === true,
    live_replay_equivalent:
      replayVsWal.ok === true &&
      liveVsWal.ok === true &&
      drift.drift_class !== ICL_DRIFT_CLASS_V0.IDENTITY_BREAK
  });

  const report = Object.freeze({
    schema: ICL_SCHEMA_V0,
    atMs: Date.now(),
    entry_id: entry?.entry_id || null,
    episode_seq: entry?.episode_seq ?? null,
    drift,
    equivalence,
    identity_check: identityCheck,
    chain,
    live_vs_wal: liveVsWal,
    replay_vs_wal: replayVsWal,
    replay: replay
      ? Object.freeze({
          entry_id: replay.entry_id,
          identity: replay.identity
        })
      : null,
    persistence: walPersist.persistence,
    world_identity_id: readWorldIdentityV0()?.world_identity_id || null,
    ok:
      equivalence.chain_ok &&
      equivalence.identity_ok &&
      equivalence.replay_matches_wal &&
      drift.drift_class !== ICL_DRIFT_CLASS_V0.IDENTITY_BREAK &&
      drift.drift_class !== ICL_DRIFT_CLASS_V0.STRUCTURAL
  });

  lastHarnessReport = report;
  publishIdentityConsistencyReportV0(report);
  return report;
}

/**
 * @param {ReturnType<typeof runWorldIdentityConsistencyHarnessV0>} report
 */
function publishIdentityConsistencyReportV0(report) {
  if (typeof window === "undefined" || !report) return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.worldIdentityConsistency = report;
  window.__rhizoh.iclLastHarness = report;
  try {
    window.dispatchEvent(
      new CustomEvent(RHIZOH_IDENTITY_CONSISTENCY_EVENT_V0, {
        detail: Object.freeze({ report })
      })
    );
  } catch {
    /* noop */
  }
}

export function readLastIdentityConsistencyReportV0() {
  return (
    lastHarnessReport ||
    (typeof window !== "undefined" ? window.__rhizoh?.worldIdentityConsistency : null) ||
    null
  );
}

export function resetRhizohIdentityConsistencyLayerForTestV0() {
  lastHarnessReport = null;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.worldIdentityConsistency;
    delete window.__rhizoh.iclLastHarness;
  }
}
