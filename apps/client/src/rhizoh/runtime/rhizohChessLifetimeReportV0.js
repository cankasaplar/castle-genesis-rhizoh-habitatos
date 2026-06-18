/**
 * Chess lifetime report — persisted learning layer vs session cluster observability.
 * window.__rhizoh.chessLifetimeReport()
 * RESEARCH-ONLY
 */

import { listChessArenaArchiveV0 } from "./chessArenaMatchArchiveV0.js";
import { readChessCivilizationV0 } from "./chessCivilizationV0.js";
import { readChessLearningWeightsV0, CHESS_LEARNING_WEIGHTS_LS_KEY_V0 } from "./chessLearningWeightsV0.js";
import { readCastleIdentityV0, CASTLE_IDENTITY_LS_KEY_V0 } from "./castleIdentityV0.js";
import { listRhizohOpeningBookV0, RHIZOH_OPENING_BOOK_LS_KEY_V0 } from "./rhizohOpeningBookV0.js";
import { listChessEndgameSealsV0 } from "./chessEndgameSealV0.js";
import { getChessClusterMemoryGraphSnapshotV0 } from "./chessClusterMemoryGraphV0.js";
import { buildRhizohChessLearningReportV0, ensureRhizohChessLearningReportV0 } from "./rhizohChessLearningReportV0.js";
import { CHESS_CLUSTER_GAME_END_EVENT_V0, CHESS_CLUSTER_MOVE_EVENT_V0 } from "./chessGameClusterV0.js";
import { CHESS_CLUSTER_POLICY_DIFF_EVENT_V0 } from "./chessClusterLearningTraceV0.js";
import { CHESS_MATCH_ANALYZED_EVENT_V0 } from "./chessLearningBridgeV0.js";
import { RHIZOH_CHESS_PREDICTION_SCORE_EVENT_V0 } from "./rhizohChessLearningReportV0.js";
import {
  backfillChessLifetimeStatsFromStoresV0,
  readChessLifetimeStatsV0,
  recordChessLifetimeDriftEventV0,
  recordChessLifetimeGameCompletedV0,
  recordChessLifetimeMatchAnalyzedV0,
  recordChessLifetimeMoveV0,
  CHESS_LIFETIME_STATS_LS_KEY_V0
} from "./rhizohChessLifetimeStatsV0.js";
import {
  idbSimGetV0,
  openRhizohSimulationDbV0,
  RHIZOH_SIMULATION_IDB_NAME_V0,
  SIM_META_EVENT_SEQ_KEY_V0,
  SIM_STORE_META_V0
} from "../../storage/rhizohSimulationDbV0.js";
import { CHESS_CIVILIZATION_LS_KEY_V0 } from "./chessCivilizationV0.js";

export const RHIZOH_CHESS_LIFETIME_REPORT_SCHEMA_V0 = "castle.rhizoh.chess_lifetime_report.v0";

const CHESS_LS_KEY_HINTS_V0 = Object.freeze([
  CHESS_LIFETIME_STATS_LS_KEY_V0,
  CHESS_LEARNING_WEIGHTS_LS_KEY_V0,
  CHESS_CIVILIZATION_LS_KEY_V0,
  RHIZOH_OPENING_BOOK_LS_KEY_V0,
  CASTLE_IDENTITY_LS_KEY_V0,
  "rhizoh.chess_arena_archive.v0",
  "rhizoh.chess.learning_report.v0",
  "rhizoh.chess_endgame_seal.v0",
  "rhizoh.chess_historical_mind.v0",
  "rhizoh.chess_learning_session.v0",
  "rhizoh.chess_policy_mode.v0",
  "rhizoh_chess_telemetry_level_v0",
  "rhizoh_chess_arena_theme_v0"
]);

let listenersInstalledV0 = false;

function sumLocalStorageBytesV0(keys = CHESS_LS_KEY_HINTS_V0) {
  if (typeof localStorage === "undefined") return 0;
  let bytes = 0;
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) bytes += raw.length * 2;
    } catch {
      /* noop */
    }
  }
  return bytes;
}

async function readSimulationEventSeqV0() {
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

async function readStorageEstimateV0() {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
    return Object.freeze({ usage: null, quota: null });
  }
  try {
    const est = await navigator.storage.estimate();
    return Object.freeze({
      usage: Number(est.usage) || null,
      quota: Number(est.quota) || null
    });
  } catch {
    return Object.freeze({ usage: null, quota: null });
  }
}

