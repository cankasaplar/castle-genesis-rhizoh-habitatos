/**
 * Sprint C — multi-client reality convergence (WAL history merge + replay reconciliation).
 *
 * Executable subset of ROS v1/v2 federation arbitration — spatial truth only.
 * Does not advance `realityEpoch`; produces merged diff proposals for ingress/sealer.
 */

import { computeWalDiffPayloadHashV0 } from "./submitWorldAuthoritySealCandidateV0.js";
import { computeExecutionCommandHashV0 } from "./executionCommandHashV0.js";

export const WAL_REALITY_CONVERGENCE_SCHEMA_V0 = "castle.rhizoh.wal_reality_convergence.v0";

/**
 * @typedef {Object} WalHistoryEntryV0
 * @property {string} diffId
 * @property {string} kind
 * @property {string} [roomScope]
 * @property {number} lamport
 * @property {string} castleId
 * @property {number} [streamSeq]
 * @property {unknown} [payload]
 * @property {string} payloadHash
 * @property {boolean} [signed]
 */

/**
 * @param {WalHistoryEntryV0} a
 * @param {WalHistoryEntryV0} b
 */
function compareWalHistoryOrderV0(a, b) {
  const la = Number(a.lamport) || 0;
  const lb = Number(b.lamport) || 0;
  if (la !== lb) return la - lb;
  const sa = Number(a.streamSeq) || 0;
  const sb = Number(b.streamSeq) || 0;
  if (sa !== sb) return sa - sb;
  return String(a.castleId).localeCompare(String(b.castleId));
}

/**
 * @param {WalHistoryEntryV0} entry
 */
function normalizeWalHistoryEntryV0(entry) {
  const diffId = String(entry?.diffId || "").trim();
  if (!diffId) return null;
  const kind = String(entry?.kind || "").trim();
  const castleId = String(entry?.castleId || "local").slice(0, 64);
  const payload = entry?.payload ?? null;
  const payloadHash =
    String(entry?.payloadHash || "").trim() ||
    computeWalDiffPayloadHashV0({
      diffId,
      kind,
      roomScope: entry?.roomScope,
      streamSeq: entry?.streamSeq,
      payload
    });
  return {
    diffId,
    kind,
    roomScope: entry?.roomScope,
    lamport: Number(entry?.lamport) || 0,
    castleId,
    streamSeq: entry?.streamSeq,
    payload,
    payloadHash,
    signed: entry?.signed !== false
  };
}

/**
 * Merge divergent WAL histories from multiple clients/castles.
 *
 * Tie-break: higher lamport → lower lexicographic castleId on conflict.
 *
 * @param {WalHistoryEntryV0[]} localHistory
 * @param {WalHistoryEntryV0[][]} remoteHistories
 * @returns {{
 *   merged: WalHistoryEntryV0[],
 *   conflicts: { diffId: string, winners: string[], rejected: string[] }[],
 *   droppedUnsigned: number
 * }}
 */
export function mergeWalHistoriesV0(localHistory, remoteHistories) {
  const local = (Array.isArray(localHistory) ? localHistory : [])
    .map(normalizeWalHistoryEntryV0)
    .filter(Boolean);
  const remotes = Array.isArray(remoteHistories) ? remoteHistories : [];
  /** @type {Map<string, WalHistoryEntryV0>} */
  const byDiffId = new Map();
  /** @type {{ diffId: string, winners: string[], rejected: string[] }[]} */
  const conflicts = [];
  let droppedUnsigned = 0;

  const all = [...local];
  for (const hist of remotes) {
    for (const raw of Array.isArray(hist) ? hist : []) {
      const n = normalizeWalHistoryEntryV0(raw);
      if (!n) continue;
      if (!n.signed) {
        droppedUnsigned += 1;
        continue;
      }
      all.push(n);
    }
  }

  all.sort(compareWalHistoryOrderV0);

  for (const entry of all) {
    const prev = byDiffId.get(entry.diffId);
    if (!prev) {
      byDiffId.set(entry.diffId, entry);
      continue;
    }
    if (prev.payloadHash === entry.payloadHash) continue;

    const winner = compareWalHistoryOrderV0(entry, prev) >= 0 ? entry : prev;
    const loser = winner === entry ? prev : entry;
    byDiffId.set(entry.diffId, winner);
    conflicts.push({
      diffId: entry.diffId,
      winners: [winner.castleId],
      rejected: [loser.castleId]
    });
  }

  const merged = [...byDiffId.values()].sort(compareWalHistoryOrderV0);
  return { merged, conflicts, droppedUnsigned };
}

/**
 * Deterministic replay witness — hash of ordered WAL bodies (pre-seal).
 *
 * @param {WalHistoryEntryV0[]} orderedHistory
 */
export function computeWalReplayWitnessHashV0(orderedHistory) {
  const list = Array.isArray(orderedHistory) ? orderedHistory : [];
  return computeExecutionCommandHashV0({
    lane: "wal_replay",
    provenance: "convergence",
    namespace: "world_authority",
    type: "replay_witness",
    payload: list.map((e) => ({
      diffId: e.diffId,
      kind: e.kind,
      roomScope: e.roomScope ?? null,
      payloadHash: e.payloadHash,
      lamport: e.lamport,
      castleId: e.castleId
    }))
  });
}

/**
 * Replay reconciliation — does merged history witness match sealed snapshot hash?
 *
 * @param {string} sealedSnapshotHash
 * @param {WalHistoryEntryV0[]} orderedHistory
 */
export function reconcileWalReplayAgainstSealV0(sealedSnapshotHash, orderedHistory) {
  const witness = computeWalReplayWitnessHashV0(orderedHistory);
  const expected = String(sealedSnapshotHash || "").trim();
  const ok = !!expected && witness === expected;
  return {
    ok,
    witness,
    expected,
    diffCount: orderedHistory?.length ?? 0,
    code: ok ? undefined : "WAL_REPLAY_WITNESS_MISMATCH"
  };
}

/**
 * @param {{ merged: WalHistoryEntryV0[], conflicts: unknown[], droppedUnsigned: number }} mergeResult
 */
export function buildWalConvergenceSnapshotV0(mergeResult) {
  return {
    schema: WAL_REALITY_CONVERGENCE_SCHEMA_V0,
    ts: Date.now(),
    mergedCount: mergeResult?.merged?.length ?? 0,
    conflictCount: mergeResult?.conflicts?.length ?? 0,
    droppedUnsigned: mergeResult?.droppedUnsigned ?? 0
  };
}
