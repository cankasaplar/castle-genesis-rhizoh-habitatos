/**
 * Offline batch trainer — corpus + live archive → weight matrix + opening bias.
 * window.__rhizoh.runChessOfflineBatchTrainer()
 * RESEARCH-ONLY — inference stays online; training is batch/offline.
 */

import { listChessMemoryGamesV0 } from "./chessMemoryStoreV0.js";
import { listChessArenaArchiveV0 } from "./chessArenaMatchArchiveV0.js";
import {
  applyChessBatchLearningCorrectionV0,
  readChessLearningWeightsV0
} from "./chessLearningWeightsV0.js";
import {
  aggregateBatchRegretV0,
  archiveRegretToBatchSampleV0,
  buildCorpusRegretProxyV0
} from "./chessBatchRegretProxyV0.js";
import { mergeRhizohOpeningBookFromCloudV0 } from "./rhizohOpeningBookV0.js";
import { upsertChessWeightUpdateEdgeV0, readChessUnifiedMemoryGraphV0 } from "./chessUnifiedMemoryGraphV0.js";
import { syncChessStyleEmbeddingsToStoreV0 } from "./chessStyleEmbeddingV0.js";
import { freezeChessLearningCheckpointV0 } from "./rhizohChessLearningCheckpointV0.js";
import { isChessEngineContendedV0 } from "./chessEngineContentionGateV0.js";
import { buildRhizohChessLearningReportV0 } from "./rhizohChessLearningReportV0.js";

export const CHESS_OFFLINE_BATCH_TRAINER_SCHEMA_V0 = "castle.rhizoh.chess_offline_batch_trainer.v0";
export const CHESS_OFFLINE_BATCH_TRAINER_LS_KEY_V0 = "rhizoh.chess.batch_trainer.v0";
export const CHESS_OFFLINE_BATCH_TRAINER_EVENT_V0 = "rhizoh:chess-offline-batch-trainer-v0";

const MAX_CORPUS_GAMES_V0 = 24;
const MAX_ARCHIVE_GAMES_V0 = 4;
const AUTO_RUN_INTERVAL_MS_V0 = 24 * 60 * 60 * 1000;

let autoRunAttemptedV0 = false;

function readTrainerStateV0() {
  if (typeof localStorage === "undefined") {
    return { runs: [], lastRunAt: null };
  }
  try {
    const raw = localStorage.getItem(CHESS_OFFLINE_BATCH_TRAINER_LS_KEY_V0);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      runs: Array.isArray(parsed.runs) ? parsed.runs : [],
      lastRunAt: parsed.lastRunAt || null
    };
  } catch {
    return { runs: [], lastRunAt: null };
  }
}

function writeTrainerStateV0(state) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(
      CHESS_OFFLINE_BATCH_TRAINER_LS_KEY_V0,
      JSON.stringify({
        schema: CHESS_OFFLINE_BATCH_TRAINER_SCHEMA_V0,
        ...state,
        updatedAt: new Date().toISOString()
      })
    );
  } catch {
    /* noop */
  }
}

function corpusOpeningEntriesFromGamesV0(games = []) {
  return games
    .map((game) => {
      const bucket = game.patterns?.openingBucket || "Other";
      const moves = (game.moves || []).slice(0, 12);
      if (!moves.length) return null;
      const whiteWon = game.result === "1-0";
      const blackWon = game.result === "0-1";
      return {
        key: `corpus_${bucket.toLowerCase().replace(/\s+/g, "_")}`,
        name: bucket,
        eco: game.patterns?.openingFingerprint?.slice(0, 12) || null,
        moves,
        games: 1,
        wins: whiteWon || blackWon ? 1 : 0,
        losses: game.result === "1/2-1/2" ? 0 : 0,
        source: "batch_trainer_corpus"
      };
    })
    .filter(Boolean);
}

function estimateAccuracyLiftV0(before, after, gamesTrained, graphStats) {
  const live = buildRhizohChessLearningReportV0();
  const liveAcc = Number(live.predictionAccuracy) || 0.25;
  const corpusLift = Math.min(0.2, gamesTrained * 0.012);
  const weightLift = Math.min(
    0.15,
    Math.abs(after.winForcingWeight - before.winForcingWeight) * 0.25 +
      Math.abs(after.aggressionBias - before.aggressionBias) * 0.5
  );
  const graphLift = Math.min(0.1, (graphStats?.moveEdgeCount || 0) / 2000);
  const modelEstimate = Math.min(0.65, liveAcc + corpusLift + weightLift + graphLift);
  return Object.freeze({
    liveAccuracy: liveAcc,
    modelEstimate,
    lift: modelEstimate - liveAcc,
    components: Object.freeze({ corpusLift, weightLift, graphLift })
  });
}

/**
 * Run offline batch trainer — merges checkpoint + corpus + lifetime into weight matrix.
 * @param {{ force?: boolean, maxCorpusGames?: number }} [opts]
 */