function buildOpeningHistogramV0() {
  /** @type {Map<string, { name: string, games: number, wins: number, losses: number }>} */
  const map = new Map();

  const ingest = (row) => {
    const name = String(row.name || row.eco || row.openingName || "Other").trim() || "Other";
    const key = name.toLowerCase();
    const prev = map.get(key) || { name, games: 0, wins: 0, losses: 0 };
    map.set(key, {
      name,
      games: prev.games + (Number(row.games) || 0),
      wins: prev.wins + (Number(row.wins) || 0),
      losses: prev.losses + (Number(row.losses) || 0)
    });
  };

  for (const row of listRhizohOpeningBookV0()) ingest(row);
  for (const row of readChessCivilizationV0().openings || []) ingest(row);

  return Object.freeze(
    [...map.values()]
      .sort((a, b) => b.games - a.games)
      .slice(0, 16)
      .map((row) => Object.freeze({ ...row }))
  );
}

export function listRhizohChessNamespaceKeysV0() {
  if (typeof window === "undefined" || !window.__rhizoh) return Object.freeze([]);
  const re = /chess|learn|drift|graph/i;
  return Object.freeze(Object.keys(window.__rhizoh).filter((k) => re.test(k)).sort());
}

function resolveSessionGraphCountsV0() {
  const memory = getChessClusterMemoryGraphSnapshotV0();
  const causalRaw = typeof window !== "undefined" ? window.__rhizoh?.causalMapRaw : null;
  const causalCompressed =
    typeof window !== "undefined" ? window.__rhizoh?.causalMapCompressed : null;
  const learningGraph =
    typeof window !== "undefined" ? window.__rhizoh?.chessLearningGraph : null;

  const causalNodes = Array.isArray(causalRaw?.nodes)
    ? causalRaw.nodes.length
    : Number(causalRaw?.nodeCount) || 0;
  const causalEdges = Array.isArray(causalRaw?.edges)
    ? causalRaw.edges.length
    : Number(causalRaw?.edgeCount) || 0;

  return Object.freeze({
    chessMemoryNodes: memory.nodeCount || 0,
    chessLearningGraphNodes: Number(learningGraph?.nodeCount) || 0,
    causalMapNodes: causalNodes,
    causalMapEdges: causalEdges,
    causalMapCompressedNodes: Number(causalCompressed?.nodeCount) || null,
    note: "causalMap = world/session events; chessClusterMemory = session chess graph only"
  });
}

/**
 * Build lifetime chess report (sync core + async storage probes).
 */
