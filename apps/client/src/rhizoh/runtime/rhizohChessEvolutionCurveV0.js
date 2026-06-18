/**
 * Unified chess learning evolution curve — session + lifetime + corpus + weights.
 * window.__rhizoh.chessEvolutionCurve()
 * RESEARCH-ONLY — model state evolution tracker (not log counter only).
 */

import { buildRhizohChessLearningReportV0 } from "./rhizohChessLearningReportV0.js";
import { backfillChessLifetimeStatsFromStoresV0 } from "./rhizohChessLifetimeStatsV0.js";
import { readChessMemoryStoreV0 } from "./chessMemoryStoreV0.js";
import { readChessLearningWeightsV0 } from "./chessLearningWeightsV0.js";
import { CHESS_CLUSTER_GAME_END_EVENT_V0, CHESS_CLUSTER_MOVE_EVENT_V0 } from "./chessGameClusterV0.js";
import { CHESS_CLUSTER_POLICY_DIFF_EVENT_V0 } from "./chessClusterLearningTraceV0.js";
import { RHIZOH_CHESS_PREDICTION_SCORE_EVENT_V0 } from "./rhizohChessLearningReportV0.js";
import { CHESS_MATCH_ANALYZED_EVENT_V0 } from "./chessLearningBridgeV0.js";
import { CHESS_HISTORY_IMPORTED_EVENT_V0 } from "./chessHistoryLoaderV0.js";
import {
  idbSimGetV0,
  openRhizohSimulationDbV0,
  SIM_META_EVENT_SEQ_KEY_V0,
  SIM_STORE_META_V0
} from "../../storage/rhizohSimulationDbV0.js";
import { getChessEngineContentionSnapshotV0 } from "./chessEngineContentionGateV0.js";

export const RHIZOH_CHESS_EVOLUTION_CURVE_SCHEMA_V0 = "castle.rhizoh.chess_evolution_curve.v0";
export const RHIZOH_CHESS_EVOLUTION_CURVE_LS_KEY_V0 = "rhizoh.chess.evolution_curve.v0";

const MAX_POINTS_V0 = 128;
const RECORD_THROTTLE_MS_V0 = 5 * 60 * 1000;

let listenersInstalledV0 = false;
let lastRecordedAtMsV0 = 0;

function readCurveRingV0() {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(RHIZOH_CHESS_EVOLUTION_CURVE_LS_KEY_V0);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCurveRingV0(ring) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(RHIZOH_CHESS_EVOLUTION_CURVE_LS_KEY_V0, JSON.stringify(ring.slice(-MAX_POINTS_V0)));
  } catch {
    /* noop */
  }
}

function weightFingerprintV0(weights) {
  return [
    weights.matchesLearned,
    weights.aggressionBias,
    weights.winForcingWeight,
    weights.riskPenaltyWeight
  ]
    .map((n) => Number(n).toFixed(3))
    .join("|");
}

async function readWorldEventSeqV0() {
  if (typeof indexedDB === "undefined") return null;
  try {
    const db = await openRhizohSimulationDbV0();
    const row = await idbSimGetV0(db, SIM_STORE_META_V0, SIM_META_EVENT_SEQ_KEY_V0);
    db.close();
    const seq = Number(row?.value);
    return Number.isFinite(seq) ? seq : null;
  } catch {
    return null;
  }
}

function resolveTrendPctV0(ring, field, current) {
  if (ring.length < 2 || current == null) return null;
  const oldest = Number(ring[0]?.[field]);
  const latest = Number(ring[ring.length - 1]?.[field] ?? current);
  if (!Number.isFinite(oldest) || oldest === 0) return null;
  const pct = Math.round(((latest - oldest) / oldest) * 100);
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

/**
 * Capture unified snapshot from all learning layers.
 */
export function captureChessEvolutionSnapshotV0(extra = {}) {
  const session = buildRhizohChessLearningReportV0();
  const lifetime = backfillChessLifetimeStatsFromStoresV0();
  const memory = readChessMemoryStoreV0();
  const weights = readChessLearningWeightsV0();
  const contention = getChessEngineContentionSnapshotV0();

  return Object.freeze({
    schema: `${RHIZOH_CHESS_EVOLUTION_CURVE_SCHEMA_V0}.point`,
    day: new Date().toISOString().slice(0, 10),
    atMs: Date.now(),
    sessionMoves: session.totalMovesSeen,
    sessionGamesObserved: session.gamesObserved,
    sessionGamesCompleted: session.gamesCompleted,
    lifetimeMoves: lifetime.movesSeen || 0,
    lifetimeGamesCompleted: lifetime.gamesCompleted,
    lifetimeDriftEvents: lifetime.driftEvents,
    corpusGames: memory.games?.length || 0,
    graphVersion: memory.graphVersion,
    predictionAccuracy: session.predictionAccuracy,
    stockfishAgreement: session.stockfishAgreement,
    avgDrift: session.avgDrift,
    matchesLearned: weights.matchesLearned,
    weightFingerprint: weightFingerprintV0(weights),
    worldEventSeq: extra.worldEventSeq ?? null,
    engineContended: contention.contended,
    reason: extra.reason || "snapshot"
  });
}

/**
 * @param {{ force?: boolean, reason?: string, worldEventSeq?: number | null }} [opts]
 */
export function recordChessEvolutionPointV0(opts = {}) {
  const now = Date.now();
  if (!opts.force && now - lastRecordedAtMsV0 < RECORD_THROTTLE_MS_V0) {
    return null;
  }
  lastRecordedAtMsV0 = now;
  const point = captureChessEvolutionSnapshotV0({
    reason: opts.reason || "record",
    worldEventSeq: opts.worldEventSeq ?? null
  });
  const ring = [...readCurveRingV0(), point];
  writeCurveRingV0(ring);
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.chessEvolutionCurveLast = point;
  }
  return point;
}

