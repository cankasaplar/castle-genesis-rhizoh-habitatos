/**
 * Deploy-safe chess learning checkpoint — versioned learning store (not world IndexedDB).
 * Preserves weights, corpus, opening bias across deploys.
 * window.__rhizoh.chessLearningCheckpoint()
 * RESEARCH-ONLY — observation / resume only; no execution authority.
 */

import { RHIZOH_PWA_SHELL_VERSION_V0 } from "../../pwa/registerRhizohServiceWorkerV0.js";
import { readChessLearningWeightsV0, CHESS_LEARNING_WEIGHTS_LS_KEY_V0, CHESS_LEARNING_WEIGHTS_SCHEMA_V0 } from "./chessLearningWeightsV0.js";
import { backfillChessLifetimeStatsFromStoresV0, CHESS_LIFETIME_STATS_LS_KEY_V0, CHESS_LIFETIME_STATS_SCHEMA_V0 } from "./rhizohChessLifetimeStatsV0.js";
import {
  readChessMemoryStoreV0,
  invalidateChessMemoryStoreCacheV0,
  CHESS_MEMORY_STORE_LS_KEY_V0,
  CHESS_MEMORY_STORE_SCHEMA_V0,
  CHESS_MEMORY_GRAPH_VERSION_V0,
  CHESS_MEMORY_MAX_GAMES_V0
} from "./chessMemoryStoreV0.js";
import { invalidateChessLifetimeStatsCacheV0 } from "./rhizohChessLifetimeStatsV0.js";
import {
  listRhizohOpeningBookV0,
  mergeRhizohOpeningBookFromCloudV0,
  RHIZOH_OPENING_BOOK_LS_KEY_V0,
  RHIZOH_OPENING_BOOK_SCHEMA_V0
} from "./rhizohOpeningBookV0.js";
import { captureChessEvolutionSnapshotV0, RHIZOH_CHESS_EVOLUTION_CURVE_LS_KEY_V0 } from "./rhizohChessEvolutionCurveV0.js";
import { CHESS_MATCH_ANALYZED_EVENT_V0 } from "./chessLearningBridgeV0.js";
import { CHESS_CLUSTER_GAME_END_EVENT_V0 } from "./chessGameClusterV0.js";
import { CHESS_LEARNING_WEIGHTS_EVENT_V0 } from "./chessLearningWeightsV0.js";
import {
  readChessUnifiedMemoryGraphV0,
  mergeChessUnifiedMemoryGraphV0,
  invalidateChessUnifiedMemoryGraphCacheV0
} from "./chessUnifiedMemoryGraphV0.js";
import { syncChessStyleEmbeddingsToStoreV0 } from "./chessStyleEmbeddingV0.js";

export const RHIZOH_CHESS_LEARNING_CHECKPOINT_SCHEMA_V0 = "castle.rhizoh.chess_learning_checkpoint.v1";
export const RHIZOH_CHESS_LEARNING_CHECKPOINT_LS_KEY_V0 = "rhizoh.chess.learning_checkpoint.v0";
export const RHIZOH_CHESS_LEARNING_CHECKPOINT_HISTORY_LS_KEY_V0 = "rhizoh.chess.learning_checkpoint_history.v0";
export const RHIZOH_CHESS_LEARNING_CHECKPOINT_DEPLOY_LS_KEY_V0 = "rhizoh.chess.learning_checkpoint_deploy.v0";
export const RHIZOH_CHESS_LEARNING_CHECKPOINT_EVENT_V0 = "rhizoh:chess-learning-checkpoint-v0";

const MAX_HISTORY_V0 = 8;
const FREEZE_THROTTLE_MS_V0 = 60_000;

let listenersInstalledV0 = false;
let lastFreezeAtMsV0 = 0;
let bootHandledV0 = false;

function maxStatV0(a, b) {
  return Math.max(Number(a) || 0, Number(b) || 0);
}

function readJsonLsV0(key, fallback) {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJsonLsV0(key, value) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* noop */
  }
}

