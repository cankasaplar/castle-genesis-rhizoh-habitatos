/**
 * Sprint C.1 — Peer WAL convergence wire.
 *
 * gateway WS peer feed → ingestRemoteWalHistoryV0 → merge → replay witness → quarantine | accept
 */

import {
  mergeWalHistoriesV0,
  reconcileWalReplayAgainstSealV0,
  computeWalReplayWitnessHashV0
} from "./walRealityConvergenceV0.js";
import {
  getWorldRuntimeDaemonStateV0,
  ingestRemoteWalHistoryV0,
  appendLocalWalHistoryEntryV0
} from "./worldRuntimeDaemonQueueV0.js";
import { peerWalPolicyFromProfileV0, resolveSubstrateAuthorityProfileV0 } from "./substrateAuthorityProfileV0.js";
import { observePeerWalConvergenceMetricsV0 } from "./realityHealthMetricsV0.js";

export const PEER_WAL_CONVERGENCE_WIRE_SCHEMA_V0 = "castle.rhizoh.peer_wal_convergence_wire.v0";

/** Live-debug scenario labels. */
export const PEER_WAL_SCENARIO_V0 = Object.freeze({
  ACCEPT: "accept",
  STALE: "stale",
  DIVERGENT: "divergent",
  UNSIGNED: "unsigned",
  EPOCH_AHEAD: "epoch_ahead",
  REPLAY_MISMATCH: "replay_mismatch"
});

export const PEER_WAL_DEFAULTS_V0 = Object.freeze({
  maxFeedAgeMs: 45_000,
  epochAheadTolerance: 0,
  maxDebugEvents: 64
});

/**
 * @typedef {Object} WalPeerFeedV0
 * @property {unknown[]} [history]
 * @property {boolean} [signed]
 * @property {number} [observedAtMs]
 * @property {number} [claimedRealityEpoch]
 * @property {string} [claimedReplayWitness]
 * @property {number} [maxAgeMs]
 */

/**
 * @param {WalPeerFeedV0} feed
 * @param {{ castleId: string, nowMs?: number, localEpoch?: number, localWitness?: string }} ctx
 */
export function classifyPeerWalFeedV0(feed, ctx) {
  const nowMs = Number(ctx.nowMs) || Date.now();
  const castleId = String(ctx.castleId || "peer").slice(0, 64);
  const localEpoch = Number(ctx.localEpoch) || 0;
  const profilePolicy = peerWalPolicyFromProfileV0();
  const maxAge = Number(feed?.maxAgeMs) || profilePolicy.maxFeedAgeMs || PEER_WAL_DEFAULTS_V0.maxFeedAgeMs;
  const epochAheadTol =
    Number(ctx.epochAheadTolerance) ||
    profilePolicy.epochAheadTolerance ||
    PEER_WAL_DEFAULTS_V0.epochAheadTolerance;
  const observedAtMs = Number(feed?.observedAtMs) || 0;
  const history = Array.isArray(feed?.history) ? feed.history : [];

  if (feed?.signed === false) {
    return { scenario: PEER_WAL_SCENARIO_V0.UNSIGNED, castleId, reason: "feed_unsigned" };
  }
  for (const row of history) {
    if (row && typeof row === "object" && row.signed === false) {
      return { scenario: PEER_WAL_SCENARIO_V0.UNSIGNED, castleId, reason: "history_entry_unsigned" };
    }
  }

  if (observedAtMs > 0 && nowMs - observedAtMs > maxAge) {
    return {
      scenario: PEER_WAL_SCENARIO_V0.STALE,
      castleId,
      reason: "observed_at_expired",
      ageMs: nowMs - observedAtMs
    };
  }

  const claimedEpoch = Number(feed?.claimedRealityEpoch);
  if (Number.isFinite(claimedEpoch) && claimedEpoch > localEpoch + epochAheadTol) {
    return {
      scenario: PEER_WAL_SCENARIO_V0.EPOCH_AHEAD,
      castleId,
      reason: "claimed_epoch_ahead",
      localEpoch,
      claimedEpoch
    };
  }

  const claimedWitness = String(feed?.claimedReplayWitness || "").trim();
  const localWitness = String(ctx.localWitness || "").trim();
  if (claimedWitness && localWitness && claimedWitness !== localWitness) {
    return {
      scenario: PEER_WAL_SCENARIO_V0.REPLAY_MISMATCH,
      castleId,
      reason: "claimed_witness_mismatch",
      claimedWitness,
      localWitness
    };
  }

  return { scenario: PEER_WAL_SCENARIO_V0.ACCEPT, castleId, reason: "precheck_ok" };
}