/**
 * Build unified evolution curve report.
 */
export async function buildRhizohChessEvolutionCurveV0() {
  const worldEventSeq = await readWorldEventSeqV0();
  const current = captureChessEvolutionSnapshotV0({ worldEventSeq, reason: "build" });
  recordChessEvolutionPointV0({ force: false, worldEventSeq, reason: "build_throttled" });

  const ring = readCurveRingV0();
  const curve = Object.freeze(ring.map((p) => Object.freeze({ ...p })));

  const report = Object.freeze({
    schema: RHIZOH_CHESS_EVOLUTION_CURVE_SCHEMA_V0,
    current,
    curve,
    curvePoints: curve.length,
    trends: Object.freeze({
      lifetimeMoves7d: resolveTrendPctV0(
        ring.filter((p) => Date.now() - Number(p.atMs) < 7 * 86400000),
        "lifetimeMoves",
        current.lifetimeMoves
      ),
      predictionAccuracy7d: resolveTrendPctV0(
        ring.filter((p) => p.predictionAccuracy != null),
        "predictionAccuracy",
        current.predictionAccuracy
      ),
      corpusGames7d: resolveTrendPctV0(ring, "corpusGames", current.corpusGames)
    }),
    continuity: Object.freeze({
      worldEventSeq,
      lifetimeMoves: current.lifetimeMoves,
      sessionMoves: current.sessionMoves,
      corpusGames: current.corpusGames,
      graphVersion: current.graphVersion,
      layersUnified: true,
      note: "session + lifetime ledger + offline corpus + weight fingerprint"
    }),
    engineContention: getChessEngineContentionSnapshotV0(),
    atMs: Date.now()
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.chessEvolutionCurveLast = report;
  }
  return report;
}

export function ensureRhizohChessEvolutionCurveV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  if (!window.__rhizoh.chessEvolutionCurve) {
    window.__rhizoh.chessEvolutionCurve = () => buildRhizohChessEvolutionCurveV0();
  }
  if (listenersInstalledV0) return window.__rhizoh.chessEvolutionCurve;
  listenersInstalledV0 = true;

  const bump = (reason) => {
    void readWorldEventSeqV0().then((seq) => {
      recordChessEvolutionPointV0({ force: true, worldEventSeq: seq, reason });
    });
  };

  window.addEventListener(CHESS_CLUSTER_MOVE_EVENT_V0, () => bump("cluster_move"));
  window.addEventListener(CHESS_CLUSTER_GAME_END_EVENT_V0, () => bump("game_end"));
  window.addEventListener(CHESS_CLUSTER_POLICY_DIFF_EVENT_V0, () => bump("policy_diff"));
  window.addEventListener(RHIZOH_CHESS_PREDICTION_SCORE_EVENT_V0, () => bump("prediction_score"));
  window.addEventListener(CHESS_MATCH_ANALYZED_EVENT_V0, () => bump("match_analyzed"));
  window.addEventListener(CHESS_HISTORY_IMPORTED_EVENT_V0, () => bump("corpus_import"));

  void readWorldEventSeqV0().then((seq) => {
    recordChessEvolutionPointV0({ force: true, worldEventSeq: seq, reason: "boot_backfill" });
  });

  return window.__rhizoh.chessEvolutionCurve;
}

/** @internal vitest */
export function __resetRhizohChessEvolutionCurveForTestV0() {
  listenersInstalledV0 = false;
  lastRecordedAtMsV0 = 0;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(RHIZOH_CHESS_EVOLUTION_CURVE_LS_KEY_V0);
    } catch {
      /* noop */
    }
  }
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.chessEvolutionCurve;
    delete window.__rhizoh.chessEvolutionCurveLast;
  }
}
