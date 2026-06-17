/**
 * Stockfish engine bridge v0 — strong AI for Chess Arena; falls back to heuristic AI.
 * Worker loads from /chess-engine/ (public) so .wasm MIME is correct on Firebase Hosting.
 */

import { pickChessArenaAiMoveV0 } from "./chessArenaEngineV0.js";
import {
  CHESS_ENGINE_BRIDGE_KIND_V0,
  emitChessEngineBridgeV0
} from "./chessEngineBridgeV0.js";
import { CHESS_STOCKFISH_PRESET_V0 } from "./chessStockfishPresetsV0.js";

export const CHESS_STOCKFISH_ENGINE_SCHEMA_V0 = "castle.chess_stockfish_engine.v0";
export const CHESS_STOCKFISH_LOG_TAG_V0 = "[CASTLE_stockfish_engine]";
export const CHESS_STOCKFISH_ENGINE_STATUS_EVENT_V0 = "rhizoh:chess-stockfish-engine-status-v0";

export const CHESS_STOCKFISH_ASSET_PATHS_V0 = Object.freeze({
  workerJs: "/chess-engine/stockfish-nnue-16-single.js",
  wasm: "/chess-engine/stockfish-nnue-16-single.wasm"
});

/** Compute-layer spawn policy. Deployment CORP headers gate wasm_direct under `auto`. */
export const CHESS_STOCKFISH_SPAWN_POLICY_V0 = "auto";

/** @type {boolean | null} */
let workerJsCorpOkV0 = null;
/** @type {boolean | null} */
let wasmCorpOkV0 = null;

function isCorpHeaderOkV0(value) {
  const corp = String(value || "").toLowerCase();
  return corp.includes("same-origin") || corp.includes("same-site");
}

/**
 * Effective compute path — separate from deployment (COEP/CORP on /chess-engine/*).
 * @returns {"wasm_direct" | "blob_degraded"}
 */
export function resolveChessStockfishEffectiveSpawnPolicyV0() {
  const configured = CHESS_STOCKFISH_SPAWN_POLICY_V0;
  if (configured === "blob_only") return "blob_degraded";
  if (configured === "wasm_direct") return "wasm_direct";
  if (workerJsCorpOkV0 === true && wasmCorpOkV0 === true) return "wasm_direct";
  return "blob_degraded";
}

function resolveStockfishWorkerUrlV0(wasmInHash = null) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const js = CHESS_STOCKFISH_ASSET_PATHS_V0.workerJs;
  const wasmPath = wasmInHash || CHESS_STOCKFISH_ASSET_PATHS_V0.wasm;
  const wasm =
    wasmPath.startsWith("http://") || wasmPath.startsWith("https://")
      ? wasmPath
      : `${origin}${wasmPath}`;
  return `${origin}${js}#${encodeURIComponent(wasm)},worker`;
}

/** @type {string | null} */
let lastSpawnStrategyV0 = null;

/** @type {((err: Error) => void) | null} */
let workerErrorRejectV0 = null;

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
/** @type {{ jsSource: string, wasmBytes: Uint8Array } | null} */
let cachedAssetPayloadV0 = null;
/** @type {string[]} */
const spawnBlobUrlsV0 = [];
/** @type {string | null} */
let currentPositionFenV0 = null;

const STOCKFISH_UCI_TIMEOUT_MS_V0 = 45000;
const STOCKFISH_READY_TIMEOUT_MS_V0 = 20000;
const STOCKFISH_UCI_TIMEOUT_HEAVY_MS_V0 = 120000;

export function getChessStockfishEngineStatusV0() {
  if (initFailedV0) return "heuristic_fallback";
  if (workerV0 && readyV0) return "stockfish_wasm";
  if (workerV0 && uciOkV0) return "stockfish_initializing";
  if (workerV0) return "stockfish_compiling";
  if (initPromiseV0) return "stockfish_compiling";
  return "not_started";
}

