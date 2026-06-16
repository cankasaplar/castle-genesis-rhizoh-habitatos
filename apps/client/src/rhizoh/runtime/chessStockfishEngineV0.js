/**
 * Stockfish engine bridge v0 — strong AI for Chess Arena; falls back to heuristic AI.
 * Worker loads from /chess-engine/ (public) so .wasm MIME is correct on Firebase Hosting.
 */

import { pickChessArenaAiMoveV0 } from "./chessArenaEngineV0.js";
import { CHESS_STOCKFISH_PRESET_V0 } from "./chessStockfishPresetsV0.js";

export const CHESS_STOCKFISH_ENGINE_SCHEMA_V0 = "castle.chess_stockfish_engine.v0";
export const CHESS_STOCKFISH_LOG_TAG_V0 = "[CASTLE_stockfish_engine]";

export const CHESS_STOCKFISH_ASSET_PATHS_V0 = Object.freeze({
  workerJs: "/chess-engine/stockfish-nnue-16-single.js",
  wasm: "/chess-engine/stockfish-nnue-16-single.wasm"
});

function resolveStockfishWorkerUrlV0() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const js = CHESS_STOCKFISH_ASSET_PATHS_V0.workerJs;
  const wasm = CHESS_STOCKFISH_ASSET_PATHS_V0.wasm;
  return `${origin}${js}#${wasm},worker`;
}

/** @type {Worker | null} */
let workerV0 = null;
/** @type {Map<number, { resolve: Function, reject: Function }>} */
const pendingV0 = new Map();
/** @type {{ resolve: Function, reject: Function, timer: ReturnType<typeof setTimeout> } | null} */
let activeAnalysisV0 = null;
let lastAnalysisInfoV0 = { cp: null, mate: null, depth: 0, pv: "", bestMove: null };
let seqV0 = 0;
let uciOkV0 = false;
let readyV0 = false;
let initFailedV0 = false;
let initErrorV0 = null;
let assetsVerifiedV0 = false;

export function getChessStockfishEngineStatusV0() {
  if (initFailedV0) return "heuristic_fallback";
  if (workerV0 && readyV0) return "stockfish_wasm";
  if (workerV0) return "stockfish_initializing";
  return "not_started";
}

export function getChessStockfishEngineDetailV0() {
  return Object.freeze({
    status: getChessStockfishEngineStatusV0(),
    initError: initErrorV0,
    assetsVerified: assetsVerifiedV0,
    workerUrl: resolveStockfishWorkerUrlV0(),
    wasmPath: CHESS_STOCKFISH_ASSET_PATHS_V0.wasm
  });
}

function logStockfishV0(level, message, detail = null) {
  const payload = detail == null ? message : { message, ...detail };
  if (typeof console !== "undefined" && console[level]) {
    console[level](CHESS_STOCKFISH_LOG_TAG_V0, payload);
  }
}

function nextId() {
  seqV0 += 1;
  return seqV0;
}

function resetReadyFlagsV0() {
  uciOkV0 = false;
  readyV0 = false;
}

