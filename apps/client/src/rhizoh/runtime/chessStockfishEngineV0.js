/**
 * Stockfish engine bridge v0 — strong AI for Chess Arena; falls back to heuristic AI.
 */

import { pickChessArenaAiMoveV0 } from "./chessArenaEngineV0.js";

export const CHESS_STOCKFISH_ENGINE_SCHEMA_V0 = "castle.chess_stockfish_engine.v0";

/** @type {Worker | null} */
let workerV0 = null;
/** @type {Map<number, { resolve: Function, reject: Function }>} */
const pendingV0 = new Map();
/** @type {{ resolve: Function, reject: Function, timer: ReturnType<typeof setTimeout> } | null} */
let activeAnalysisV0 = null;
let lastAnalysisInfoV0 = { cp: null, mate: null, depth: 0, pv: "", bestMove: null };
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

      const depthMatch = line.match(/\bdepth (\d+)\b/);
      const cpMatch = line.match(/\bscore cp (-?\d+)\b/);
      const mateMatch = line.match(/\bscore mate (-?\d+)\b/);
      const pvMatch = line.match(/\bpv (.+)$/);
      if (depthMatch || cpMatch || mateMatch || pvMatch) {
        lastAnalysisInfoV0 = {
          cp: cpMatch ? Number(cpMatch[1]) : lastAnalysisInfoV0.cp,
          mate: mateMatch ? Number(mateMatch[1]) : lastAnalysisInfoV0.mate,
          depth: depthMatch ? Number(depthMatch[1]) : lastAnalysisInfoV0.depth,
          pv: pvMatch ? pvMatch[1].trim() : lastAnalysisInfoV0.pv,
          bestMove: lastAnalysisInfoV0.bestMove
        };
      }

      const m = line.match(/^bestmove\s+(\S+)/);
      if (m) {
        const move = m[1] && m[1] !== "(none)" ? m[1] : null;
        lastAnalysisInfoV0 = { ...lastAnalysisInfoV0, bestMove: move };
        if (activeAnalysisV0) {
          clearTimeout(activeAnalysisV0.timer);
          const { resolve } = activeAnalysisV0;
          activeAnalysisV0 = null;
          resolve(Object.freeze({ ...lastAnalysisInfoV0 }));
          return;
        }
        const id = [...pendingV0.keys()].pop();
        const row = id != null ? pendingV0.get(id) : null;
        if (row) {
          pendingV0.delete(id);
          row.resolve(move);
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
 * Analyze a position — returns eval cp/mate, depth, pv, bestMove (UCI).
 * @param {string} fen
 * @param {{ depth?: number, movetimeMs?: number }} [opts]
 */
export async function analyzeChessPositionV0(fen, opts = {}) {
  const position = String(fen || "").trim();
  if (!position) return null;
  const worker = await ensureStockfishWorkerV0();
  if (!worker) return null;

  const depth = Math.max(6, Math.min(18, Number(opts.depth) || 10));
  const movetime = Math.max(120, Math.min(4000, Number(opts.movetimeMs) || 600));

  if (activeAnalysisV0) {
    try {
      worker.postMessage("stop");
    } catch {
      /* noop */
    }
    clearTimeout(activeAnalysisV0.timer);
    activeAnalysisV0 = null;
  }

  lastAnalysisInfoV0 = { cp: null, mate: null, depth: 0, pv: "", bestMove: null };

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      activeAnalysisV0 = null;
      resolve(
        lastAnalysisInfoV0.bestMove || lastAnalysisInfoV0.cp != null
          ? Object.freeze({ ...lastAnalysisInfoV0 })
          : null
      );
    }, movetime + 800);

    activeAnalysisV0 = {
      resolve: (info) => {
        clearTimeout(timer);
        resolve(info);
      },
      reject: () => {
        clearTimeout(timer);
        resolve(null);
      },
      timer
    };

    worker.postMessage(`position fen ${position}`);
    worker.postMessage(`go depth ${depth} movetime ${movetime}`);
  });
}

/**
 * @param {string} fenBefore
 * @param {string} playedMove — SAN or UCI
 * @param {{ depth?: number }} [opts]
 */
export async function analyzePlayedMoveV0(fenBefore, playedMove, opts = {}) {
  const before = await analyzeChessPositionV0(fenBefore, opts);
  if (!before) return null;

  const { Chess } = await import("chess.js");
  const chess = new Chess(fenBefore);
  try {
    chess.move(playedMove);
  } catch {
    return Object.freeze({
      before,
      after: null,
      swingCp: null,
      bestMove: before.bestMove,
      alternative: before.pv ? before.pv.split(" ")[0] : before.bestMove,
      playedMove: String(playedMove)
    });
  }
  const after = await analyzeChessPositionV0(chess.fen(), { ...opts, movetimeMs: 280 });
  const side = fenBefore.includes(" w ") ? 1 : -1;
  const beforeCp = before.cp ?? 0;
  const afterCp = after?.cp != null ? -(after.cp) : 0;
  const swingCp = (afterCp - beforeCp) * side;

  return Object.freeze({
    before,
    after,
    swingCp,
    bestMove: before.bestMove,
    alternative: before.pv ? before.pv.split(" ")[0] : before.bestMove,
    playedMove: String(playedMove)
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
  activeAnalysisV0 = null;
  pendingV0.clear();
}
