/**
 * Chess Engine Registry v0 — pluggable opponent backends (Stockfish today; LC0 slot reserved).
 * RESEARCH-ONLY — no execution authority; move selection stays in arena/cluster pipelines.
 */

export const CHESS_ENGINE_REGISTRY_SCHEMA_V0 = "castle.rhizoh.chess_engine_registry.v0";

export const CHESS_ENGINE_BACKEND_ID_V0 = Object.freeze({
  STOCKFISH_WASM_16: "stockfish_wasm_16",
  LC0_UCI: "lc0_uci",
  HEURISTIC_FALLBACK: "heuristic_fallback"
});

/** @type {Readonly<Record<string, { available: boolean, description: string }>>} */
export const CHESS_ENGINE_REGISTRY_V0 = Object.freeze({
  [CHESS_ENGINE_BACKEND_ID_V0.STOCKFISH_WASM_16]: Object.freeze({
    available: true,
    description: "Stockfish 16 NNUE single-thread WASM (browser)"
  }),
  [CHESS_ENGINE_BACKEND_ID_V0.LC0_UCI]: Object.freeze({
    available: false,
    description: "Leela Chess Zero UCI — reserved; weights + bridge not bundled"
  }),
  [CHESS_ENGINE_BACKEND_ID_V0.HEURISTIC_FALLBACK]: Object.freeze({
    available: true,
    description: "Rhizoh heuristic when WASM offline"
  })
});

/**
 * @param {string} [preferred]
 * @returns {string}
 */
export function resolveChessEngineBackendV0(preferred) {
  const id = String(preferred || CHESS_ENGINE_BACKEND_ID_V0.STOCKFISH_WASM_16);
  const entry = CHESS_ENGINE_REGISTRY_V0[id];
  if (entry?.available) return id;
  return CHESS_ENGINE_BACKEND_ID_V0.HEURISTIC_FALLBACK;
}

export function listChessEngineBackendsV0() {
  return Object.freeze(
    Object.entries(CHESS_ENGINE_REGISTRY_V0).map(([id, meta]) =>
      Object.freeze({ id, ...meta })
    )
  );
}