export function getChessStockfishEngineDetailV0() {
  return Object.freeze({
    status: getChessStockfishEngineStatusV0(),
    initError: initErrorV0,
    assetsVerified: assetsVerifiedV0,
    workerUrl: resolveStockfishWorkerUrlV0(),
    wasmPath: CHESS_STOCKFISH_ASSET_PATHS_V0.wasm,
    lastSpawnStrategy: lastSpawnStrategyV0,
    spawnStrategies: listStockfishSpawnStrategiesV0().map((s) => s.name),
    spawnPolicy: CHESS_STOCKFISH_SPAWN_POLICY_V0,
    spawnPolicyEffective: resolveChessStockfishEffectiveSpawnPolicyV0(),
    deploymentLayer: Object.freeze({
      workerJsCorpOk: workerJsCorpOkV0,
      wasmCorpOk: wasmCorpOkV0,
      siteCoep: "credentialless"
    }),
    computeDegraded: resolveChessStockfishEffectiveSpawnPolicyV0() === "blob_degraded"
  });
}

function logStockfishV0(level, message, detail = null) {
  const payload = detail == null ? message : { message, ...detail };
  if (typeof console !== "undefined" && console[level]) {
    console[level](CHESS_STOCKFISH_LOG_TAG_V0, payload);
  }
}

function publishEngineStatusV0(reason = "status_change") {
  const detail = Object.freeze({
    ...getChessStockfishEngineDetailV0(),
    reason,
    atMs: Date.now()
  });
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.chessStockfishEngine = detail;
    window.dispatchEvent(new CustomEvent(CHESS_STOCKFISH_ENGINE_STATUS_EVENT_V0, { detail }));
  }
  emitChessEngineBridgeV0(CHESS_ENGINE_BRIDGE_KIND_V0.ENGINE_STATUS, {
    status: detail.status,
    initError: detail.initError,
    assetsVerified: detail.assetsVerified,
    reason: detail.reason
  });
  return detail;
}

function emitBestmoveBridgeV0(move, fenOverride = null) {
  const fen = fenOverride || currentPositionFenV0;
  if (!fen || !move) return;
  emitChessEngineBridgeV0(CHESS_ENGINE_BRIDGE_KIND_V0.BESTMOVE, {
    fen,
    stockfishEval: Object.freeze({
      bestMove: move,
      cp: lastAnalysisInfoV0.cp,
      mate: lastAnalysisInfoV0.mate,
      depth: lastAnalysisInfoV0.depth,
      pv: lastAnalysisInfoV0.pv
    })
  });
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
      publishEngineStatusV0("uciok");
      try {
        worker.postMessage("isready");
      } catch {
        /* noop */
      }
    }
    if (line === "readyok") {
      readyV0 = true;
      publishEngineStatusV0("readyok");
    }

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
      if (move) emitBestmoveBridgeV0(move);
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
    const detail = {
      error: String(err?.message || "worker_error"),
      filename: err?.filename || null,
      lineno: err?.lineno || null,
      colno: err?.colno || null,
      strategy: lastSpawnStrategyV0
    };
    initErrorV0 = detail.error;
    logStockfishV0("error", "worker onerror", detail);
    try {
      worker?.terminate?.();
    } catch {
      /* noop */
    }
    workerV0 = null;
    resetReadyFlagsV0();
    publishEngineStatusV0("worker_error");
    if (workerErrorRejectV0) {
      workerErrorRejectV0(new Error(detail.error));
      workerErrorRejectV0 = null;
    }
  };
  worker.onmessageerror = () => {
    initFailedV0 = true;
    initErrorV0 = "worker_message_error";
    logStockfishV0("error", "worker onmessageerror");
    publishEngineStatusV0("worker_message_error");
  };
}

let initPromiseV0 = null;

function isWasmMagicValidV0(bytes) {
  return (
    bytes &&
    bytes.length >= 4 &&
    bytes[0] === 0 &&
    bytes[1] === 97 &&
    bytes[2] === 115 &&
    bytes[3] === 109
  );
}