/**
 * Full convergence pass for one peer feed.
 *
 * @param {WalPeerFeedV0} feed
 * @param {{
 *   castleId: string,
 *   getState: () => import("../../studio/types/rskOntology.js").StudioKernelState,
 *   nowMs?: number
 * }} ctx
 */
export function processPeerWalConvergenceV0(feed, ctx) {
  const nowMs = Number(ctx.nowMs) || Date.now();
  const castleId = String(ctx.castleId || "peer").slice(0, 64);
  const kernel = ctx.getState();
  const localEpoch = kernel.realitySeal?.realityEpoch ?? 0;
  const localHistory = getWorldRuntimeDaemonStateV0().walHistoryLocal;
  const localWitness = computeWalReplayWitnessHashV0(localHistory);

  const pre = classifyPeerWalFeedV0(feed, {
    castleId,
    nowMs,
    localEpoch,
    localWitness
  });

  const history = Array.isArray(feed?.history) ? feed.history : [];
  ingestRemoteWalHistoryV0(history, castleId);

  const mergeResult = mergeWalHistoriesV0(localHistory, [history]);
  const mergedWitness = computeWalReplayWitnessHashV0(mergeResult.merged);
  const claimedWitness = String(feed?.claimedReplayWitness || "").trim();
  let replay = { ok: true, witness: mergedWitness, expected: claimedWitness || localWitness };
  if (claimedWitness) {
    replay = reconcileWalReplayAgainstSealV0(claimedWitness, mergeResult.merged);
  } else if (localEpoch > 0 && localHistory.length > 0) {
    replay = reconcileWalReplayAgainstSealV0(localWitness, mergeResult.merged);
  }

  let scenario = pre.scenario;
  let disposition = "accept";

  if (pre.scenario === PEER_WAL_SCENARIO_V0.ACCEPT && mergeResult.conflicts.some((c) => c.rejected.includes(castleId))) {
    scenario = PEER_WAL_SCENARIO_V0.DIVERGENT;
  }
  if (pre.scenario === PEER_WAL_SCENARIO_V0.ACCEPT && claimedWitness && !replay.ok) {
    scenario = PEER_WAL_SCENARIO_V0.REPLAY_MISMATCH;
  }

  const quarantineScenarios = new Set([
    PEER_WAL_SCENARIO_V0.UNSIGNED,
    PEER_WAL_SCENARIO_V0.STALE,
    PEER_WAL_SCENARIO_V0.EPOCH_AHEAD,
    PEER_WAL_SCENARIO_V0.REPLAY_MISMATCH
  ]);
  if (scenario === PEER_WAL_SCENARIO_V0.DIVERGENT) {
    quarantineScenarios.add(PEER_WAL_SCENARIO_V0.DIVERGENT);
  }

  if (quarantineScenarios.has(scenario)) {
    disposition = "quarantine";
  }
  const profile = resolveSubstrateAuthorityProfileV0();
  if (scenario === PEER_WAL_SCENARIO_V0.UNSIGNED && !profile.rejectUnsignedWalIngress) {
    disposition = "accept";
  }

  const daemon = getWorldRuntimeDaemonStateV0();
  if (!daemon.peerConvergence) {
    daemon.peerConvergence = { quarantineByCastleId: {}, acceptedByCastleId: {}, debugEvents: [] };
  }
  const record = {
    castleId,
    scenario,
    disposition,
    atMs: nowMs,
    pre,
    merge: {
      mergedCount: mergeResult.merged.length,
      conflictCount: mergeResult.conflicts.length,
      droppedUnsigned: mergeResult.droppedUnsigned
    },
    replay,
    mergedWitness,
    localWitness,
    localEpoch,
    historyLen: history.length
  };

  if (disposition === "quarantine") {
    daemon.peerConvergence.quarantineByCastleId[castleId] = record;
    delete daemon.peerConvergence.acceptedByCastleId[castleId];
  } else {
    daemon.peerConvergence.acceptedByCastleId[castleId] = record;
    delete daemon.peerConvergence.quarantineByCastleId[castleId];
  }

  pushPeerWalDebugEventV0(record);
  observePeerWalConvergenceMetricsV0(record);

  return record;
}

