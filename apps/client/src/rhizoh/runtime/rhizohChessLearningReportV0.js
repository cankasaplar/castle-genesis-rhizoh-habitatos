/**
 * Rhizoh chess learning report — observable aggregate from cluster monitor + memory graph.
 * window.__rhizoh.learningReport() — DevTools / shadow prod observability.
 * RESEARCH-ONLY — interpretation only; no execution authority.
 */

import { CHESS_CLUSTER_GAME_END_EVENT_V0, CHESS_CLUSTER_MOVE_EVENT_V0 } from "./chessGameClusterV0.js";
import { getChessLearningMonitorSnapshotV0 } from "./chessLearningMonitorV0.js";
import { getChessClusterMemoryGraphSnapshotV0, listChessClusterMemoryNodesV0 } from "./chessClusterMemoryGraphV0.js";
import { CHESS_CLUSTER_POLICY_DIFF_EVENT_V0 } from "./chessClusterLearningTraceV0.js";
import { readChessLearningWeightsV0 } from "./chessLearningWeightsV0.js";
import { listRhizohOpeningBookV0 } from "./rhizohOpeningBookV0.js";
import { getChessLearningAgreementGateSnapshotV0 } from "./chessLearningAgreementGateV0.js";
import { getChessLearningBatchSnapshotV0 } from "./chessLearningBatchV0.js";
import { getChessFenClusterMemorySnapshotV0 } from "./chessFenClusterMemoryV0.js";

export const RHIZOH_CHESS_PREDICTION_SCORE_EVENT_V0 = "rhizoh:chess-prediction-score-v0";

/**
 * @param {number | null} matchedRank
 */
export function resolvePredictionAccuracyFromRankV0(matchedRank) {
  const rank = Number(matchedRank);
  if (!Number.isFinite(rank) || rank < 1) return 0;
  if (rank === 1) return 1;
  if (rank === 2) return 0.75;
  if (rank === 3) return 0.5;
  if (rank === 4) return 0.25;
  return 0;
}

export const RHIZOH_CHESS_LEARNING_REPORT_SCHEMA_V0 = "castle.rhizoh.chess_learning_report.v0";

const REPORT_STORAGE_KEY_V0 = "rhizoh.chess.learning_report.v0";
const OPENING_BUCKETS_V0 = Object.freeze([
  "Italian",
  "Scotch",
  "English",
  "Queen's Gambit",
  "King's Pawn",
  "Other"
]);

/** @type {Set<string>} */
const observedMatchIdsV0 = new Set();
/** @type {Set<string>} */
const uniqueFenKeysV0 = new Set();
/** @type {Map<string, { moves: string[], completed: boolean, maxPly: number }>} */
const gameRowsV0 = new Map();
let gamesCompletedV0 = 0;
/** @type {number[]} */
const driftSamplesV0 = [];
/** @type {Array<{ matchedRank: number | null, stockfishAgreement: boolean, predictionAccuracy: number }>} */
const agreementSamplesV0 = [];
/** @type {Map<string, number>} */
const learnedLineCountsV0 = new Map();
/** @type {Set<string>} */
const openingBucketsSeenV0 = new Set();
let totalDepthSeenV0 = 0;
let depthSampleCountV0 = 0;
let listenersInstalledV0 = false;

function classifyOpeningFromSanMovesV0(moves = []) {
  const san = moves.map((m) => String(m || "").trim()).filter(Boolean).slice(0, 8);
  const joined = san.join(" ").toLowerCase();
  if (!joined) return "Other";
  if (joined.startsWith("c4")) return "English";
  if (joined.startsWith("d4")) return "Queen's Gambit";
  if (joined.startsWith("e4")) {
    if (/\bd4\b/.test(joined)) return "Scotch";
    if (/\bbc4\b/.test(joined) || /\bnf3\b/.test(joined)) return "Italian";
    return "King's Pawn";
  }
  return "Other";
}

function recordDriftSampleV0(policyDiff) {
  if (!policyDiff) return;
  const rank = Number(policyDiff.matchedRank);
  const drift =
    policyDiff.drifted === true
      ? 1
      : Number.isFinite(rank) && rank > 0
        ? Math.max(0, (rank - 1) / 4)
        : 0.5;
  driftSamplesV0.push(drift);
  while (driftSamplesV0.length > 512) driftSamplesV0.shift();

  recordAgreementSampleV0({
    matchedRank: Number.isFinite(rank) && rank > 0 ? rank : null,
    stockfishAgreement: rank === 1,
    predictionAccuracy: resolvePredictionAccuracyFromRankV0(rank)
  });

  const pv = policyDiff.winningLine?.pv || policyDiff.winningLine?.bestMove;
  if (pv) {
    const key = String(pv).slice(0, 64);
    learnedLineCountsV0.set(key, (learnedLineCountsV0.get(key) || 0) + 1);
  }
  const depth = Number(policyDiff.winningLine?.depth);
  if (Number.isFinite(depth) && depth > 0) {
    totalDepthSeenV0 += depth;
    depthSampleCountV0 += 1;
  }
}