function isLikelyHtmlPayloadV0(bytes) {
  if (!bytes || bytes.length < 8) return false;
  const head = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5]).toLowerCase();
  return head.includes("<!doc") || head.includes("<html");
}

function trackSpawnBlobUrlV0(url) {
  const value = String(url || "");
  if (value.startsWith("blob:")) spawnBlobUrlsV0.push(value);
}

function revokeSpawnBlobUrlsV0() {
  while (spawnBlobUrlsV0.length) {
    const url = spawnBlobUrlsV0.pop();
    try {
      URL.revokeObjectURL(url);
    } catch {
      /* noop */
    }
  }
}

async function ensureCachedStockfishAssetsV0() {
  if (cachedAssetPayloadV0) return cachedAssetPayloadV0;
  const ok = await verifyStockfishAssetsV0();
  if (!ok || !cachedAssetPayloadV0) {
    throw new Error(initErrorV0 || "stockfish_asset_cache_missing");
  }
  return cachedAssetPayloadV0;
}

async function verifyStockfishAssetsV0() {
  if (typeof fetch === "undefined") return false;
  try {
    const [jsRes, wasmRes] = await Promise.all([
      fetch(CHESS_STOCKFISH_ASSET_PATHS_V0.workerJs, { method: "GET", cache: "no-store" }),
      fetch(CHESS_STOCKFISH_ASSET_PATHS_V0.wasm, { method: "GET", cache: "no-store" })
    ]);
    if (!jsRes.ok || !wasmRes.ok) {
      initErrorV0 = `asset_preflight_${jsRes.status}_${wasmRes.status}`;
      logStockfishV0("error", "asset preflight failed", {
        jsStatus: jsRes.status,
        wasmStatus: wasmRes.status
      });
      return false;
    }

    const jsType = (jsRes.headers.get("content-type") || "").toLowerCase();
    const wasmType = (wasmRes.headers.get("content-type") || "").toLowerCase();
    const jsCorp = (jsRes.headers.get("cross-origin-resource-policy") || "").toLowerCase();
    const wasmCorp = (wasmRes.headers.get("cross-origin-resource-policy") || "").toLowerCase();
    workerJsCorpOkV0 = isCorpHeaderOkV0(jsCorp);
    wasmCorpOkV0 = isCorpHeaderOkV0(wasmCorp);
    if (!workerJsCorpOkV0) {
      logStockfishV0("warn", "worker js missing CORP header — wasm_direct disabled under auto policy", {
        jsCorp: jsCorp || null,
        spawnPolicyEffective: resolveChessStockfishEffectiveSpawnPolicyV0()
      });
    }
    if (wasmType.includes("text/html")) {
      initErrorV0 = "wasm_content_type_html_likely_spa_fallback";
      logStockfishV0("error", "wasm preflight content-type is html", { wasmType });
      return false;
    }

    const [jsSource, wasmBytes] = await Promise.all([jsRes.text(), wasmRes.arrayBuffer()]);
    const wasmView = new Uint8Array(wasmBytes);
    if (!isWasmMagicValidV0(wasmView)) {
      initErrorV0 = isLikelyHtmlPayloadV0(wasmView)
        ? "wasm_magic_invalid_likely_cached_html"
        : "wasm_magic_invalid";
      logStockfishV0("error", "wasm magic preflight failed", {
        initError: initErrorV0,
        wasmType,
        jsType,
        head: [...wasmView.slice(0, 8)]
      });
      return false;
    }

    if (jsSource.trimStart().startsWith("<") || jsType.includes("text/html")) {
      initErrorV0 = "worker_js_likely_html_shell";
      logStockfishV0("error", "worker js preflight looks like html", { jsType });
      return false;
    }

    cachedAssetPayloadV0 = { jsSource, wasmBytes: wasmView };
    assetsVerifiedV0 = true;
    return true;
  } catch (err) {
    initErrorV0 = String(err?.message || "asset_preflight_error");
    logStockfishV0("error", "asset preflight exception", { error: initErrorV0 });
    return false;
  }
}

