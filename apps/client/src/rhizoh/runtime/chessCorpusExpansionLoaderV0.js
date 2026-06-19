/**
 * Load expanded corpus bundles into memory store + unified graph.
 * RESEARCH-ONLY
 */

import { buildChessHistoryGameRecordV0 } from "./chessHistoryLoaderV0.js";
import { CHESS_HISTORY_IMPORTED_EVENT_V0 } from "./chessHistoryLoaderV0.js";
import { markChessCorpusBundleLoadedV0, readChessMemoryStoreV0, upsertChessMemoryGameV0 } from "./chessMemoryStoreV0.js";
import { listChessCorpusExpansionBundlesV0 } from "./chessHistoryCorpusBundlesV0.js";
import { projectChessHistoryGameIntoUnifiedGraphV0 } from "./chessUnifiedGraphProjectorV0.js";

export const CHESS_CORPUS_EXPANSION_SCHEMA_V0 = "castle.rhizoh.chess_corpus_expansion.v0";

let expansionLoadAttemptedV0 = false;

/**
 * Idempotent load of all expansion bundles.
 */
export function loadChessCorpusExpansionBundlesV0() {
  const store = readChessMemoryStoreV0();
  const loaded = new Set(store.stats?.corpusBundlesLoaded || []);
  const results = [];

  for (const bundle of listChessCorpusExpansionBundlesV0()) {
    if (loaded.has(bundle.bundleId)) {
      results.push(
        Object.freeze({
          bundleId: bundle.bundleId,
          skipped: true,
          imported: 0
        })
      );
      continue;
    }
    const imported = [];
    for (const seed of bundle.games) {
      const row = buildChessHistoryGameRecordV0(
        Object.freeze({
          headers: seed.headers || {},
          moves: seed.moves,
          result: seed.headers?.Result || null
        }),
        {
          gameId: seed.id,
          source: bundle.bundleId,
          qualityTier: seed.qualityTier || bundle.qualityTier
        }
      );
      if (row) {
        const enriched = Object.freeze({
          ...row,
          motif: seed.motif || null
        });
        upsertChessMemoryGameV0(enriched);
        projectChessHistoryGameIntoUnifiedGraphV0(enriched);
        imported.push(enriched);
      }
    }
    markChessCorpusBundleLoadedV0(bundle.bundleId);
    results.push(
      Object.freeze({
        bundleId: bundle.bundleId,
        skipped: false,
        imported: imported.length
      })
    );
    if (imported.length && typeof window !== "undefined") {
      try {
        window.dispatchEvent(
          new CustomEvent(CHESS_HISTORY_IMPORTED_EVENT_V0, {
            detail: Object.freeze({ bundleId: bundle.bundleId, count: imported.length })
          })
        );
      } catch {
        /* noop */
      }
    }
  }

  return Object.freeze({
    schema: CHESS_CORPUS_EXPANSION_SCHEMA_V0,
    ok: true,
    bundles: Object.freeze(results),
    totalImported: results.reduce((sum, r) => sum + (r.imported || 0), 0)
  });
}

export function ensureChessCorpusExpansionLoadedV0() {
  if (expansionLoadAttemptedV0) {
    return Object.freeze({ ok: true, skipped: true, reason: "already_attempted" });
  }
  expansionLoadAttemptedV0 = true;
  return loadChessCorpusExpansionBundlesV0();
}

/** @internal vitest */
export function __resetChessCorpusExpansionForTestV0() {
  expansionLoadAttemptedV0 = false;
}
