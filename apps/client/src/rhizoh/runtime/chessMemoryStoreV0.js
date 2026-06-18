/**
 * Versioned chess memory store — persistent games / styles / embeddings shell.
 * graph_v1 → graph_v2 migration hook (deploy-safe).
 * RESEARCH-ONLY
 */

import { listChessHistoricalMindsV0 } from "./chessHistoricalMindV0.js";

export const CHESS_MEMORY_STORE_SCHEMA_V0 = "castle.rhizoh.chess_memory_store.v0";
export const CHESS_MEMORY_STORE_LS_KEY_V0 = "rhizoh.chess_memory_store.v0";
export const CHESS_MEMORY_GRAPH_VERSION_V0 = 1;
export const CHESS_MEMORY_MAX_GAMES_V0 = 128;

/** @type {object | null} */
let cachedStoreV0 = null;

function emptyStoreV0() {
  return {
    schema: CHESS_MEMORY_STORE_SCHEMA_V0,
    graphVersion: CHESS_MEMORY_GRAPH_VERSION_V0,
    games: [],
    embeddings: [],
    playerStyles: seedPlayerStylesFromMindsV0(),
    stats: Object.freeze({
      totalGamesImported: 0,
      lastImportAt: null,
      corpusBundlesLoaded: []
    }),
    migratedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function seedPlayerStylesFromMindsV0() {
  return listChessHistoricalMindsV0()
    .filter((m) => m.id !== "rhizoh")
    .map((m) =>
      Object.freeze({
        playerId: m.id,
        label: m.labelEn,
        aggression: m.aggressionBias,
        riskTolerance: 1 - (m.riskPenaltyMult || 0.5),
        winForcing: m.winForcingMult,
        positionalVsTactical: m.aggressionBias > 0.25 ? "tactical" : "positional",
        source: "historical_mind_preset",
        embeddingReady: false
      })
    );
}

function readRawStoreV0() {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(CHESS_MEMORY_STORE_LS_KEY_V0);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function migrateStoreV0(raw) {
  const base = emptyStoreV0();
  if (!raw) return base;
  const version = Number(raw.graphVersion) || 0;
  if (version < 1) {
    return {
      ...base,
      games: Array.isArray(raw.games) ? raw.games : [],
      stats: {
        ...base.stats,
        totalGamesImported: Array.isArray(raw.games) ? raw.games.length : 0
      },
      migratedAt: new Date().toISOString()
    };
  }
  return {
    ...base,
    ...raw,
    graphVersion: CHESS_MEMORY_GRAPH_VERSION_V0,
    games: Array.isArray(raw.games) ? raw.games : [],
    embeddings: Array.isArray(raw.embeddings) ? raw.embeddings : [],
    playerStyles:
      Array.isArray(raw.playerStyles) && raw.playerStyles.length > 0
        ? raw.playerStyles
        : seedPlayerStylesFromMindsV0(),
    stats: { ...base.stats, ...(raw.stats || {}) }
  };
}

function writeStoreV0(store) {
  const next = Object.freeze({
    ...store,
    schema: CHESS_MEMORY_STORE_SCHEMA_V0,
    graphVersion: CHESS_MEMORY_GRAPH_VERSION_V0,
    updatedAt: new Date().toISOString()
  });
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(CHESS_MEMORY_STORE_LS_KEY_V0, JSON.stringify(next));
    } catch {
      /* noop */
    }
  }
  cachedStoreV0 = next;
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("rhizoh:chess-memory-store-v0", { detail: next }));
    } catch {
      /* noop */
    }
  }
  return next;
}

export function readChessMemoryStoreV0() {
  if (cachedStoreV0) return cachedStoreV0;
  cachedStoreV0 = Object.freeze(migrateStoreV0(readRawStoreV0()));
  return cachedStoreV0;
}

/**
 * @param {object} gameRow
 */
export function upsertChessMemoryGameV0(gameRow) {
  const store = { ...readChessMemoryStoreV0(), games: [...readChessMemoryStoreV0().games] };
  const id = String(gameRow.id);
  const idx = store.games.findIndex((g) => g.id === id);
  const row = Object.freeze({ ...gameRow, id });
  if (idx >= 0) store.games[idx] = row;
  else store.games.unshift(row);
  store.games = store.games.slice(0, CHESS_MEMORY_MAX_GAMES_V0);
  store.stats = Object.freeze({
    ...store.stats,
    totalGamesImported: store.games.length,
    lastImportAt: new Date().toISOString()
  });
  return writeStoreV0(store);
}

/**
 * @param {string} bundleId
 */
export function markChessCorpusBundleLoadedV0(bundleId) {
  const store = { ...readChessMemoryStoreV0() };
  const bundles = new Set(store.stats?.corpusBundlesLoaded || []);
  bundles.add(String(bundleId));
  store.stats = Object.freeze({
    ...store.stats,
    corpusBundlesLoaded: Object.freeze([...bundles])
  });
  return writeStoreV0(store);
}

export function listChessMemoryGamesV0(limit = 32) {
  const games = readChessMemoryStoreV0().games || [];
  return Object.freeze(games.slice(0, Math.max(1, limit)));
}

/** @internal vitest */
export function __resetChessMemoryStoreForTestV0() {
  cachedStoreV0 = null;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.removeItem(CHESS_MEMORY_STORE_LS_KEY_V0);
    } catch {
      /* noop */
    }
  }
}