function attachWorkerHandlersV0(worker) {
  worker.onmessage = (ev) => {
    const line = String(ev?.data || "");
    if (line === "uciok") {
      uciOkV0 = true;
      try {
        worker.postMessage("isready");
      } catch {
        /* noop */
      }
    }
    if (line === "readyok") readyV0 = true;

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
  worker.onerror = (err) => {
    initFailedV0 = true;
    initErrorV0 = String(err?.message || "worker_error");
    logStockfishV0("error", "worker onerror", { error: initErrorV0 });
    try {
      worker?.terminate?.();
    } catch {
      /* noop */
    }
    workerV0 = null;
    resetReadyFlagsV0();
  };
  worker.onmessageerror = () => {
    initFailedV0 = true;
    initErrorV0 = "worker_message_error";
    logStockfishV0("error", "worker onmessageerror");
  };
}

let initPromiseV0 = null;

async function verifyStockfishAssetsV0() {
  if (typeof fetch === "undefined") return false;
  try {
    const [jsHead, wasmHead] = await Promise.all([
      fetch(CHESS_STOCKFISH_ASSET_PATHS_V0.workerJs, { method: "HEAD", cache: "no-store" }),
      fetch(CHESS_STOCKFISH_ASSET_PATHS_V0.wasm, { method: "HEAD", cache: "no-store" })
    ]);
    if (!jsHead.ok || !wasmHead.ok) {
      initErrorV0 = `asset_preflight_${jsHead.status}_${wasmHead.status}`;
      logStockfishV0("error", "asset preflight failed", {
        jsStatus: jsHead.status,
        wasmStatus: wasmHead.status
      });
      return false;
    }
    assetsVerifiedV0 = true;
    return true;
  } catch (err) {
    initErrorV0 = String(err?.message || "asset_preflight_error");
    logStockfishV0("error", "asset preflight exception", { error: initErrorV0 });
    return false;
  }
}

function waitUciOkV0(timeoutMs) {
  return new Promise((resolve, reject) => {
    if (uciOkV0) {
      resolve(true);
      return;
    }
    const timer = setTimeout(() => reject(new Error("stockfish_uci_timeout")), timeoutMs);
    const check = setInterval(() => {
      if (uciOkV0) {
        clearInterval(check);
        clearTimeout(timer);
        resolve(true);
      }
    }, 30);
  });
}

function waitReadyV0(timeoutMs) {
  return new Promise((resolve, reject) => {
    if (readyV0) {
      resolve(true);
      return;
    }
    const timer = setTimeout(() => reject(new Error("stockfish_ready_timeout")), timeoutMs);
    const check = setInterval(() => {
      if (readyV0) {
        clearInterval(check);
        clearTimeout(timer);
        resolve(true);
      }
    }, 30);
  });
}

async function ensureStockfishWorkerV0() {
  if (initFailedV0) return null;
  if (workerV0 && readyV0) return workerV0;
  if (typeof Worker === "undefined") {
    initFailedV0 = true;
    initErrorV0 = "worker_unavailable";
    return null;
  }
  if (initPromiseV0) return initPromiseV0;

  initPromiseV0 = (async () => {
    try {
      const assetsOk = await verifyStockfishAssetsV0();
      if (!assetsOk) {
        initFailedV0 = true;
        return null;
      }

      resetReadyFlagsV0();
      const workerUrl = resolveStockfishWorkerUrlV0();
      logStockfishV0("info", "spawning worker", { workerUrl });
      workerV0 = new Worker(workerUrl, { type: "classic" });
      attachWorkerHandlersV0(workerV0);
      workerV0.postMessage("uci");
      await waitUciOkV0(20000);
      workerV0.postMessage("isready");
      await waitReadyV0(12000);
      workerV0.postMessage("setoption name UCI_AnalyseMode value false");
      workerV0.postMessage("setoption name Hash value 64");
      logStockfishV0("info", "ready", { status: "stockfish_wasm" });
      return workerV0;
    } catch (err) {
      initFailedV0 = true;
      initErrorV0 = String(err?.message || "stockfish_init_failed");
      logStockfishV0("error", "init failed", { error: initErrorV0 });
      try {
        workerV0?.terminate?.();
      } catch {
        /* noop */
      }
      workerV0 = null;
      resetReadyFlagsV0();
      return null;
    } finally {
      initPromiseV0 = null;
    }
  })();

  return initPromiseV0;
}

function resolveStockfishOptsV0(opts = {}) {
  const preset = opts.preset && CHESS_STOCKFISH_PRESET_V0[opts.preset]
    ? CHESS_STOCKFISH_PRESET_V0[opts.preset]
    : CHESS_STOCKFISH_PRESET_V0.ARENA;
  return {
    skill: Math.max(1, Math.min(20, Number(opts.skill) || preset.skill)),
    movetimeMs: Math.max(80, Math.min(12000, Number(opts.movetimeMs) || preset.movetimeMs)),
    depth: Math.max(6, Math.min(22, Number(opts.depth) || preset.depth))
  };
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

  const { skill, movetimeMs, depth } = resolveStockfishOptsV0(opts);
  const contempt = Number.isFinite(Number(opts.contempt)) ? Number(opts.contempt) : null;

  return new Promise((resolve) => {
    const id = nextId();
    const timer = setTimeout(() => {
      pendingV0.delete(id);
      resolve(null);
    }, movetimeMs + 2000);

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

    try {
      worker.postMessage("setoption name UCI_LimitStrength value true");
      worker.postMessage(`setoption name Skill Level value ${skill}`);
      if (contempt != null) {
        worker.postMessage(`setoption name Contempt value ${Math.max(-100, Math.min(100, contempt))}`);
      }
      worker.postMessage(`position fen ${position}`);
      worker.postMessage(`go depth ${depth} movetime ${movetimeMs}`);
    } catch {
      clearTimeout(timer);
      pendingV0.delete(id);
      resolve(null);
    }
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

    try {
      worker.postMessage(`position fen ${position}`);
      worker.postMessage(`go depth ${depth} movetime ${movetime}`);
    } catch {
      clearTimeout(timer);
      activeAnalysisV0 = null;
      resolve(null);
    }
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
 * @param {{ useStockfish?: boolean, preset?: string, skill?: number, movetimeMs?: number }} [opts]
 */
export async function pickChessArenaEngineMoveV0(game, opts = {}) {
  if (opts.useStockfish === false) {
    const move = pickChessArenaAiMoveV0(game);
    return Object.freeze({ move, engine: "heuristic_fallback" });
  }
  try {
    const sf = await getStockfishArenaMoveV0(game.fen(), {
      preset: opts.preset || "ARENA",
      skill: opts.skill,
      movetimeMs: opts.movetimeMs
    });
    if (sf) return Object.freeze({ move: sf, engine: "stockfish_wasm" });
  } catch {
    /* fall through to heuristic */
  }
  return Object.freeze({ move: pickChessArenaAiMoveV0(game), engine: "heuristic_fallback" });
}

export function resetChessStockfishEngineV0() {
  disposeChessStockfishEngineV0();
  initFailedV0 = false;
  initErrorV0 = null;
  assetsVerifiedV0 = false;
}

export function disposeChessStockfishEngineV0() {
  try {
    workerV0?.terminate?.();
  } catch {
    /* noop */
  }
  workerV0 = null;
  resetReadyFlagsV0();
  initFailedV0 = false;
  initErrorV0 = null;
  activeAnalysisV0 = null;
  pendingV0.clear();
}