export function buildRhizohChessLifetimeReportV0() {
  const stats = backfillChessLifetimeStatsFromStoresV0();
  const session = buildRhizohChessLearningReportV0();
  const civilization = readChessCivilizationV0();
  const weights = readChessLearningWeightsV0();
  const identity = readCastleIdentityV0();
  const archive = listChessArenaArchiveV0(48);
  const endgameSeals = listChessEndgameSealsV0(48);
  const graphs = resolveSessionGraphCountsV0();

  const lifetimeGamesObserved = Math.max(
    stats.gamesObserved,
    stats.matchIdHints?.length || 0,
    civilization.matches?.length || 0
  );
  const lifetimeGamesCompleted = Math.max(
    stats.gamesCompleted,
    civilization.matches?.length || 0,
    archive.length,
    weights.matchesLearned,
    identity?.matchesPlayed || 0
  );
  const lifetimeMovesSeen = Math.max(
    stats.movesSeen,
    archive.reduce((sum, row) => sum + (row.moves?.length || 0), 0)
  );
  const lifetimeUniquePositions = Math.max(
    stats.uniqueFenHints?.length || 0,
    session.uniquePositions || 0
  );

  const report = Object.freeze({
    schema: RHIZOH_CHESS_LIFETIME_REPORT_SCHEMA_V0,
    lifetimeGamesObserved,
    lifetimeGamesCompleted,
    lifetimeMovesSeen,
    lifetimeUniquePositions,
    lifetimeDriftEvents: stats.driftEvents || 0,
    firstSeenAt: stats.firstSeenAt,
    lastSeenAt: stats.lastSeenAt,
    openingHistogram: buildOpeningHistogramV0(),
    graphNodes: graphs.chessMemoryNodes,
    graphEdges: graphs.causalMapEdges,
    graphs,
    indexedDbBytes: Object.freeze({
      chessLocalStorageBytes: sumLocalStorageBytesV0(),
      simulationIdbName: RHIZOH_SIMULATION_IDB_NAME_V0,
      simulationEventSeq: null,
      storageEstimate: null
    }),
    sessionCluster: Object.freeze({
      gamesObserved: session.gamesObserved,
      gamesCompleted: session.gamesCompleted,
      totalMovesSeen: session.totalMovesSeen,
      uniquePositions: session.uniquePositions,
      predictionAccuracy: session.predictionAccuracy,
      stockfishAgreement: session.stockfishAgreement,
      note: "current browser session — cluster spectator only"
    }),
    persistedSources: Object.freeze({
      civilizationMatches: civilization.matches?.length || 0,
      arenaArchiveGames: archive.length,
      matchesLearned: weights.matchesLearned,
      castleIdentityMatchesPlayed: identity?.matchesPlayed || 0,
      endgameSeals: endgameSeals.length,
      ledgerBackfilledAt: stats.backfilledAt
    }),
    worldMemory: Object.freeze({
      simulationEventSeq: null,
      codexStatePresent: Boolean(typeof window !== "undefined" && window.__rhizoh?.codexState),
      simulationWorldPresent: Boolean(typeof window !== "undefined" && window.__rhizoh?.simulationWorld),
      note: "world memory is separate from chess learning layer"
    }),
    rhizohChessKeys: listRhizohChessNamespaceKeysV0(),
    atMs: Date.now()
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.chessLifetimeReportLast = report;
  }

  void enrichRhizohChessLifetimeReportAsyncV0(report);
  return report;
}

async function enrichRhizohChessLifetimeReportAsyncV0(baseReport) {
  const [eventSeq, storageEstimate] = await Promise.all([
    readSimulationEventSeqV0(),
    readStorageEstimateV0()
  ]);
  if (typeof window === "undefined") return;
  const prev = window.__rhizoh?.chessLifetimeReportLast;
  if (!prev || prev.atMs !== baseReport.atMs) return;
  const enriched = Object.freeze({
    ...prev,
    indexedDbBytes: Object.freeze({
      ...prev.indexedDbBytes,
      simulationEventSeq: eventSeq,
      storageEstimate
    }),
    worldMemory: Object.freeze({
      ...prev.worldMemory,
      simulationEventSeq: eventSeq
    })
  });
  window.__rhizoh.chessLifetimeReportLast = enriched;
}

export function ensureRhizohChessLifetimeReportV0() {
  if (typeof window === "undefined") return null;
  ensureRhizohChessLearningReportV0();
  window.__rhizoh = window.__rhizoh || {};
  if (!window.__rhizoh.chessLifetimeReport) {
    window.__rhizoh.chessLifetimeReport = () => buildRhizohChessLifetimeReportV0();
  }
  if (listenersInstalledV0) return window.__rhizoh.chessLifetimeReport;
  listenersInstalledV0 = true;

  window.addEventListener(CHESS_CLUSTER_MOVE_EVENT_V0, (ev) => {
    const move = ev?.detail?.move;
    if (!move) return;
    recordChessLifetimeMoveV0({
      matchId: move.matchId,
      fenBefore: move.fenBefore,
      fenAfter: move.fenAfter,
      atMs: move.atMs
    });
  });
  window.addEventListener(CHESS_CLUSTER_GAME_END_EVENT_V0, (ev) => {
    recordChessLifetimeGameCompletedV0({
      matchId: ev?.detail?.slot?.matchId,
      atMs: Date.now()
    });
  });
  window.addEventListener(CHESS_CLUSTER_POLICY_DIFF_EVENT_V0, () => {
    recordChessLifetimeDriftEventV0();
  });
  window.addEventListener(RHIZOH_CHESS_PREDICTION_SCORE_EVENT_V0, () => {
    recordChessLifetimeDriftEventV0();
  });
  window.addEventListener(CHESS_MATCH_ANALYZED_EVENT_V0, (ev) => {
    recordChessLifetimeMatchAnalyzedV0(ev?.detail?.observation || ev?.detail?.result?.observation);
  });

  return window.__rhizoh.chessLifetimeReport;
}

/** @internal vitest */
export function __resetRhizohChessLifetimeReportForTestV0() {
  listenersInstalledV0 = false;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.chessLifetimeReport;
    delete window.__rhizoh.chessLifetimeReportLast;
  }
}