const STOCKFISH_WORKER_WEB_INIT_RE_V0 =
  /e=\{locateFile:function\(e\)\{return-1<e\.indexOf\("\.wasm"\)\?r:self\.location\.origin\+self\.location\.pathname\+"#"\+r\+",worker"\}\},i\(\)\(e\)\.then/;

function bytesToBase64V0(bytes) {
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, bytes.length);
    for (let j = i; j < end; j += 1) binary += String.fromCharCode(bytes[j]);
  }
  return btoa(binary);
}

function buildWasmBinaryInlineWorkerUrlV0(assets) {
  if (!STOCKFISH_WORKER_WEB_INIT_RE_V0.test(assets.jsSource)) {
    throw new Error("stockfish_worker_patch_missing");
  }
  const patched = assets.jsSource.replace(
    STOCKFISH_WORKER_WEB_INIT_RE_V0,
    'e={wasmBinary:self.__SF_WASM_BINARY__,locateFile:function(e){return-1<e.indexOf(".wasm")?r:self.location.origin+self.location.pathname+"#"+r+",worker"}},i()(e).then'
  );
  const wasmB64 = bytesToBase64V0(assets.wasmBytes);
  const bootstrap = `"use strict";
self.__SF_WASM_BINARY__=Uint8Array.from(atob(${JSON.stringify(wasmB64)}),function(c){return c.charCodeAt(0);});
${patched}`;
  const jsBlobUrl = URL.createObjectURL(new Blob([bootstrap], { type: "application/javascript" }));
  trackSpawnBlobUrlV0(jsBlobUrl);
  return `${jsBlobUrl}#inline_wasm,worker`;
}

function buildWasmDirectStrategiesV0() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const absoluteWasm = `${origin}${CHESS_STOCKFISH_ASSET_PATHS_V0.wasm}`;
  return [
    {
      name: "absolute_hash",
      uciTimeoutMs: STOCKFISH_UCI_TIMEOUT_MS_V0,
      build: async () => resolveStockfishWorkerUrlV0(absoluteWasm)
    },
    {
      name: "relative_hash",
      uciTimeoutMs: STOCKFISH_UCI_TIMEOUT_MS_V0,
      build: async () => resolveStockfishWorkerUrlV0(CHESS_STOCKFISH_ASSET_PATHS_V0.wasm)
    }
  ];
}

function buildBlobStrategiesV0() {
  return [
    {
      name: "wasm_binary_inline",
      uciTimeoutMs: STOCKFISH_UCI_TIMEOUT_HEAVY_MS_V0,
      build: async () => {
        const assets = await ensureCachedStockfishAssetsV0();
        return buildWasmBinaryInlineWorkerUrlV0(assets);
      }
    },
    {
      name: "blob_coep",
      uciTimeoutMs: STOCKFISH_UCI_TIMEOUT_MS_V0,
      build: async () => {
        const assets = await ensureCachedStockfishAssetsV0();
        const jsBlobUrl = URL.createObjectURL(
          new Blob([assets.jsSource], { type: "application/javascript" })
        );
        const wasmBlobUrl = URL.createObjectURL(
          new Blob([assets.wasmBytes], { type: "application/wasm" })
        );
        trackSpawnBlobUrlV0(jsBlobUrl);
        trackSpawnBlobUrlV0(wasmBlobUrl);
        return `${jsBlobUrl}#${encodeURIComponent(wasmBlobUrl)},worker`;
      }
    }
  ];
}

function listStockfishSpawnStrategiesV0() {
  const blob = buildBlobStrategiesV0();
  if (resolveChessStockfishEffectiveSpawnPolicyV0() === "wasm_direct") {
    return [...buildWasmDirectStrategiesV0(), ...blob];
  }
  return blob;
}

