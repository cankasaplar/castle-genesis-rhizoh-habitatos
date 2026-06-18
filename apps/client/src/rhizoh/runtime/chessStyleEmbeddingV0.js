/**
 * Style embeddings from unified graph + corpus exposure (PR-B lightweight).
 * RESEARCH-ONLY — interpretation only.
 */

import { readChessMemoryStoreV0, CHESS_MEMORY_STORE_LS_KEY_V0, invalidateChessMemoryStoreCacheV0 } from "./chessMemoryStoreV0.js";
import { readChessUnifiedMemoryGraphV0 } from "./chessUnifiedMemoryGraphV0.js";
import { CHESS_UNIFIED_EDGE_KIND_V0 } from "./chessUnifiedMemoryGraphV0.js";

export const CHESS_STYLE_EMBEDDING_SCHEMA_V0 = "castle.rhizoh.chess_style_embedding.v0";

function clamp01(n) {
  return Math.max(0, Math.min(1, Number(n) || 0));
}

/**
 * Compute lightweight player style vectors from corpus games + graph tactical density.
 */
export function computeChessStyleEmbeddingsV0() {
  const store = readChessMemoryStoreV0();
  const graph = readChessUnifiedMemoryGraphV0();
  const evalEdges = (graph.edges || []).filter((e) => e.kind === CHESS_UNIFIED_EDGE_KIND_V0.EVAL);
  const avgEval =
    evalEdges.length > 0
      ? evalEdges.reduce((sum, e) => sum + (Number(e.cp) || 0), 0) / evalEdges.length
      : 0;
  const tacticalBias = clamp01(Math.abs(avgEval) / 120);

  const exposure = {};
  for (const game of store.games || []) {
    for (const id of [game.whiteStyleId, game.blackStyleId]) {
      if (!id || id === "unknown") continue;
      exposure[id] = (exposure[id] || 0) + 1;
    }
  }

  const maxExposure = Math.max(1, ...Object.values(exposure), 1);
  const embeddings = (store.playerStyles || []).map((style) => {
    const games = exposure[style.playerId] || 0;
    const corpusWeight = games / maxExposure;
    return Object.freeze({
      schema: `${CHESS_STYLE_EMBEDDING_SCHEMA_V0}.vector`,
      playerId: style.playerId,
      label: style.label,
      vector: Object.freeze({
        aggression: clamp01(style.aggression + tacticalBias * 0.15),
        riskTolerance: clamp01(style.riskTolerance),
        winForcing: clamp01(style.winForcing),
        corpusExposure: corpusWeight,
        tacticalBias
      }),
      gamesInCorpus: games,
      embeddingReady: games > 0,
      source: "unified_graph_v2"
    });
  });

  return Object.freeze({
    schema: CHESS_STYLE_EMBEDDING_SCHEMA_V0,
    embeddings,
    graphStats: graph.stats,
    atMs: Date.now()
  });
}

/**
 * Persist embeddings into memory store (non-destructive merge).
 */
export function syncChessStyleEmbeddingsToStoreV0() {
  const computed = computeChessStyleEmbeddingsV0();
  if (typeof localStorage !== "undefined") {
    try {
      const raw = JSON.parse(localStorage.getItem(CHESS_MEMORY_STORE_LS_KEY_V0) || "{}");
      localStorage.setItem(
        CHESS_MEMORY_STORE_LS_KEY_V0,
        JSON.stringify({
          ...raw,
          embeddings: computed.embeddings,
          updatedAt: new Date().toISOString()
        })
      );
      invalidateChessMemoryStoreCacheV0();
    } catch {
      /* noop */
    }
  }
  return computed;
}
