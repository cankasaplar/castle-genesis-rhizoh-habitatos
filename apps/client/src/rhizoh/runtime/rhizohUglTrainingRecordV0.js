/**
 * UGL Training Record WAL — Position / Expected / Played / EvalDelta / Outcome.
 * RESEARCH-ONLY — learning projection only.
 */

import { RHIZOH_UGL_GAME_TYPE_V0 } from "./rhizohUglSchemaV0.js";

export const RHIZOH_UGL_TRAINING_RECORD_SCHEMA_V0 = "castle.rhizoh.ugl_training_record.v0";
export const RHIZOH_UGL_TRAINING_RECORD_LS_KEY_V0 = "rhizoh.ugl.training_records.v0";
export const RHIZOH_UGL_TRAINING_RECORD_EVENT_V0 = "rhizoh:ugl-training-record-v0";

const MAX_RECORDS_V0 = 512;

/** @type {object[]} */
let sessionRingV0 = [];

function readPersistedRecordsV0() {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(RHIZOH_UGL_TRAINING_RECORD_LS_KEY_V0);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePersistedRecordsV0(ring) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(RHIZOH_UGL_TRAINING_RECORD_LS_KEY_V0, JSON.stringify(ring.slice(-MAX_RECORDS_V0)));
  } catch {
    /* noop */
  }
}

/**
 * @param {{
 *   position?: string,
 *   expectedMove?: string|null,
 *   playedMove?: string|null,
 *   evalDelta?: number|null,
 *   outcome?: string|null,
 *   leagueTier?: string,
 *   uglReward?: number|null,
 *   matchId?: string|null,
 *   slotId?: number|null,
 *   source?: string,
 *   gameType?: string
 * }} row
 */
export function appendUglTrainingRecordV0(row = {}) {
  const record = Object.freeze({
    schema: RHIZOH_UGL_TRAINING_RECORD_SCHEMA_V0,
    gameType: row.gameType || RHIZOH_UGL_GAME_TYPE_V0.CHESS,
    position: String(row.position || "").slice(0, 80) || null,
    expectedMove: row.expectedMove ? String(row.expectedMove) : null,
    playedMove: row.playedMove ? String(row.playedMove) : null,
    evalDelta: Number.isFinite(Number(row.evalDelta)) ? Number(row.evalDelta) : null,
    outcome: row.outcome != null ? String(row.outcome) : null,
    leagueTier: String(row.leagueTier || "ARENA"),
    uglReward: Number.isFinite(Number(row.uglReward)) ? Number(row.uglReward) : null,
    matchId: row.matchId || null,
    slotId: row.slotId ?? null,
    source: row.source || "unknown",
    atMs: Date.now()
  });

  sessionRingV0 = [record, ...sessionRingV0].slice(0, MAX_RECORDS_V0);
  const persisted = [...readPersistedRecordsV0(), record].slice(-MAX_RECORDS_V0);
  writePersistedRecordsV0(persisted);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(RHIZOH_UGL_TRAINING_RECORD_EVENT_V0, { detail: record }));
  }
  return record;
}

/**
 * @param {object} policyDiff
 * @param {{ fenBefore?: string, leagueTier?: string, uglReward?: number }} [ctx]
 */
export function trainingRecordFromPolicyDiffV0(policyDiff = {}, ctx = {}) {
  const engineCp = policyDiff.winningLine?.cp ?? policyDiff.winningLine?.scoreCp;
  return appendUglTrainingRecordV0({
    position: ctx.fenBefore || null,
    expectedMove: policyDiff.engineBest || policyDiff.winningLine?.bestMove || null,
    playedMove: policyDiff.played || null,
    evalDelta: Number.isFinite(Number(engineCp)) ? Number(engineCp) : null,
    leagueTier: ctx.leagueTier,
    uglReward: ctx.uglReward,
    matchId: policyDiff.matchId,
    slotId: policyDiff.slotId,
    source: "policy_diff"
  });
}

/**
 * @param {object} predictionRow
 * @param {{ leagueTier?: string }} [ctx]
 */
export function trainingRecordFromPredictionScoreV0(predictionRow = {}, ctx = {}) {
  const rank = Number(predictionRow.matchedRank);
  const evalProxy = rank === 1 ? 0 : rank > 1 ? rank * 25 : 100;
  return appendUglTrainingRecordV0({
    position: predictionRow.fen,
    expectedMove: predictionRow.engineBest,
    playedMove: predictionRow.played,
    evalDelta: evalProxy,
    leagueTier: ctx.leagueTier,
    uglReward: Number(predictionRow.predictionAccuracy) || null,
    matchId: predictionRow.matchId,
    slotId: predictionRow.slotId,
    source: "prediction_score"
  });
}

export function readUglTrainingRecordsV0(limit = 64) {
  const merged = [...sessionRingV0, ...readPersistedRecordsV0()];
  const seen = new Set();
  const out = [];
  for (const row of merged) {
    const key = `${row.atMs}_${row.matchId}_${row.playedMove}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    if (out.length >= limit) break;
  }
  return Object.freeze(out);
}

export function getUglTrainingRecordSnapshotV0() {
  const records = readUglTrainingRecordsV0(MAX_RECORDS_V0);
  const withOutcome = records.filter((r) => r.outcome);
  const aligned = records.filter(
    (r) => r.expectedMove && r.playedMove && r.expectedMove === r.playedMove
  );
  return Object.freeze({
    schema: `${RHIZOH_UGL_TRAINING_RECORD_SCHEMA_V0}.snapshot`,
    total: records.length,
    withOutcome: withOutcome.length,
    engineAligned: aligned.length,
    alignmentRate:
      records.length > 0 ? Number((aligned.length / records.length).toFixed(3)) : null,
    recent: Object.freeze(records.slice(0, 8)),
    atMs: Date.now()
  });
}

/** @internal vitest */
export function __resetUglTrainingRecordsForTestV0() {
  sessionRingV0 = [];
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(RHIZOH_UGL_TRAINING_RECORD_LS_KEY_V0);
    } catch {
      /* noop */
    }
  }
}