/**
 * @param {{ matchedRank?: number | null, stockfishAgreement?: boolean, predictionAccuracy?: number }} row
 */
export function recordRhizohPredictionScoreV0(row) {
  if (!row) return;
  recordAgreementSampleV0({
    matchedRank: row.matchedRank ?? null,
    stockfishAgreement: Boolean(row.stockfishAgreement),
    predictionAccuracy: Number(row.predictionAccuracy) || 0
  });
  const depth = Number(row.depth);
  if (Number.isFinite(depth) && depth > 0) {
    totalDepthSeenV0 += depth;
    depthSampleCountV0 += 1;
  }
  if (row.engineBest) {
    const key = String(row.engineBest);
    learnedLineCountsV0.set(key, (learnedLineCountsV0.get(key) || 0) + 1);
  }
}

function recordAgreementSampleV0(row) {
  agreementSamplesV0.push({
    matchedRank: row.matchedRank ?? null,
    stockfishAgreement: Boolean(row.stockfishAgreement),
    predictionAccuracy: Math.max(0, Math.min(1, Number(row.predictionAccuracy) || 0))
  });
  while (agreementSamplesV0.length > 512) agreementSamplesV0.shift();
}

function recordMoveV0(detail) {
  const move = detail?.move;
  if (!move?.matchId) return;
  observedMatchIdsV0.add(String(move.matchId));
  if (move.fenBefore) uniqueFenKeysV0.add(String(move.fenBefore));
  if (move.fenAfter) uniqueFenKeysV0.add(String(move.fenAfter));

  const matchId = String(move.matchId);
  const row = gameRowsV0.get(matchId) || { moves: [], completed: false, maxPly: 0 };
  row.moves.push(String(move.san || move.uci || ""));
  row.maxPly = Math.max(row.maxPly, Number(move.ply) || row.moves.length);
  gameRowsV0.set(matchId, row);
  openingBucketsSeenV0.add(classifyOpeningFromSanMovesV0(row.moves));
  while (gameRowsV0.size > 256) {
    const first = gameRowsV0.keys().next().value;
    gameRowsV0.delete(first);
  }
}

function recordGameEndV0(detail) {
  gamesCompletedV0 += 1;
  const matchId = String(detail?.slot?.matchId || "");
  if (matchId && gameRowsV0.has(matchId)) {
    const row = gameRowsV0.get(matchId);
    if (row) row.completed = true;
  }
}