function snapshotIdV0() {
  return `lchk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
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

function readDeployMetaV0() {
  const raw = readJsonLsV0(RHIZOH_CHESS_LEARNING_CHECKPOINT_DEPLOY_LS_KEY_V0, {});
  return {
    lastDeployTag: String(raw.lastDeployTag || ""),
    lastFrozenAt: raw.lastFrozenAt || null,
    resumeCount: Number(raw.resumeCount) || 0
  };
}

function writeDeployMetaV0(patch) {
  const prev = readDeployMetaV0();
  writeJsonLsV0(RHIZOH_CHESS_LEARNING_CHECKPOINT_DEPLOY_LS_KEY_V0, {
    ...prev,
    ...patch,
    updatedAt: new Date().toISOString()
  });
}

export function resolveChessLearningDeployTagV0() {
  if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
    return "dev-local";
  }
  return RHIZOH_PWA_SHELL_VERSION_V0;
}

/**
 * Capture full learning layer for freeze / export (learning_snapshot_vX.json shape).
 */
export function captureChessLearningCheckpointV0(extra = {}) {
  const weights = readChessLearningWeightsV0();
  const lifetime = backfillChessLifetimeStatsFromStoresV0();
  const memory = readChessMemoryStoreV0();
  const openingEntries = listRhizohOpeningBookV0();
  const evolution = captureChessEvolutionSnapshotV0({ reason: extra.reason || "checkpoint" });
  const unifiedGraph = readChessUnifiedMemoryGraphV0();
  const deployTag = extra.deployTag || resolveChessLearningDeployTagV0();
  const checkpointVersion = 1;
  const snapshotId = extra.snapshotId || snapshotIdV0();

  return Object.freeze({
    schema: RHIZOH_CHESS_LEARNING_CHECKPOINT_SCHEMA_V0,
    checkpointVersion,
    snapshotId,
    filename: `learning_snapshot_v${checkpointVersion}_${deployTag}_${snapshotId}.json`,
    frozenAt: new Date().toISOString(),
    deployTag,
    reason: extra.reason || "freeze",
    weights: Object.freeze({ ...weights }),
    lifetime: Object.freeze({
      gamesObserved: lifetime.gamesObserved,
      gamesCompleted: lifetime.gamesCompleted,
      movesSeen: lifetime.movesSeen,
      driftEvents: lifetime.driftEvents,
      uniqueFenHints: [...(lifetime.uniqueFenHints || [])],
      matchIdHints: [...(lifetime.matchIdHints || [])],
      firstSeenAt: lifetime.firstSeenAt,
      lastSeenAt: lifetime.lastSeenAt
    }),
    openingBook: Object.freeze({
      schema: RHIZOH_OPENING_BOOK_SCHEMA_V0,
      entryCount: openingEntries.length,
      totalGames: openingEntries.reduce((sum, row) => sum + (Number(row.games) || 0), 0),
      entries: openingEntries.map((row) => ({ ...row }))
    }),
    corpus: Object.freeze({
      graphVersion: memory.graphVersion,
      gameCount: memory.games?.length || 0,
      totalGamesImported: memory.stats?.totalGamesImported || 0,
      corpusBundlesLoaded: [...(memory.stats?.corpusBundlesLoaded || [])],
      games: (memory.games || []).map((g) => ({ ...g }))
    }),
    evolution: Object.freeze({ ...evolution }),
    unifiedGraph: Object.freeze({
      graphVersion: unifiedGraph.graphVersion,
      stats: unifiedGraph.stats,
      nodes: (unifiedGraph.nodes || []).map((n) => ({ ...n })),
      edges: (unifiedGraph.edges || []).map((e) => ({ ...e }))
    }),
    trainingResume: Object.freeze({
      matchesLearned: weights.matchesLearned,
      lifetimeMoves: lifetime.movesSeen || 0,
      corpusGames: memory.games?.length || 0,
      openingGames: openingEntries.reduce((sum, row) => sum + (Number(row.games) || 0), 0),
      positionNodes: unifiedGraph.stats?.positionCount || 0,
      weightFingerprint: weightFingerprintV0(weights)
    })
  });
}

function readActiveCheckpointV0() {
  const raw = readJsonLsV0(RHIZOH_CHESS_LEARNING_CHECKPOINT_LS_KEY_V0, null);
  if (!raw || raw.schema !== RHIZOH_CHESS_LEARNING_CHECKPOINT_SCHEMA_V0) return null;
  return raw;
}

function readCheckpointHistoryV0() {
  const ring = readJsonLsV0(RHIZOH_CHESS_LEARNING_CHECKPOINT_HISTORY_LS_KEY_V0, []);
  return Array.isArray(ring) ? ring : [];
}

function writeActiveCheckpointV0(checkpoint) {
  writeJsonLsV0(RHIZOH_CHESS_LEARNING_CHECKPOINT_LS_KEY_V0, checkpoint);
}

function pushCheckpointHistoryV0(checkpoint) {
  const ring = [...readCheckpointHistoryV0(), checkpoint].slice(-MAX_HISTORY_V0);
  writeJsonLsV0(RHIZOH_CHESS_LEARNING_CHECKPOINT_HISTORY_LS_KEY_V0, ring);
  return ring;
}

function writeWeightsFromSnapshotV0(weights) {
  if (typeof localStorage === "undefined") return;
  const next = Object.freeze({
    schema: CHESS_LEARNING_WEIGHTS_SCHEMA_V0,
    learningMode: weights.learningMode !== false,
    riskPenaltyWeight: weights.riskPenaltyWeight,
    winForcingWeight: weights.winForcingWeight,
    aggressionBias: weights.aggressionBias,
    matchesLearned: weights.matchesLearned,
    forcedWinCorrections: weights.forcedWinCorrections,
    updatedAt: new Date().toISOString(),
    restoredFromCheckpoint: true
  });
  writeJsonLsV0(CHESS_LEARNING_WEIGHTS_LS_KEY_V0, next);
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(CHESS_LEARNING_WEIGHTS_EVENT_V0, { detail: next }));
    } catch {
      /* noop */
    }
  }
}

function mergeWeightsV0(live, frozen) {
  if (!frozen) return live;
  const liveMatches = Number(live.matchesLearned) || 0;
  const frozenMatches = Number(frozen.matchesLearned) || 0;
  const preferFrozen = frozenMatches > liveMatches;
  const base = preferFrozen ? frozen : live;
  return Object.freeze({
    learningMode: (live.learningMode !== false) && (frozen.learningMode !== false),
    matchesLearned: maxStatV0(live.matchesLearned, frozen.matchesLearned),
    forcedWinCorrections: maxStatV0(live.forcedWinCorrections, frozen.forcedWinCorrections),
    riskPenaltyWeight: base.riskPenaltyWeight,
    winForcingWeight: base.winForcingWeight,
    aggressionBias: base.aggressionBias
  });
}

function mergeLifetimeV0(live, frozen) {
  if (!frozen) return live;
  const fenSet = new Set([...(live.uniqueFenHints || []), ...(frozen.uniqueFenHints || [])]);
  const matchSet = new Set([...(live.matchIdHints || []), ...(frozen.matchIdHints || [])]);
  return Object.freeze({
    ...live,
    schema: CHESS_LIFETIME_STATS_SCHEMA_V0,
    gamesObserved: maxStatV0(live.gamesObserved, frozen.gamesObserved),
    gamesCompleted: maxStatV0(live.gamesCompleted, frozen.gamesCompleted),
    movesSeen: maxStatV0(live.movesSeen, frozen.movesSeen),
    driftEvents: maxStatV0(live.driftEvents, frozen.driftEvents),
    uniqueFenHints: [...fenSet].slice(-512),
    matchIdHints: [...matchSet].slice(-512),
    firstSeenAt: live.firstSeenAt && frozen.firstSeenAt
      ? (live.firstSeenAt < frozen.firstSeenAt ? live.firstSeenAt : frozen.firstSeenAt)
      : live.firstSeenAt || frozen.firstSeenAt,
    lastSeenAt: live.lastSeenAt && frozen.lastSeenAt
      ? (live.lastSeenAt > frozen.lastSeenAt ? live.lastSeenAt : frozen.lastSeenAt)
      : live.lastSeenAt || frozen.lastSeenAt,
    backfilledAt: live.backfilledAt || frozen.backfilledAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}

function mergeCorpusV0(live, frozen) {
  if (!frozen) return live;
  const byId = new Map((live.games || []).map((g) => [String(g.id), g]));
  for (const row of frozen.games || []) {
    const id = String(row.id);
    if (!byId.has(id)) byId.set(id, row);
  }
  const games = [...byId.values()].slice(0, CHESS_MEMORY_MAX_GAMES_V0);
  const bundles = new Set([
    ...(live.stats?.corpusBundlesLoaded || []),
    ...(frozen.corpusBundlesLoaded || [])
  ]);
  return Object.freeze({
    schema: CHESS_MEMORY_STORE_SCHEMA_V0,
    graphVersion: Math.max(Number(live.graphVersion) || 0, Number(frozen.graphVersion) || 0, CHESS_MEMORY_GRAPH_VERSION_V0),
    games,
    embeddings: live.embeddings || [],
    playerStyles: live.playerStyles || [],
    stats: Object.freeze({
      totalGamesImported: maxStatV0(live.stats?.totalGamesImported, frozen.totalGamesImported ?? frozen.gameCount),
      lastImportAt: live.stats?.lastImportAt || frozen.lastImportAt || null,
      corpusBundlesLoaded: Object.freeze([...bundles])
    }),
    migratedAt: live.migratedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}

function pickBestCheckpointV0(active, history = []) {
  const candidates = [active, ...history].filter(Boolean);
  if (candidates.length === 0) return null;
  return candidates.reduce((best, row) => {
    const bestScore = Number(best?.trainingResume?.matchesLearned) || 0;
    const rowScore = Number(row?.trainingResume?.matchesLearned) || 0;
    if (rowScore > bestScore) return row;
    if (rowScore < bestScore) return best;
    const bestMoves = Number(best?.trainingResume?.lifetimeMoves) || 0;
    const rowMoves = Number(row?.trainingResume?.lifetimeMoves) || 0;
    return rowMoves > bestMoves ? row : best;
  });
}

/**
 * Merge checkpoint into live stores — never decreases counters.
 * @returns {{ merged: boolean, regressionsFixed: string[] }}
 */
export function resumeChessLearningFromCheckpointV0(opts = {}) {
  const active = opts.checkpoint || readActiveCheckpointV0();
  const history = opts.history || readCheckpointHistoryV0();
  const best = pickBestCheckpointV0(active, history);
  if (!best) {
    return Object.freeze({ merged: false, regressionsFixed: [], reason: "no_checkpoint" });
  }

  const liveWeights = readChessLearningWeightsV0();
  const liveLifetime = backfillChessLifetimeStatsFromStoresV0();
  const liveMemory = readChessMemoryStoreV0();

  const regressionsFixed = [];
  const mergedWeights = mergeWeightsV0(liveWeights, best.weights);
  if (mergedWeights.matchesLearned > liveWeights.matchesLearned) {
    regressionsFixed.push("weights.matchesLearned");
  }
  writeWeightsFromSnapshotV0(mergedWeights);

  const mergedLifetime = mergeLifetimeV0(liveLifetime, best.lifetime);
  if (mergedLifetime.movesSeen > liveLifetime.movesSeen) {
    regressionsFixed.push("lifetime.movesSeen");
  }
  writeJsonLsV0(CHESS_LIFETIME_STATS_LS_KEY_V0, mergedLifetime);

  if (best.openingBook?.entries?.length) {
    mergeRhizohOpeningBookFromCloudV0(best.openingBook.entries);
  }

  const mergedCorpus = mergeCorpusV0(liveMemory, best.corpus);
  if ((mergedCorpus.games?.length || 0) > (liveMemory.games?.length || 0)) {
    regressionsFixed.push("corpus.gameCount");
  }
  writeJsonLsV0(CHESS_MEMORY_STORE_LS_KEY_V0, mergedCorpus);
  invalidateChessLifetimeStatsCacheV0();
  invalidateChessMemoryStoreCacheV0();

  if (best.unifiedGraph?.nodes?.length || best.unifiedGraph?.edges?.length) {
    mergeChessUnifiedMemoryGraphV0(best.unifiedGraph);
    invalidateChessUnifiedMemoryGraphCacheV0();
    syncChessStyleEmbeddingsToStoreV0();
    regressionsFixed.push("unifiedGraph.merge");
  }

  writeDeployMetaV0({
    resumeCount: readDeployMetaV0().resumeCount + 1,
    lastResumeAt: new Date().toISOString()
  });

  const refreshed = captureChessLearningCheckpointV0({ reason: "post_resume", deployTag: best.deployTag });
  writeActiveCheckpointV0(refreshed);

  return Object.freeze({
    merged: regressionsFixed.length > 0 || opts.force === true,
    regressionsFixed: Object.freeze(regressionsFixed),
    snapshotId: best.snapshotId,
    trainingResume: refreshed.trainingResume
  });
}

/**
 * Freeze current learning state — pushes previous active to history ring.
 */
export function freezeChessLearningCheckpointV0(opts = {}) {
  const now = Date.now();
  if (!opts.force && now - lastFreezeAtMsV0 < FREEZE_THROTTLE_MS_V0) {
    return readActiveCheckpointV0();
  }
  lastFreezeAtMsV0 = now;

  const prev = readActiveCheckpointV0();
  if (prev) pushCheckpointHistoryV0(prev);

  const checkpoint = captureChessLearningCheckpointV0({
    reason: opts.reason || "freeze",
    deployTag: opts.deployTag || resolveChessLearningDeployTagV0(),
    snapshotId: opts.snapshotId
  });
  writeActiveCheckpointV0(checkpoint);
  writeDeployMetaV0({
    lastDeployTag: checkpoint.deployTag,
    lastFrozenAt: checkpoint.frozenAt
  });

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(
        new CustomEvent(RHIZOH_CHESS_LEARNING_CHECKPOINT_EVENT_V0, { detail: checkpoint })
      );
    } catch {
      /* noop */
    }
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.chessLearningCheckpointLast = checkpoint;
  }
  return checkpoint;
}

/**
 * Detect deploy tag change → freeze + resume merge.
 */
export function handleChessLearningDeployCheckpointV0() {
  const deployTag = resolveChessLearningDeployTagV0();
  const meta = readDeployMetaV0();
  const deployChanged = Boolean(meta.lastDeployTag) && meta.lastDeployTag !== deployTag;

  let freeze = null;
  let resume = null;

  if (deployChanged) {
    freeze = freezeChessLearningCheckpointV0({
      force: true,
      reason: "deploy_detected",
      deployTag: meta.lastDeployTag
    });
    writeDeployMetaV0({ lastDeployTag: deployTag });
  } else if (!meta.lastDeployTag) {
    writeDeployMetaV0({ lastDeployTag: deployTag });
  }

  resume = resumeChessLearningFromCheckpointV0({ force: deployChanged });

  if (!deployChanged) {
    freezeChessLearningCheckpointV0({ reason: "boot_refresh" });
  }

  return Object.freeze({
    deployTag,
    deployChanged,
    previousDeployTag: meta.lastDeployTag || null,
    freeze,
    resume
  });
}

export function exportChessLearningCheckpointJsonV0() {
  const checkpoint = readActiveCheckpointV0() || captureChessLearningCheckpointV0({ reason: "export" });
  return JSON.stringify(checkpoint, null, 2);
}

export async function buildRhizohChessLearningCheckpointReportV0() {
  const active = readActiveCheckpointV0();
  const history = readCheckpointHistoryV0();
  const deploy = readDeployMetaV0();
  const live = captureChessLearningCheckpointV0({ reason: "report" });

  return Object.freeze({
    schema: `${RHIZOH_CHESS_LEARNING_CHECKPOINT_SCHEMA_V0}.report`,
    deployTag: resolveChessLearningDeployTagV0(),
    deploy,
    active: active
      ? Object.freeze({
          snapshotId: active.snapshotId,
          filename: active.filename,
          frozenAt: active.frozenAt,
          trainingResume: active.trainingResume
        })
      : null,
    historyCount: history.length,
    history: Object.freeze(
      history.map((row) =>
        Object.freeze({
          snapshotId: row.snapshotId,
          deployTag: row.deployTag,
          frozenAt: row.frozenAt,
          trainingResume: row.trainingResume
        })
      )
    ),
    live: Object.freeze({
      trainingResume: live.trainingResume,
      weightFingerprint: live.trainingResume.weightFingerprint
    }),
    storageKeys: Object.freeze({
      active: RHIZOH_CHESS_LEARNING_CHECKPOINT_LS_KEY_V0,
      history: RHIZOH_CHESS_LEARNING_CHECKPOINT_HISTORY_LS_KEY_V0,
      deploy: RHIZOH_CHESS_LEARNING_CHECKPOINT_DEPLOY_LS_KEY_V0,
      note: "versioned learning store — not world IndexedDB"
    }),
    apis: Object.freeze({
      report: "window.__rhizoh.chessLearningCheckpoint()",
      freeze: "window.__rhizoh.freezeChessLearningCheckpoint()",
      exportJson: "window.__rhizoh.exportChessLearningCheckpointJson()"
    }),
    atMs: Date.now()
  });
}

export function ensureRhizohChessLearningCheckpointV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};

  if (!window.__rhizoh.chessLearningCheckpoint) {
    window.__rhizoh.chessLearningCheckpoint = () => buildRhizohChessLearningCheckpointReportV0();
  }
  if (!window.__rhizoh.freezeChessLearningCheckpoint) {
    window.__rhizoh.freezeChessLearningCheckpoint = (opts = {}) =>
      freezeChessLearningCheckpointV0({ ...opts, force: true });
  }
  if (!window.__rhizoh.exportChessLearningCheckpointJson) {
    window.__rhizoh.exportChessLearningCheckpointJson = exportChessLearningCheckpointJsonV0;
  }
  if (!window.__rhizoh.resumeChessLearningFromCheckpoint) {
    window.__rhizoh.resumeChessLearningFromCheckpoint = resumeChessLearningFromCheckpointV0;
  }

  if (!bootHandledV0) {
    bootHandledV0 = true;
    const bootResult = handleChessLearningDeployCheckpointV0();
    window.__rhizoh.chessLearningCheckpointBoot = bootResult;
  }

  if (listenersInstalledV0) return window.__rhizoh.chessLearningCheckpoint;
  listenersInstalledV0 = true;

  const bump = () => freezeChessLearningCheckpointV0({ reason: "learning_event" });
  window.addEventListener(CHESS_MATCH_ANALYZED_EVENT_V0, bump);
  window.addEventListener(CHESS_CLUSTER_GAME_END_EVENT_V0, bump);

  return window.__rhizoh.chessLearningCheckpoint;
}

/** @internal vitest */
export function __resetRhizohChessLearningCheckpointForTestV0() {
  listenersInstalledV0 = false;
  bootHandledV0 = false;
  lastFreezeAtMsV0 = 0;
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(RHIZOH_CHESS_LEARNING_CHECKPOINT_LS_KEY_V0);
    localStorage.removeItem(RHIZOH_CHESS_LEARNING_CHECKPOINT_HISTORY_LS_KEY_V0);
    localStorage.removeItem(RHIZOH_CHESS_LEARNING_CHECKPOINT_DEPLOY_LS_KEY_V0);
    localStorage.removeItem(RHIZOH_CHESS_EVOLUTION_CURVE_LS_KEY_V0);
  }
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.chessLearningCheckpoint;
    delete window.__rhizoh.freezeChessLearningCheckpoint;
    delete window.__rhizoh.exportChessLearningCheckpointJson;
    delete window.__rhizoh.resumeChessLearningFromCheckpoint;
    delete window.__rhizoh.chessLearningCheckpointBoot;
    delete window.__rhizoh.chessLearningCheckpointLast;
  }
}
