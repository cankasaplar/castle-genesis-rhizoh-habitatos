/**
 * Chess History Brain — model state evolution tracker (offline corpus layer).
 * window.__rhizoh.chessHistoryBrain()
 * RESEARCH-ONLY
 */

import { readChessLearningWeightsV0 } from "./chessLearningWeightsV0.js";
import { buildRhizohChessLearningReportV0 } from "./rhizohChessLearningReportV0.js";
import {
  CHESS_HISTORY_CORPUS_SEED_BUNDLE_ID_V0,
  CHESS_HISTORY_QUALITY_TIER_V0
} from "./chessHistoryCorpusSeedV0.js";
import { loadChessHistorySeedCorpusV0, importChessHistoryPgnV0, importChessHistoryPgnBundleV0 } from "./chessHistoryLoaderV0.js";
import { readChessMemoryStoreV0, listChessMemoryGamesV0 } from "./chessMemoryStoreV0.js";

export const CHESS_HISTORY_BRAIN_REPORT_SCHEMA_V0 = "castle.rhizoh.chess_history_brain_report.v0";

let seedLoadAttemptedV0 = false;

function resolveQualityTierHistogramV0(games = []) {
  /** @type {Record<string, number>} */
  const counts = Object.fromEntries(Object.values(CHESS_HISTORY_QUALITY_TIER_V0).map((k) => [k, 0]));
  for (const g of games) {
    const tier = g.qualityTier || "unknown";
    counts[tier] = (counts[tier] || 0) + 1;
  }
  return Object.freeze(counts);
}

function resolveOpeningHistogramFromCorpusV0(games = []) {
  /** @type {Map<string, number>} */
  const map = new Map();
  for (const g of games) {
    const bucket = g.patterns?.openingBucket || "Other";
    map.set(bucket, (map.get(bucket) || 0) + 1);
  }
  return Object.freeze(
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([opening, gamesSeen]) => Object.freeze({ opening, gamesSeen }))
  );
}

function resolvePlayerStyleExposureV0(games = [], playerStyles = []) {
  const styleIds = new Set(playerStyles.map((s) => s.playerId));
  /** @type {Record<string, number>} */
  const exposure = {};
  for (const g of games) {
    for (const id of [g.whiteStyleId, g.blackStyleId]) {
      if (!id || id === "unknown") continue;
      exposure[id] = (exposure[id] || 0) + 1;
      if (styleIds.has(id)) {
        /* linked to preset mind */
      }
    }
  }
  return Object.freeze(exposure);
}

/**
 * Build Chess History Brain report — intelligence evolution vs live observation.
 */
export function buildChessHistoryBrainReportV0() {
  if (!seedLoadAttemptedV0) {
    seedLoadAttemptedV0 = true;
    try {
      loadChessHistorySeedCorpusV0();
    } catch {
      /* noop */
    }
  }

  const store = readChessMemoryStoreV0();
  const games = listChessMemoryGamesV0(128);
  const session = buildRhizohChessLearningReportV0();
  const weights = readChessLearningWeightsV0();

  const report = Object.freeze({
    schema: CHESS_HISTORY_BRAIN_REPORT_SCHEMA_V0,
    graphVersion: store.graphVersion,
    corpusGamesLoaded: games.length,
    corpusBundlesLoaded: Object.freeze([...(store.stats?.corpusBundlesLoaded || [])]),
    seedBundleId: CHESS_HISTORY_CORPUS_SEED_BUNDLE_ID_V0,
    qualityTierHistogram: resolveQualityTierHistogramV0(games),
    openingHistogram: resolveOpeningHistogramFromCorpusV0(games),
    playerStylesKnown: Object.freeze((store.playerStyles || []).map((s) => Object.freeze({ ...s }))),
    playerStyleExposure: resolvePlayerStyleExposureV0(games, store.playerStyles || []),
    embeddingsCount: store.embeddings?.length || 0,
    batchTrainer: Object.freeze({
      status: "pending_pr_c",
      lastRunAt: null,
      note: "offline batch trainer not wired — PR-C"
    }),
    intelligenceEvolution: Object.freeze({
      weightMatrix: Object.freeze({
        matchesLearned: weights.matchesLearned,
        aggressionBias: weights.aggressionBias,
        winForcingWeight: weights.winForcingWeight,
        riskPenaltyWeight: weights.riskPenaltyWeight
      }),
      liveObservation: Object.freeze({
        predictionAccuracy: session.predictionAccuracy,
        stockfishAgreement: session.stockfishAgreement,
        avgDrift: session.avgDrift,
        note: "live cluster session — not corpus quality"
      }),
      openingPreferenceLive: session.preferredOpenings,
      driftIsLearningSignal: session.avgDrift != null
    }),
    memoryLayout: Object.freeze({
      storeKey: "rhizoh.chess_memory_store.v0",
      paths: Object.freeze(["games", "embeddings", "player_styles"]),
      graphMigratesOnDeploy: true
    }),
    atMs: Date.now()
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.chessHistoryBrainLast = report;
  }
  return report;
}

export function ensureChessHistoryBrainV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  if (!window.__rhizoh.chessHistoryBrain) {
    window.__rhizoh.chessHistoryBrain = () => buildChessHistoryBrainReportV0();
  }
  if (!window.__rhizoh.importChessPgn) {
    window.__rhizoh.importChessPgn = (pgn, meta) => importChessHistoryPgnV0(pgn, meta);
    window.__rhizoh.importChessPgnBundle = (text, meta) =>
      importChessHistoryPgnBundleV0(text, meta);
  }
  return window.__rhizoh.chessHistoryBrain;
}

/** @internal vitest */
export function __resetChessHistoryBrainForTestV0() {
  seedLoadAttemptedV0 = false;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.chessHistoryBrain;
    delete window.__rhizoh.chessHistoryBrainLast;
    delete window.__rhizoh.importChessPgn;
    delete window.__rhizoh.importChessPgnBundle;
  }
}