export async function runChessOfflineBatchTrainerV0(opts = {}) {
  if (!opts.force && isChessEngineContendedV0()) {
    return Object.freeze({
      ok: false,
      reason: "engine_contended",
      deferred: true,
      atMs: Date.now()
    });
  }

  const corpusGames = listChessMemoryGamesV0(opts.maxCorpusGames || MAX_CORPUS_GAMES_V0);
  const archiveGames = listChessArenaArchiveV0(MAX_ARCHIVE_GAMES_V0);

  if (corpusGames.length === 0) {
    return Object.freeze({
      ok: false,
      reason: "empty_corpus",
      atMs: Date.now()
    });
  }

  const proxies = corpusGames.map(buildCorpusRegretProxyV0);
  for (const row of archiveGames) {
    const sample = archiveRegretToBatchSampleV0(row);
    if (sample) proxies.push(sample);
  }

  const aggregate = aggregateBatchRegretV0(proxies);
  const weightsBefore = readChessLearningWeightsV0();
  const weightsAfter = applyChessBatchLearningCorrectionV0(aggregate, {
    gamesTrained: proxies.length
  });

  const openingEntries = corpusOpeningEntriesFromGamesV0(corpusGames);
  if (openingEntries.length) {
    mergeRhizohOpeningBookFromCloudV0(openingEntries);
  }

  upsertChessWeightUpdateEdgeV0({
    matchId: `batch_${Date.now().toString(36)}`,
    weightsBefore,
    weightsAfter,
    regret: aggregate,
    atMs: Date.now()
  });

  syncChessStyleEmbeddingsToStoreV0();
  freezeChessLearningCheckpointV0({ force: true, reason: "batch_trainer" });

  const graphStats = readChessUnifiedMemoryGraphV0().stats;
  const accuracy = estimateAccuracyLiftV0(weightsBefore, weightsAfter, proxies.length, graphStats);

  const run = Object.freeze({
    schema: `${CHESS_OFFLINE_BATCH_TRAINER_SCHEMA_V0}.run`,
    gamesTrained: proxies.length,
    corpusGames: corpusGames.length,
    archiveGames: archiveGames.filter((r) => r.regret).length,
    aggregate,
    weightsBefore: Object.freeze({ ...weightsBefore }),
    weightsAfter: Object.freeze({ ...weightsAfter }),
    accuracy,
    graphStats: Object.freeze({ ...graphStats }),
    atMs: Date.now()
  });

  const state = readTrainerStateV0();
  const runs = [...state.runs, run].slice(-16);
  writeTrainerStateV0({
    runs,
    lastRunAt: new Date().toISOString(),
    lastRun: Object.freeze({
      gamesTrained: run.gamesTrained,
      modelEstimate: accuracy.modelEstimate,
      lift: accuracy.lift
    })
  });

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(CHESS_OFFLINE_BATCH_TRAINER_EVENT_V0, { detail: run }));
    } catch {
      /* noop */
    }
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.chessOfflineBatchTrainerLast = run;
  }

  return Object.freeze({
    ok: true,
    ...run
  });
}

export function buildChessOfflineBatchTrainerReportV0() {
  const state = readTrainerStateV0();
  const weights = readChessLearningWeightsV0();
  const graph = readChessUnifiedMemoryGraphV0();
  const last = state.runs[state.runs.length - 1] || null;

  return Object.freeze({
    schema: `${CHESS_OFFLINE_BATCH_TRAINER_SCHEMA_V0}.report`,
    status: "active_pr_c",
    lastRunAt: state.lastRunAt,
    lastRun: state.lastRun || null,
    runCount: state.runs.length,
    weightMatrix: Object.freeze({
      matchesLearned: weights.matchesLearned,
      winForcingWeight: weights.winForcingWeight,
      aggressionBias: weights.aggressionBias,
      riskPenaltyWeight: weights.riskPenaltyWeight
    }),
    graphWeightUpdates: graph.stats?.weightUpdateCount || 0,
    lastAccuracy: last?.accuracy || null,
    apis: Object.freeze({
      run: "window.__rhizoh.runChessOfflineBatchTrainer()",
      report: "window.__rhizoh.chessOfflineBatchTrainer()"
    }),
    atMs: Date.now()
  });
}

export function ensureChessOfflineBatchTrainerV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};

  if (!window.__rhizoh.runChessOfflineBatchTrainer) {
    window.__rhizoh.runChessOfflineBatchTrainer = (opts) => runChessOfflineBatchTrainerV0(opts);
  }
  if (!window.__rhizoh.chessOfflineBatchTrainer) {
    window.__rhizoh.chessOfflineBatchTrainer = () => buildChessOfflineBatchTrainerReportV0();
  }

  if (!autoRunAttemptedV0) {
    autoRunAttemptedV0 = true;
    const state = readTrainerStateV0();
    const lastMs = state.lastRunAt ? Date.parse(state.lastRunAt) : 0;
    const stale = !lastMs || Date.now() - lastMs > AUTO_RUN_INTERVAL_MS_V0;
    if (stale) {
      setTimeout(() => {
        void runChessOfflineBatchTrainerV0({ force: false }).then((out) => {
          window.__rhizoh.chessOfflineBatchTrainerBoot = out;
        });
      }, 12_000);
    }
  }

  return window.__rhizoh.chessOfflineBatchTrainer;
}

/** @internal vitest */
export function __resetChessOfflineBatchTrainerForTestV0() {
  autoRunAttemptedV0 = false;
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(CHESS_OFFLINE_BATCH_TRAINER_LS_KEY_V0);
  }
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.runChessOfflineBatchTrainer;
    delete window.__rhizoh.chessOfflineBatchTrainer;
    delete window.__rhizoh.chessOfflineBatchTrainerLast;
    delete window.__rhizoh.chessOfflineBatchTrainerBoot;
  }
}
