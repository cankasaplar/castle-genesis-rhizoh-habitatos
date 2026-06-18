/**
 * Rhizoh chess learning report — observable aggregate from cluster monitor + memory graph.
 * window.__rhizoh.learningReport() — DevTools / shadow prod observability.
 * RESEARCH-ONLY — interpretation only; no execution authority.
 */

import { CHESS_CLUSTER_GAME_END_EVENT_V0, CHESS_CLUSTER_MOVE_EVENT_V0 } from "./chessGameClusterV0.js";
import { getChessLearningMonitorSnapshotV0 } from "./chessLearningMonitorV0.js";
import { getChessClusterMemoryGraphSnapshotV0, listChessClusterMemoryNodesV0 } from "./chessClusterMemoryGraphV0.js";
import { CHESS_CLUSTER_POLICY_DIFF_EVENT_V0 } from "./chessClusterLearningTraceV0.js";

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
/** @type {Map<string, { moves: string[], completed: boolean }>} */
const gameRowsV0 = new Map();
let gamesCompletedV0 = 0;
/** @type {number[]} */
const driftSamplesV0 = [];
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
}

function recordMoveV0(detail) {
  const move = detail?.move;
  if (!move?.matchId) return;
  observedMatchIdsV0.add(String(move.matchId));
  if (move.fenBefore) uniqueFenKeysV0.add(String(move.fenBefore));
  if (move.fenAfter) uniqueFenKeysV0.add(String(move.fenAfter));

  const matchId = String(move.matchId);
  const row = gameRowsV0.get(matchId) || { moves: [], completed: false };
  row.moves.push(String(move.san || move.uci || ""));
  gameRowsV0.set(matchId, row);
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

function resolveDriftTrend30DaysV0(currentAvg) {
  const ring = readPersistedReportRingV0();
  if (ring.length < 2 || currentAvg == null) return null;
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = ring.filter((r) => Number(r.atMs) >= cutoff);
  if (recent.length < 2) return null;
  const oldest = Number(recent[0]?.avgDrift);
  const latest = Number(recent[recent.length - 1]?.avgDrift);
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

/**
 * Build learning report from live cluster observability (no fabricated totals).
 */
export function buildRhizohChessLearningReportV0() {
  const monitor = getChessLearningMonitorSnapshotV0("learning_report");
  const memory = getChessClusterMemoryGraphSnapshotV0();
  const memoryNodes = listChessClusterMemoryNodesV0({ limit: 128 });
  const compressionGames = memoryNodes.filter((n) => n.kind === "game_compression").length;

  const totalMovesSeen = Math.max(monitor.measurement.movesMeasured || 0, 0);
  const gamesObserved = Math.max(observedMatchIdsV0.size, gameRowsV0.size);
  const gamesCompleted = Math.max(gamesCompletedV0, compressionGames);
  const policyChanges = monitor.measurement.policyDiffsMeasured || 0;

  const avgDrift =
    driftSamplesV0.length > 0
      ? Number((driftSamplesV0.reduce((a, b) => a + b, 0) / driftSamplesV0.length).toFixed(2))
      : null;

  const report = Object.freeze({
    schema: RHIZOH_CHESS_LEARNING_REPORT_SCHEMA_V0,
    gamesObserved,
    gamesCompleted,
    totalMovesSeen,
    uniquePositions: uniqueFenKeysV0.size,
    avgDrift,
    driftTrend30Days: resolveDriftTrend30DaysV0(avgDrift),
    preferredOpenings: resolvePreferredOpeningsV0(),
    policyChanges,
    memoryNodes: memory.nodeCount || 0,
    weightMatrixUpdated: memoryNodes.some((n) => n.kind === "policy_diff" || n.kind === "game_compression"),
    clusterRunning: Boolean(monitor.clusterRunning),
    engineStatus: monitor.engineStatus,
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

  return window.__rhizoh.learningReport;
}

/** @internal vitest */
export function __resetRhizohChessLearningReportForTestV0() {
  observedMatchIdsV0.clear();
  uniqueFenKeysV0.clear();
  gameRowsV0.clear();
  gamesCompletedV0 = 0;
  driftSamplesV0.length = 0;
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