function readPersistedReportRingV0() {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(REPORT_STORAGE_KEY_V0);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePersistedReportSnapshotV0(report) {
  if (typeof localStorage === "undefined") return;
  try {
    const ring = readPersistedReportRingV0();
    ring.push(
      Object.freeze({
        day: new Date().toISOString().slice(0, 10),
        avgDrift: report.avgDrift,
        stockfishAgreement: report.stockfishAgreement,
        predictionAccuracy: report.predictionAccuracy,
        gamesCompleted: report.gamesCompleted,
        atMs: Date.now()
      })
    );
    while (ring.length > 45) ring.shift();
    localStorage.setItem(REPORT_STORAGE_KEY_V0, JSON.stringify(ring));
  } catch {
    /* noop */
  }
}

function resolveDriftTrendPctV0(currentAvg, days) {
  const ring = readPersistedReportRingV0();
  if (ring.length < 2 || currentAvg == null) return null;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const recent = ring.filter((r) => Number(r.atMs) >= cutoff);
  if (recent.length < 2) return null;
  const oldest = Number(recent[0]?.avgDrift);
  const latest = Number(recent[recent.length - 1]?.avgDrift);
  if (!Number.isFinite(oldest) || oldest === 0) return null;
  const pct = Math.round(((latest - oldest) / oldest) * 100);
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

function resolveAgreementTrendPctV0(field, currentValue, days) {
  const ring = readPersistedReportRingV0();
  if (ring.length < 2 || currentValue == null) return null;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const recent = ring.filter((r) => Number(r.atMs) >= cutoff && r[field] != null);
  if (recent.length < 2) return null;
  const oldest = Number(recent[0]?.[field]);
  const latest = Number(recent[recent.length - 1]?.[field]);
  if (!Number.isFinite(oldest) || oldest === 0) return null;
  const pct = Math.round(((latest - oldest) / oldest) * 100);
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

function resolvePreferredOpeningsV0() {
  const counts = Object.fromEntries(OPENING_BUCKETS_V0.map((k) => [k, 0]));
  for (const row of gameRowsV0.values()) {
    const label = classifyOpeningFromSanMovesV0(row.moves);
    counts[label] = (counts[label] || 0) + 1;
  }
  return Object.freeze(
    OPENING_BUCKETS_V0.filter((k) => (counts[k] || 0) > 0)
      .sort((a, b) => (counts[b] || 0) - (counts[a] || 0))
      .slice(0, 5)
  );
}

function resolveOpeningCoverageV0() {
  for (const slot of typeof window !== "undefined"
    ? window.__rhizoh?.chessGameCluster?.slots || []
    : []) {
    const bucket = slot?.openingSeed?.bucket;
    if (bucket) openingBucketsSeenV0.add(bucket);
  }
  const seen = openingBucketsSeenV0.size;
  const total = OPENING_BUCKETS_V0.length;
  const percent = total > 0 ? Math.round((seen / total) * 100) : 0;
  return Object.freeze({ seen, total, percent });
}

function resolveTopLearnedLinesV0() {
  const book = listRhizohOpeningBookV0();
  const bookLines = book.slice(0, 3).map((row) => String(row.name || row.id || "book_line"));
  const fromPv = [...learnedLineCountsV0.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([line, count]) => Object.freeze({ line, count }));
  return Object.freeze({
    bookLines: Object.freeze(bookLines),
    enginePvLines: fromPv
  });
}

function resolveAgreementMetricsV0() {
  if (agreementSamplesV0.length === 0) {
    return Object.freeze({
      stockfishAgreement: null,
      predictionAccuracy: null,
      samples: 0
    });
  }
  const agreeCount = agreementSamplesV0.filter((s) => s.stockfishAgreement).length;
  const accuracySum = agreementSamplesV0.reduce((sum, s) => sum + s.predictionAccuracy, 0);
  return Object.freeze({
    stockfishAgreement: Number((agreeCount / agreementSamplesV0.length).toFixed(3)),
    predictionAccuracy: Number((accuracySum / agreementSamplesV0.length).toFixed(3)),
    samples: agreementSamplesV0.length
  });
}

function resolveClusterSessionMovesSeenV0() {
  if (typeof window === "undefined") return 0;
  const slots = window.__rhizoh?.chessGameCluster?.slots || [];
  return slots.reduce((sum, slot) => sum + (Number(slot?.moveCount) || 0), 0);
}

/**
 * Build learning report from live cluster observability (no fabricated totals).
 */
export function buildRhizohChessLearningReportV0() {
  const monitor = getChessLearningMonitorSnapshotV0("learning_report");
  const memory = getChessClusterMemoryGraphSnapshotV0();
  const memoryNodes = listChessClusterMemoryNodesV0({ limit: 128 });
  const compressionGames = memoryNodes.filter((n) => n.kind === "game_compression").length;
  const weights = readChessLearningWeightsV0();

  const clusterMovesSeen = resolveClusterSessionMovesSeenV0();
  const totalMovesSeen = Math.max(
    monitor.measurement.movesMeasured || 0,
    clusterMovesSeen,
    0
  );
  const gamesObserved = Math.max(observedMatchIdsV0.size, gameRowsV0.size);
  const clusterSessionEnded =
    typeof window !== "undefined"
      ? Number(window.__rhizoh?.chessGameCluster?.sessionGamesEnded) || 0
      : 0;
  const gamesCompleted = Math.max(gamesCompletedV0, compressionGames, clusterSessionEnded);
  const policyChanges = monitor.measurement.policyDiffsMeasured || 0;

  const avgDrift =
    driftSamplesV0.length > 0
      ? Number((driftSamplesV0.reduce((a, b) => a + b, 0) / driftSamplesV0.length).toFixed(2))
      : null;

  const agreement = resolveAgreementMetricsV0();
  const agreementGate = getChessLearningAgreementGateSnapshotV0();
  const batchLearning = getChessLearningBatchSnapshotV0();
  const fenClusters = getChessFenClusterMemorySnapshotV0();
  const clusterThroughput =
    typeof window !== "undefined"
      ? window.__rhizoh?.chessGameCluster?.learningThroughput || null
      : null;
  const averageDepthSeen =
    depthSampleCountV0 > 0 ? Number((totalDepthSeenV0 / depthSampleCountV0).toFixed(1)) : null;

  const report = Object.freeze({
    schema: RHIZOH_CHESS_LEARNING_REPORT_SCHEMA_V0,
    gamesObserved,
    gamesCompleted,
    totalMovesSeen,
    clusterMovesSeen,
    uniquePositions: uniqueFenKeysV0.size,
    openingCoverage: resolveOpeningCoverageV0(),
    averageDepthSeen,
    topLearnedLines: resolveTopLearnedLinesV0(),
    avgDrift,
    driftTrend7Days: resolveDriftTrendPctV0(avgDrift, 7),
    driftTrend30Days: resolveDriftTrendPctV0(avgDrift, 30),
    predictionAccuracy: agreement.predictionAccuracy,
    predictionAccuracyTrend7Days: resolveAgreementTrendPctV0(
      "predictionAccuracy",
      agreement.predictionAccuracy,
      7
    ),
    predictionAccuracyTrend30Days: resolveAgreementTrendPctV0(
      "predictionAccuracy",
      agreement.predictionAccuracy,
      30
    ),
    stockfishAgreement: agreement.stockfishAgreement,
    stockfishAgreementTrend7Days: resolveAgreementTrendPctV0(
      "stockfishAgreement",
      agreement.stockfishAgreement,
      7
    ),
    preferredOpenings: resolvePreferredOpeningsV0(),
    policyChanges,
    memoryNodes: memory.nodeCount || 0,
    weightMatrixUpdated:
      memoryNodes.some((n) => n.kind === "policy_diff" || n.kind === "game_compression") ||
      weights.matchesLearned > 0,
    matchesLearned: weights.matchesLearned,
    clusterRunning: Boolean(monitor.clusterRunning),
    clusterSession: Object.freeze({
      gamesEnded: clusterSessionEnded,
      lastGameEnd:
        typeof window !== "undefined"
          ? window.__rhizoh?.chessGameCluster?.lastGameEnd ?? null
          : null,
      probeNote: "slots reset immediately after end — use sessionGamesEnded not status===ended"
    }),
    engineStatus: monitor.engineStatus,
    agreementSamples: agreement.samples,
    learningV2: Object.freeze({
      truthBased: true,
      agreementGate,
      batchLearning,
      fenClusters,
      clocksDisabled: Boolean(clusterThroughput?.clocksDisabled),
      deferPerGameUpdates: true
    }),
    atMs: Date.now()
  });

  writePersistedReportSnapshotV0(report);
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.chessLearningReport = report;
  }
  return report;
}

export function ensureRhizohChessLearningReportV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  if (!window.__rhizoh.learningReport) {
    window.__rhizoh.learningReport = () => buildRhizohChessLearningReportV0();
  }
  if (listenersInstalledV0) return window.__rhizoh.learningReport;
  listenersInstalledV0 = true;

  window.addEventListener(CHESS_CLUSTER_MOVE_EVENT_V0, (ev) => recordMoveV0(ev?.detail));
  window.addEventListener(CHESS_CLUSTER_GAME_END_EVENT_V0, (ev) => recordGameEndV0(ev?.detail));
  window.addEventListener(CHESS_CLUSTER_POLICY_DIFF_EVENT_V0, (ev) => recordDriftSampleV0(ev?.detail));
  window.addEventListener(RHIZOH_CHESS_PREDICTION_SCORE_EVENT_V0, (ev) =>
    recordRhizohPredictionScoreV0(ev?.detail)
  );

  return window.__rhizoh.learningReport;
}

/** @internal vitest */
export function __resetRhizohChessLearningReportForTestV0() {
  observedMatchIdsV0.clear();
  uniqueFenKeysV0.clear();
  gameRowsV0.clear();
  openingBucketsSeenV0.clear();
  learnedLineCountsV0.clear();
  gamesCompletedV0 = 0;
  driftSamplesV0.length = 0;
  agreementSamplesV0.length = 0;
  totalDepthSeenV0 = 0;
  depthSampleCountV0 = 0;
  listenersInstalledV0 = false;
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(REPORT_STORAGE_KEY_V0);
    } catch {
      /* noop */
    }
    if (window.__rhizoh) {
      delete window.__rhizoh.learningReport;
      delete window.__rhizoh.chessLearningReport;
    }
  }
}