/**
 * @param {Record<string, unknown>} event
 */
function pushPeerWalDebugEventV0(event) {
  const daemon = getWorldRuntimeDaemonStateV0();
  if (!daemon.peerConvergence) {
    daemon.peerConvergence = { quarantineByCastleId: {}, acceptedByCastleId: {}, debugEvents: [] };
  }
  daemon.peerConvergence.debugEvents.push(event);
  if (daemon.peerConvergence.debugEvents.length > PEER_WAL_DEFAULTS_V0.maxDebugEvents) {
    daemon.peerConvergence.debugEvents = daemon.peerConvergence.debugEvents.slice(
      -PEER_WAL_DEFAULTS_V0.maxDebugEvents
    );
  }
}

/**
 * Parse gateway `CASTLE_WAL_PEER_ROOM` envelope.
 *
 * @param {Record<string, unknown>} envelope
 */
export function extractPeerWalFeedsFromRoomEnvelopeV0(envelope) {
  const payload = envelope?.payload && typeof envelope.payload === "object" ? envelope.payload : envelope;
  const feeds = payload?.peerFeeds ?? payload?.walPeerFeeds;
  if (!Array.isArray(feeds)) return [];
  return feeds
    .map((f) => {
      const o = f && typeof f === "object" ? f : {};
      const castleId = String(o.castleId || o.sourceCastleId || "").trim();
      const walPeerFeed = o.walPeerFeed ?? o.feed ?? o;
      if (!castleId) return null;
      return { castleId, walPeerFeed, observedAtMs: Number(o.lastMs) || Number(walPeerFeed?.observedAtMs) };
    })
    .filter(Boolean);
}

/**
 * Process all peer feeds from a WS room broadcast.
 *
 * @param {Record<string, unknown>} envelope
 * @param {{ getState: () => import("../../studio/types/rskOntology.js").StudioKernelState, nowMs?: number }} ctx
 */
export function ingestPeerWalRoomBroadcastV0(envelope, ctx) {
  const feeds = extractPeerWalFeedsFromRoomEnvelopeV0(envelope);
  const results = [];
  for (const row of feeds) {
    const feed = {
      ...row.walPeerFeed,
      observedAtMs: Number(row.walPeerFeed?.observedAtMs) || Number(row.observedAtMs) || Date.now()
    };
    results.push(processPeerWalConvergenceV0(feed, { castleId: row.castleId, getState: ctx.getState, nowMs: ctx.nowMs }));
  }
  return results;
}

/**
 * Build outbound peer feed from local daemon history.
 *
 * @param {() => import("../../studio/types/rskOntology.js").StudioKernelState} getState
 * @param {{ castleId?: string }} [opts]
 */
export function buildLocalWalPeerFeedV0(getState, opts = {}) {
  const kernel = getState();
  const daemon = getWorldRuntimeDaemonStateV0();
  const castleId = String(opts.castleId || "local").slice(0, 64);
  const history = daemon.walHistoryLocal;
  const witness = computeWalReplayWitnessHashV0(history);
  return {
    castleId,
    walPeerFeed: {
      history,
      signed: true,
      observedAtMs: Date.now(),
      claimedRealityEpoch: kernel.realitySeal?.realityEpoch ?? 0,
      claimedReplayWitness: witness,
      maxAgeMs: PEER_WAL_DEFAULTS_V0.maxFeedAgeMs
    }
  };
}

