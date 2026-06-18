/**
 * Unified Chess Memory Graph boot — single notebook wiring.
 * window.__rhizoh.chessUnifiedMemoryGraph()
 * RESEARCH-ONLY
 */

import { ensureChessCorpusExpansionLoadedV0 } from "./chessCorpusExpansionLoaderV0.js";
import { rebuildChessUnifiedGraphFromStoresV0, projectClusterObservationIntoUnifiedGraphV0, projectLearningLoopIntoUnifiedGraphV0 } from "./chessUnifiedGraphProjectorV0.js";
import {
  getChessUnifiedMemoryGraphSnapshotV0,
  mergeChessUnifiedMemoryGraphV0,
  readChessUnifiedMemoryGraphV0
} from "./chessUnifiedMemoryGraphV0.js";
import { syncChessStyleEmbeddingsToStoreV0 } from "./chessStyleEmbeddingV0.js";
import { readChessLearningWeightsV0 } from "./chessLearningWeightsV0.js";
import { CHESS_CLUSTER_OBSERVATION_EVENT_V0 } from "./chessClusterObserverV0.js";
import { CHESS_LEARNING_LOOP_EVENT_V0 } from "./chessLearningLoopV0.js";
import { CHESS_HISTORY_IMPORTED_EVENT_V0 } from "./chessHistoryLoaderV0.js";
import { CHESS_UNIFIED_MEMORY_GRAPH_EVENT_V0 } from "./chessUnifiedMemoryGraphV0.js";
import { projectChessHistoryGameIntoUnifiedGraphV0 } from "./chessUnifiedGraphProjectorV0.js";

export const CHESS_UNIFIED_MEMORY_GRAPH_REPORT_SCHEMA_V0 =
  "castle.rhizoh.chess_unified_memory_graph_report.v0";

let listenersInstalledV0 = false;
let bootHandledV0 = false;

export function buildChessUnifiedMemoryGraphReportV0() {
  const graph = readChessUnifiedMemoryGraphV0();
  const weights = readChessLearningWeightsV0();
  const snapshot = getChessUnifiedMemoryGraphSnapshotV0();
  const embeddings = syncChessStyleEmbeddingsToStoreV0();

  return Object.freeze({
    schema: CHESS_UNIFIED_MEMORY_GRAPH_REPORT_SCHEMA_V0,
    graphVersion: graph.graphVersion,
    stats: graph.stats,
    snapshot,
    singleNotebook: Object.freeze({
      positionNodes: graph.stats?.positionCount || 0,
      moveEdges: graph.stats?.moveEdgeCount || 0,
      evalEdges: graph.stats?.evalEdgeCount || 0,
      weightUpdateEdges: graph.stats?.weightUpdateCount || 0,
      note: "checkpoint + corpus + lifetime → unified graph → weight matrix"
    }),
    weightMatrix: Object.freeze({
      matchesLearned: weights.matchesLearned,
      aggressionBias: weights.aggressionBias,
      winForcingWeight: weights.winForcingWeight,
      riskPenaltyWeight: weights.riskPenaltyWeight
    }),
    styleEmbeddings: Object.freeze({
      count: embeddings.embeddings.length,
      ready: embeddings.embeddings.filter((e) => e.embeddingReady).length
    }),
    apis: Object.freeze({
      report: "window.__rhizoh.chessUnifiedMemoryGraph()",
      rebuild: "window.__rhizoh.rebuildChessUnifiedGraph()"
    }),
    atMs: Date.now()
  });
}

export function ensureChessUnifiedMemoryGraphV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};

  if (!window.__rhizoh.chessUnifiedMemoryGraph) {
    window.__rhizoh.chessUnifiedMemoryGraph = () => buildChessUnifiedMemoryGraphReportV0();
  }
  if (!window.__rhizoh.rebuildChessUnifiedGraph) {
    window.__rhizoh.rebuildChessUnifiedGraph = () => {
      const out = rebuildChessUnifiedGraphFromStoresV0();
      syncChessStyleEmbeddingsToStoreV0();
      return out;
    };
  }
  if (!window.__rhizoh.mergeChessUnifiedMemoryGraph) {
    window.__rhizoh.mergeChessUnifiedMemoryGraph = mergeChessUnifiedMemoryGraphV0;
  }

  if (!bootHandledV0) {
    bootHandledV0 = true;
    ensureChessCorpusExpansionLoadedV0();
    const graph = readChessUnifiedMemoryGraphV0();
    if ((graph.stats?.positionCount || 0) < 4) {
      rebuildChessUnifiedGraphFromStoresV0();
    }
    syncChessStyleEmbeddingsToStoreV0();
    window.__rhizoh.chessUnifiedMemoryGraphBoot = Object.freeze({
      corpusExpansion: true,
      graphStats: readChessUnifiedMemoryGraphV0().stats
    });
  }

  if (listenersInstalledV0) return window.__rhizoh.chessUnifiedMemoryGraph;
  listenersInstalledV0 = true;

  window.addEventListener(CHESS_CLUSTER_OBSERVATION_EVENT_V0, (ev) => {
    const obs = ev.detail || {};
    projectClusterObservationIntoUnifiedGraphV0(obs, {
      fenBefore: obs.fenBefore,
      fenAfter: obs.fenAfter,
      san: obs.san,
      ply: obs.ply,
      agentId: obs.agentId,
      matchId: obs.matchId
    });
  });
  window.addEventListener(CHESS_LEARNING_LOOP_EVENT_V0, (ev) => {
    if (ev.detail) projectLearningLoopIntoUnifiedGraphV0(ev.detail);
    syncChessStyleEmbeddingsToStoreV0();
  });
  window.addEventListener(CHESS_HISTORY_IMPORTED_EVENT_V0, (ev) => {
    const detail = ev.detail;
    if (detail?.game) projectChessHistoryGameIntoUnifiedGraphV0(detail.game);
    syncChessStyleEmbeddingsToStoreV0();
  });
  window.addEventListener(CHESS_UNIFIED_MEMORY_GRAPH_EVENT_V0, () => {
    /* stats bump — report reads live */
  });

  return window.__rhizoh.chessUnifiedMemoryGraph;
}

/** @internal vitest */
export function __resetChessUnifiedMemoryGraphBootForTestV0() {
  listenersInstalledV0 = false;
  bootHandledV0 = false;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.chessUnifiedMemoryGraph;
    delete window.__rhizoh.rebuildChessUnifiedGraph;
    delete window.__rhizoh.mergeChessUnifiedMemoryGraph;
    delete window.__rhizoh.chessUnifiedMemoryGraphBoot;
  }
}
