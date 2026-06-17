/**
 * Chess EngineBridge v0 — SSOT event pipeline between Stockfish worker and observers.
 * Phase 1: engine truth layer. Observers (UGE) subscribe here; window global is registry only.
 */

export const CHESS_ENGINE_BRIDGE_SCHEMA_V0 = "rhizoh.chess_engine_bridge.v0";
export const CHESS_ENGINE_BRIDGE_EVENT_V0 = "rhizoh:chess-engine-bridge-v0";

export const CHESS_ENGINE_BRIDGE_KIND_V0 = Object.freeze({
  BESTMOVE: "bestmove",
  ENGINE_STATUS: "engine_status",
  PLAYED_MOVE: "played_move"
});

/** @type {Map<string, Set<Function>>} */
const listenersV0 = new Map();

/** @type {object | null} */
let lastBestmoveV0 = null;

/** @type {object | null} */
let lastPlayedMoveV0 = null;

/** @type {object | null} */
let lastEngineStatusV0 = null;

function publishRegistryV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.engineBridge = Object.freeze({
    schema: CHESS_ENGINE_BRIDGE_SCHEMA_V0,
    lastBestmove: lastBestmoveV0,
    lastPlayedMove: lastPlayedMoveV0,
    lastEngineStatus: lastEngineStatusV0,
    listenerCount: [...listenersV0.values()].reduce((n, set) => n + set.size, 0)
  });
}

/**
 * @param {string} event
 * @param {Function} handler
 */
export function onChessEngineBridgeV0(event, handler) {
  const key = String(event || "");
  if (!key || typeof handler !== "function") return () => {};
  if (!listenersV0.has(key)) listenersV0.set(key, new Set());
  listenersV0.get(key).add(handler);
  publishRegistryV0();
  return () => offChessEngineBridgeV0(key, handler);
}

/**
 * @param {string} event
 * @param {Function} handler
 */
export function offChessEngineBridgeV0(event, handler) {
  const key = String(event || "");
  const set = listenersV0.get(key);
  if (!set) return;
  set.delete(handler);
  if (set.size === 0) listenersV0.delete(key);
  publishRegistryV0();
}

/**
 * @param {string} event
 * @param {object} payload
 */
export function emitChessEngineBridgeV0(event, payload = {}) {
  const kind = String(event || "");
  const detail = Object.freeze({
    schema: CHESS_ENGINE_BRIDGE_SCHEMA_V0,
    kind,
    executionTimeMs: typeof performance !== "undefined" ? performance.now() : Date.now(),
    atMs: Date.now(),
    ...payload
  });

  if (kind === CHESS_ENGINE_BRIDGE_KIND_V0.BESTMOVE) {
    lastBestmoveV0 = detail;
  } else if (kind === CHESS_ENGINE_BRIDGE_KIND_V0.PLAYED_MOVE) {
    lastPlayedMoveV0 = detail;
  } else if (kind === CHESS_ENGINE_BRIDGE_KIND_V0.ENGINE_STATUS) {
    lastEngineStatusV0 = detail;
  }

  publishRegistryV0();

  const handlers = listenersV0.get(kind);
  if (handlers) {
    for (const fn of handlers) {
      try {
        fn(detail);
      } catch {
        /* observer must not break engine */
      }
    }
  }

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(CHESS_ENGINE_BRIDGE_EVENT_V0, { detail }));
    } catch {
      /* noop */
    }
  }

  return detail;
}

export function getChessEngineBridgeRegistryV0() {
  return Object.freeze({
    schema: CHESS_ENGINE_BRIDGE_SCHEMA_V0,
    lastBestmove: lastBestmoveV0,
    lastPlayedMove: lastPlayedMoveV0,
    lastEngineStatus: lastEngineStatusV0
  });
}

/** @internal test reset */
export function __resetChessEngineBridgeForTestV0() {
  listenersV0.clear();
  lastBestmoveV0 = null;
  lastPlayedMoveV0 = null;
  lastEngineStatusV0 = null;
  publishRegistryV0();
}