/**
 * Dev / debug — inject synthetic peer scenarios.
 *
 * @param {keyof typeof PEER_WAL_SCENARIO_V0 | string} scenario
 * @param {{ getState: () => import("../../studio/types/rskOntology.js").StudioKernelState, castleId?: string }} ctx
 */
export function simulatePeerWalScenarioV0(scenario, ctx) {
  const castleId = String(ctx.castleId || `sim:${scenario}`).slice(0, 64);
  const kernel = ctx.getState();
  const localEpoch = kernel.realitySeal?.realityEpoch ?? 0;
  const localHistory = getWorldRuntimeDaemonStateV0().walHistoryLocal;
  const witness = computeWalReplayWitnessHashV0(localHistory);

  const baseEntry = {
    diffId: "sim:ob:1",
    kind: "obstacle_delta",
    lamport: 1,
    castleId,
    payload: { discs: [{ x: 1, z: 1, r: 1 }] },
    signed: true
  };

  /** @type {import("./walRealityConvergenceV0.js").WalHistoryEntryV0[]} */
  let history = [baseEntry];
  let feed = {
    history,
    signed: true,
    observedAtMs: Date.now(),
    claimedRealityEpoch: localEpoch,
    claimedReplayWitness: witness,
    maxAgeMs: PEER_WAL_DEFAULTS_V0.maxFeedAgeMs
  };

  const key = String(scenario || "").toLowerCase();
  if (key === "stale" || key === PEER_WAL_SCENARIO_V0.STALE) {
    feed = { ...feed, observedAtMs: Date.now() - PEER_WAL_DEFAULTS_V0.maxFeedAgeMs - 5000 };
  } else if (key === "unsigned" || key === PEER_WAL_SCENARIO_V0.UNSIGNED) {
    feed = { ...feed, signed: false, history: [{ ...baseEntry, signed: false }] };
  } else if (key === "epoch_ahead" || key === PEER_WAL_SCENARIO_V0.EPOCH_AHEAD) {
    feed = { ...feed, claimedRealityEpoch: localEpoch + 5 };
  } else if (key === "replay_mismatch" || key === PEER_WAL_SCENARIO_V0.REPLAY_MISMATCH) {
    feed = { ...feed, claimedReplayWitness: "hdeadbeef0" };
  } else if (key === "divergent" || key === PEER_WAL_SCENARIO_V0.DIVERGENT) {
    history = [{ ...baseEntry, payload: { discs: [{ x: 9, z: 9, r: 2 }] }, lamport: 99 }];
    feed = { ...feed, history };
    appendLocalWalHistoryEntryV0(
      { diffId: "sim:local:1", kind: "obstacle_delta", payload: { discs: [{ x: 0, z: 0, r: 1 }] }, signed: true },
      { castleId: "local", lamport: 1 }
    );
  }

  return processPeerWalConvergenceV0(feed, { castleId, getState: ctx.getState });
}

export function buildPeerWalConvergenceDebugSnapshotV0(getState) {
  const daemon = getWorldRuntimeDaemonStateV0();
  const pc = daemon.peerConvergence ?? {
    quarantineByCastleId: {},
    acceptedByCastleId: {},
    debugEvents: []
  };
  const kernel = getState?.() ?? null;
  return {
    schema: PEER_WAL_CONVERGENCE_WIRE_SCHEMA_V0,
    ts: Date.now(),
    localEpoch: kernel?.realitySeal?.realityEpoch ?? 0,
    localWalHistoryLen: daemon.walHistoryLocal.length,
    quarantine: { ...pc.quarantineByCastleId },
    accepted: { ...pc.acceptedByCastleId },
    recentEvents: [...(pc.debugEvents || [])].slice(-16),
    scenarios: Object.values(PEER_WAL_SCENARIO_V0)
  };
}
