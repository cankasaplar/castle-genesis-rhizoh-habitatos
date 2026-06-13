/**
 * Stockfish engine bridge v0 — strong AI for Chess Arena; falls back to heuristic AI.
 */

import { pickChessArenaAiMoveV0 } from "./chessArenaEngineV0.js";

export const CHESS_STOCKFISH_ENGINE_SCHEMA_V0 = "castle.chess_stockfish_engine.v0";

/** @type {Worker | null} */
let workerV0 = null;
/** @type {Map<number, { resolve: Function, reject: Function }>} */
const pendingV0 = new Map();
let seqV0 = 0;
let readyV0 = false;
let initFailedV0 = false;

function nextId() {
  seqV0 += 1;
  return seqV0;
}

async function ensureStockfishWorkerV0() {
  if (initFailedV0) return null;
  if (workerV0 && readyV0) return workerV0;
  if (typeof Worker === "undefined") {
    initFailedV0 = true;
    return null;
  }
  try {
    const mod = await import("stockfish");
    const factory = mod.default || mod;
    workerV0 = factory();
    workerV0.onmessage = (ev) => {
      const line = String(ev?.data || "");
      if (line === "uciok") readyV0 = true;
      const m = line.match(/^bestmove\s+(\S+)/);
      if (m) {
        const id = [...pendingV0.keys()].pop();
        const row = id != null ? pendingV0.get(id) : null;
        if (row) {
          pendingV0.delete(id);
          row.resolve(m[1]);
        }
      }
    };
    workerV0.postMessage("uci");
    await new Promise((resolve, reject) => {
      const id = nextId();
      const timer = setTimeout(() => {
        pendingV0.delete(id);
        reject(new Error("stockfish_uci_timeout"));
      }, 4000);
      pendingV0.set(id, {
        resolve: () => {
          clearTimeout(timer);
          resolve(true);
        },
        reject
      });
      const check = setInterval(() => {
        if (readyV0) {
          clearInterval(check);
          clearTimeout(timer);
          pendingV0.delete(id);
          resolve(true);
        }
      }, 40);
    });
    return workerV0;
  } catch {
    initFailedV0 = true;
    workerV0 = null;
    return null;
  }
}

/**
 * @param {string} fen
 * @param {{ skill?: number, movetimeMs?: number }} [opts]
 */
export async function getStockfishArenaMoveV0(fen, opts = {}) {
  const position = String(fen || "").trim();
  if (!position) return null;
  const worker = await ensureStockfishWorkerV0();
  if (!worker) return null;

  const skill = Math.max(1, Math.min(20, Number(opts.skill) || 12));
  const movetime = Math.max(80, Math.min(8000, Number(opts.movetimeMs) || 450));

  return new Promise((resolve) => {
    const id = nextId();
    const timer = setTimeout(() => {
      pendingV0.delete(id);
      resolve(null);
    }, movetime + 1200);

    pendingV0.set(id, {
      resolve: (move) => {
        clearTimeout(timer);
        resolve(move && move !== "(none)" ? move : null);
      },
      reject: () => {
        clearTimeout(timer);
        resolve(null);
      }
    });

    worker.postMessage(`setoption name Skill Level value ${skill}`);
    worker.postMessage(`position fen ${position}`);
    worker.postMessage(`go movetime ${movetime}`);
  });
}

/**
 * @param {ReturnType<import('./chessArenaEngineV0.js').createChessArenaGameV0>} game
 * @param {{ useStockfish?: boolean }} [opts]
 */
export async function pickChessArenaEngineMoveV0(game, opts = {}) {
  if (opts.useStockfish === false) {
    return pickChessArenaAiMoveV0(game);
  }
  const sf = await getStockfishArenaMoveV0(game.fen(), { movetimeMs: 320 });
  if (sf) return sf;
  return pickChessArenaAiMoveV0(game);
}

export function disposeChessStockfishEngineV0() {
  try {
    workerV0?.terminate?.();
  } catch {
    /* noop */
  }
  workerV0 = null;
  readyV0 = false;
  pendingV0.clear();
}