async function initStockfishWorkerWithStrategyV0(strategy) {
  lastSpawnStrategyV0 = strategy.name;
  const uciTimeoutMs = Number(strategy.uciTimeoutMs) || STOCKFISH_UCI_TIMEOUT_MS_V0;
  const workerUrl = await strategy.build();
  logStockfishV0("info", "spawning worker", { workerUrl, strategy: strategy.name, uciTimeoutMs });
  const worker = new Worker(workerUrl, { type: "classic" });
  attachWorkerHandlersV0(worker);
  worker.postMessage("uci");
  await waitForWorkerOrUciV0(uciTimeoutMs);
  worker.postMessage("isready");
  await waitReadyV0(STOCKFISH_READY_TIMEOUT_MS_V0);
  worker.postMessage("setoption name UCI_AnalyseMode value false");
  worker.postMessage("setoption name Hash value 64");
  return worker;
}

function waitForWorkerOrUciV0(timeoutMs) {
  return new Promise((resolve, reject) => {
    workerErrorRejectV0 = reject;
    waitUciOkV0(timeoutMs)
      .then((ok) => {
        workerErrorRejectV0 = null;
        resolve(ok);
      })
      .catch((err) => {
        workerErrorRejectV0 = null;
        reject(err);
      });
  });
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
    const initStartedAtMs = Date.now();
    publishEngineStatusV0("init_started");
    try {
      const assetsOk = await verifyStockfishAssetsV0();
      if (!assetsOk) {
        initFailedV0 = true;
        return null;
      }

      logStockfishV0("info", "spawn policy resolved", {
        spawnPolicy: CHESS_STOCKFISH_SPAWN_POLICY_V0,
        spawnPolicyEffective: resolveChessStockfishEffectiveSpawnPolicyV0(),
        workerJsCorpOk: workerJsCorpOkV0,
        wasmCorpOk: wasmCorpOkV0
      });
      publishEngineStatusV0("preflight_ok");

      resetReadyFlagsV0();
      let lastErr = null;
      for (const strategy of listStockfishSpawnStrategiesV0()) {
        try {
          workerV0 = await initStockfishWorkerWithStrategyV0(strategy);
          logStockfishV0("info", "ready", {
            status: "stockfish_wasm",
            strategy: strategy.name,
            initMs: Date.now() - initStartedAtMs
          });
          publishEngineStatusV0("init_ready");
          return workerV0;
        } catch (err) {
          lastErr = err;
          logStockfishV0("warn", "worker strategy init failed", {
            strategy: strategy.name,
            error: String(err?.message || err)
          });
          try {
            workerV0?.terminate?.();
          } catch {
            /* noop */
          }
          workerV0 = null;
          workerErrorRejectV0 = null;
          resetReadyFlagsV0();
          revokeSpawnBlobUrlsV0();
        }
      }
      throw lastErr || new Error("stockfish_worker_spawn_exhausted");
    } catch (err) {
      initFailedV0 = true;
      initErrorV0 = String(err?.message || "stockfish_init_failed");
      logStockfishV0("error", "init failed", { error: initErrorV0 });
      publishEngineStatusV0("init_failed");
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
      currentPositionFenV0 = position;
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
      currentPositionFenV0 = position;
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

/**
 * Non-blocking Stockfish warm-up — safe during core boot / ingress overlay.
 */
export function prewarmChessStockfishEngineV0() {
  if (typeof window === "undefined") return Promise.resolve(null);
  return ensureStockfishWorkerV0().catch(() => null);
}

export function resetChessStockfishEngineV0() {
  disposeChessStockfishEngineV0();
  initFailedV0 = false;
  initErrorV0 = null;
  assetsVerifiedV0 = false;
  cachedAssetPayloadV0 = null;
  workerJsCorpOkV0 = null;
  wasmCorpOkV0 = null;
  publishEngineStatusV0("reset");
}

export function disposeChessStockfishEngineV0() {
  try {
    workerV0?.terminate?.();
  } catch {
    /* noop */
  }
  workerV0 = null;
  resetReadyFlagsV0();
  activeAnalysisV0 = null;
  pendingV0.clear();
  revokeSpawnBlobUrlsV0();
}
