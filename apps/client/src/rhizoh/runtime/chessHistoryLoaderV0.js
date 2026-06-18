/**
 * Chess History Loader — PGN / corpus import into versioned memory store.
 * PR-A of Chess History Brain Layer.
 * RESEARCH-ONLY — no execution authority.
 */

import { parseChessPgnBundleV0, parseChessPgnGameV0 } from "./chessPgnParserV0.js";
import {
  CHESS_HISTORY_CORPUS_SEED_BUNDLE_ID_V0,
  CHESS_HISTORY_QUALITY_TIER_V0,
  getChessHistorySeedBundleV0
} from "./chessHistoryCorpusSeedV0.js";
import { extractChessHistoryPatternsV0 } from "./chessHistoryPatternV0.js";
import {
  markChessCorpusBundleLoadedV0,
  readChessMemoryStoreV0,
  upsertChessMemoryGameV0
} from "./chessMemoryStoreV0.js";

export const CHESS_HISTORY_LOADER_SCHEMA_V0 = "castle.rhizoh.chess_history_loader.v0";
export const CHESS_HISTORY_IMPORTED_EVENT_V0 = "rhizoh:chess-history-imported-v0";

function hashPgnIdV0(pgnText, fallback = "") {
  const src = String(pgnText || fallback).slice(0, 200);
  let h = 0;
  for (let i = 0; i < src.length; i += 1) {
    h = (h * 31 + src.charCodeAt(i)) >>> 0;
  }
  return `hist_${h.toString(36)}`;
}

function normalizePlayerStyleIdV0(name) {
  const n = String(name || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  if (n.includes("kasparov")) return "kasparov";
  if (n.includes("fischer")) return "fischer";
  if (n.includes("carlsen")) return "carlsen";
  if (n.includes("anand")) return "anand";
  if (n.includes("karpov")) return "karpov";
  if (n.includes("stockfish")) return "stockfish";
  return n.slice(0, 24) || "unknown";
}

/**
 * @param {ReturnType<typeof parseChessPgnGameV0>} parsed
 * @param {{ source?: string, qualityTier?: string, gameId?: string }} [meta]
 */
export function buildChessHistoryGameRecordV0(parsed, meta = {}) {
  if (!parsed?.moves?.length) return null;
  const patterns = extractChessHistoryPatternsV0(parsed.moves);
  const white = parsed.headers.White || meta.white || "White";
  const black = parsed.headers.Black || meta.black || "Black";
  const id = meta.gameId || hashPgnIdV0(parsed.moves.join(" "), `${white}_${black}`);

  return Object.freeze({
    schema: `${CHESS_HISTORY_LOADER_SCHEMA_V0}.game`,
    id,
    source: meta.source || "pgn_import",
    qualityTier: meta.qualityTier || CHESS_HISTORY_QUALITY_TIER_V0.GM_CLASSICAL,
    event: parsed.headers.Event || null,
    site: parsed.headers.Site || null,
    date: parsed.headers.Date || null,
    white,
    black,
    whiteStyleId: normalizePlayerStyleIdV0(white),
    blackStyleId: normalizePlayerStyleIdV0(black),
    result: parsed.result || parsed.headers.Result || "*",
    moves: Object.freeze([...parsed.moves]),
    patterns,
    importedAt: new Date().toISOString()
  });
}

/**
 * @param {string} pgnText
 * @param {{ source?: string, qualityTier?: string, gameId?: string }} [meta]
 */
export function importChessHistoryPgnV0(pgnText, meta = {}) {
  const parsed = parseChessPgnGameV0(pgnText);
  if (!parsed) return Object.freeze({ ok: false, reason: "pgn_parse_failed", imported: 0 });
  const row = buildChessHistoryGameRecordV0(parsed, meta);
  if (!row) return Object.freeze({ ok: false, reason: "empty_game", imported: 0 });
  upsertChessMemoryGameV0(row);
  publishHistoryImportedV0(row);
  return Object.freeze({ ok: true, imported: 1, game: row });
}

/**
 * @param {string} bundleText
 * @param {{ source?: string, qualityTier?: string, bundleId?: string }} [meta]
 */
export function importChessHistoryPgnBundleV0(bundleText, meta = {}) {
  const parsedGames = parseChessPgnBundleV0(bundleText);
  const imported = [];
  for (const parsed of parsedGames) {
    const row = buildChessHistoryGameRecordV0(parsed, {
      source: meta.source || "pgn_bundle",
      qualityTier: meta.qualityTier || CHESS_HISTORY_QUALITY_TIER_V0.GM_CLASSICAL
    });
    if (row) {
      upsertChessMemoryGameV0(row);
      imported.push(row);
    }
  }
  if (meta.bundleId) markChessCorpusBundleLoadedV0(meta.bundleId);
  if (imported.length) {
    publishHistoryImportedV0(Object.freeze({ bundleId: meta.bundleId, count: imported.length }));
  }
  return Object.freeze({
    ok: imported.length > 0,
    imported: imported.length,
    games: Object.freeze(imported)
  });
}

/**
 * Load built-in GM seed corpus (idempotent per bundle id).
 */
export function loadChessHistorySeedCorpusV0() {
  const store = readChessMemoryStoreV0();
  const bundleId = CHESS_HISTORY_CORPUS_SEED_BUNDLE_ID_V0;
  if (store.stats?.corpusBundlesLoaded?.includes(bundleId)) {
    return Object.freeze({
      ok: true,
      skipped: true,
      reason: "bundle_already_loaded",
      bundleId,
      imported: 0
    });
  }
  const bundle = getChessHistorySeedBundleV0();
  const imported = [];
  for (const seed of bundle.games) {
    let row = null;
    if (Array.isArray(seed.moves) && seed.moves.length) {
      row = buildChessHistoryGameRecordV0(
        Object.freeze({
          headers: seed.headers || {},
          moves: seed.moves,
          result: seed.headers?.Result || null
        }),
        {
          gameId: seed.id,
          source: bundleId,
          qualityTier: seed.qualityTier
        }
      );
    } else if (seed.pgn) {
      const parsed = parseChessPgnGameV0(seed.pgn);
      if (parsed) {
        row = buildChessHistoryGameRecordV0(parsed, {
          gameId: seed.id,
          source: bundleId,
          qualityTier: seed.qualityTier
        });
      }
    }
    if (row) {
      upsertChessMemoryGameV0(row);
      imported.push(row);
    }
  }
  markChessCorpusBundleLoadedV0(bundleId);
  publishHistoryImportedV0(Object.freeze({ bundleId, count: imported.length }));
  return Object.freeze({
    ok: true,
    skipped: false,
    bundleId,
    imported: imported.length,
    games: Object.freeze(imported)
  });
}

function publishHistoryImportedV0(detail) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(CHESS_HISTORY_IMPORTED_EVENT_V0, { detail }));
  } catch {
    /* noop */
  }
}
