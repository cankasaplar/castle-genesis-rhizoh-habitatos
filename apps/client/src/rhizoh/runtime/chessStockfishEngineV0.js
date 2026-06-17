/**
 * Stockfish engine bridge v0 — strong AI for Chess Arena; falls back to heuristic AI.
 * Worker loads from /chess-engine/ (public) so .wasm MIME is correct on Firebase Hosting.
 */

import { pickChessArenaAiMoveV0 } from "./chessArenaEngineV0.js";
import { pickChessAgentHeuristicMoveV0 } from "./chessAgentHeuristicV0.js";
import {
  CHESS_ENGINE_BRIDGE_KIND_V0,
  emitChessEngineBridgeV0
} from "./chessEngineBridgeV0.js";
import { CHESS_STOCKFISH_PRESET_V0 } from "./chessStockfishPresetsV0.js";

export const CHESS_STOCKFISH_ENGINE_SCHEMA_V0 = "castle.chess_stockfish_engine.v0";
export const CHESS_STOCKFISH_LOG_TAG_V0 = "[CASTLE_stockfish_engine]";
export const CHESS_STOCKFISH_ENGINE_STATUS_EVENT_V0 = "rhizoh:chess-stockfish-engine-status-v0";
export const CHESS_STOCKFISH_CLUSTER_MULTI_PV_V0 = 8;

export const CHESS_STOCKFISH_ASSET_PATHS_V0 = Object.freeze({
  workerJs: "/chess-engine/stockfish-nnue-16-single.js",
  wasm: "/chess-engine/stockfish-nnue-16-single.wasm"
});

/** Single isolated pipeline — main-thread wasm only; no worker fallback chain. */
export const CHESS_STOCKFISH_SPAWN_POLICY_V0 = "wasm_single_thread_isolated";
export const CHESS_STOCKFISH_SINGLE_PIPELINE_V0 = "wasm_single_thread_isolated";
export const CHESS_STOCKFISH_WORKER_STRATEGY_V0 = "main_thread_isolated";

/** @type {boolean | null} */
let workerJsCorpOkV0 = null;
/** @type {boolean | null} */
let wasmCorpOkV0 = null;

function isCorpHeaderOkV0(value) {
  const corp = String(value || "").toLowerCase();
  return corp.includes("same-origin") || corp.includes("same-site");
}

/** @returns {"wasm_single_thread_isolated"} */
export function resolveChessStockfishEffectiveSpawnPolicyV0() {
  return "wasm_single_thread_isolated";
}

/** @type {string | null} */
let lastSpawnStrategyV0 = null;

/** @type {{ postMessage: Function, terminate?: Function, addMessageListener: Function } | null} */
let stockfishMainEngineV0 = null;
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
/** @type {number | null} */
let lastMainThreadCompileMsV0 = null;
/** @type {string[]} */
const spawnBlobUrlsV0 = [];
/** @type {string | null} */
let currentPositionFenV0 = null;

const STOCKFISH_UCI_TIMEOUT_MS_V0 = 60000;
const STOCKFISH_READY_TIMEOUT_MS_V0 = 15000;
const STOCKFISH_COMPILE_WATCHDOG_MS_V0 = 75000;

/** @type {ReturnType<typeof setInterval> | null} */
let compileWatchdogTimerV0 = null;
let compileWatchdogStartedAtV0 = 0;

export function getChessStockfishEngineStatusV0() {
  if (initFailedV0) return "heuristic_fallback";
  if (stockfishMainEngineV0 && readyV0) return "stockfish_wasm";
  if (stockfishMainEngineV0 && uciOkV0) return "stockfish_initializing";
  if (stockfishMainEngineV0) return "stockfish_compiling";
  if (initPromiseV0) return "stockfish_compiling";
  return "not_started";
}

function getActiveStockfishBridgeV0() {
  return stockfishMainEngineV0;
}

function postStockfishBridgeMessageV0(message) {
  stockfishMainEngineV0?.postMessage?.(message);
}

function disposeStockfishBridgeV0() {
  try {
    stockfishMainEngineV0?.terminate?.();
  } catch {
    /* noop */
  }
  stockfishMainEngineV0 = null;
}

export function getChessStockfishEngineDetailV0() {
  const status = getChessStockfishEngineStatusV0();
  return Object.freeze({
    status,
    initError: initErrorV0,
    assetsVerified: assetsVerifiedV0,
    pipeline: CHESS_STOCKFISH_SINGLE_PIPELINE_V0,
    wasmPath: CHESS_STOCKFISH_ASSET_PATHS_V0.wasm,
    lastSpawnStrategy: lastSpawnStrategyV0,
    compileElapsedMs:
      compileWatchdogStartedAtV0 > 0 && status.includes("stockfish")
        ? Date.now() - compileWatchdogStartedAtV0
        : null,
    mainThreadCompileMs: lastMainThreadCompileMsV0,
    spawnStrategies: listStockfishSpawnStrategiesV0(),
    spawnPolicy: CHESS_STOCKFISH_SPAWN_POLICY_V0,
    spawnPolicyEffective: resolveChessStockfishEffectiveSpawnPolicyV0(),
    workerStrategy: CHESS_STOCKFISH_WORKER_STRATEGY_V0,
    singlePipeline: true,
    fallbackDisabled: true,
    hashWorkersDisabled: true,
    deploymentLayer: Object.freeze({
      workerJsCorpOk: workerJsCorpOkV0,
      wasmCorpOk: wasmCorpOkV0,
      siteCoep: "credentialless",
      coepNote: "credentialless intentional for Cesium; require-corp not used",
      workerSpawnDisabled: true,
      workerFallbackDisabled: true
    }),
    computeDegraded: status === "heuristic_fallback"
  });
}

function clearCompileWatchdogV0() {
  if (compileWatchdogTimerV0) {
    clearInterval(compileWatchdogTimerV0);
    compileWatchdogTimerV0 = null;
  }
  compileWatchdogStartedAtV0 = 0;
}

function armCompileWatchdogV0() {
  clearCompileWatchdogV0();
  compileWatchdogStartedAtV0 = Date.now();
  compileWatchdogTimerV0 = setInterval(() => {
    const status = getChessStockfishEngineStatusV0();
    if (status === "stockfish_wasm" || status === "heuristic_fallback" || status === "not_started") {
      clearCompileWatchdogV0();
      return;
    }
    const elapsedMs = Date.now() - compileWatchdogStartedAtV0;
    publishEngineStatusV0("compile_watchdog_tick");
    if (elapsedMs > STOCKFISH_COMPILE_WATCHDOG_MS_V0) {
      clearCompileWatchdogV0();
      initFailedV0 = true;
      initErrorV0 = "stockfish_compile_watchdog_timeout";
      logStockfishV0("error", "compile watchdog timeout", {
        elapsedMs,
        lastSpawnStrategy: lastSpawnStrategyV0
      });
      disposeChessStockfishEngineV0();
      initPromiseV0 = null;
      publishEngineStatusV0("compile_watchdog_timeout");
    }
  }, 4000);
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

function handleStockfishLineV0(line) {
  line = String(line ?? "").trim();
  if (line.startsWith("sf_worker_error:")) {
    initErrorV0 = line.slice("sf_worker_error:".length);
    logStockfishV0("error", "worker bootstrap error", { error: initErrorV0, strategy: lastSpawnStrategyV0 });
    return;
  }
  if (line.startsWith("sf_worker_stage:")) {
    logStockfishV0("info", "worker bootstrap stage", { stage: line.slice("sf_worker_stage:".length) });
    return;
  }
  if (!uciOkV0 && line && line !== "uciok" && line !== "readyok") {
    logStockfishV0("info", "worker message during init", { line: line.slice(0, 120) });
  }
  if (line === "uciok") {
    uciOkV0 = true;
    logStockfishV0("info", "uciok", { strategy: lastSpawnStrategyV0 });
    publishEngineStatusV0("uciok");
    try {
      postStockfishBridgeMessageV0("isready");
    } catch {
      /* noop */
    }
  }
  if (line === "readyok") {
    readyV0 = true;
    logStockfishV0("info", "readyok", { strategy: lastSpawnStrategyV0 });
    publishEngineStatusV0("readyok");
  }

  const depthMatch = line.match(/\bdepth (\d+)\b/);
  const cpMatch = line.match(/\bscore cp (-?\d+)\b/);
  const mateMatch = line.match(/\bscore mate (-?\d+)\b/);
  const pvMatch = line.match(/\bpv (.+)$/);
  const multipvMatch = line.match(/\bmultipv (\d+)\b/);

  if (multipvMatch && activeMultiPvAnalysisV0) {
    const idx = Number(multipvMatch[1]);
    const pv = pvMatch ? pvMatch[1].trim() : "";
    multiPvSnapshotV0.set(idx, {
      multipv: idx,
      cp: cpMatch ? Number(cpMatch[1]) : null,
      mate: mateMatch ? Number(mateMatch[1]) : null,
      depth: depthMatch ? Number(depthMatch[1]) : 0,
      pv,
      bestMove: pv ? pv.split(/\s+/)[0] : null
    });
  } else if (depthMatch || cpMatch || mateMatch || pvMatch) {
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
    if (activeMultiPvAnalysisV0) {
      clearTimeout(activeMultiPvAnalysisV0.timer);
      const { resolve } = activeMultiPvAnalysisV0;
      activeMultiPvAnalysisV0 = null;
      const lines = [...multiPvSnapshotV0.values()].sort((a, b) => a.multipv - b.multipv);
      resolve(
        lines.length
          ? Object.freeze({
              fen: currentPositionFenV0,
              lines: Object.freeze(lines.map((row) => Object.freeze({ ...row })))
            })
          : null
      );
      return;
    }
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
}

function attachStockfishEngineHandlersV0(engine) {
  if (!engine || typeof engine.postMessage !== "function") {
    throw new Error("stockfish_engine_postMessage_missing");
  }
  if (typeof engine.addMessageListener !== "function") {
    throw new Error("stockfish_addMessageListener_missing");
  }
  engine.addMessageListener((line) => {
    handleStockfishLineV0(typeof line === "string" ? line : String(line ?? ""));
  });
}

let initPromiseV0 = null;
/** @type {Promise<unknown>} */
let engineOpChainV0 = Promise.resolve();
/** @type {{ resolve: Function, timer: ReturnType<typeof setTimeout>, multiPv: number } | null} */
let activeMultiPvAnalysisV0 = null;
/** @type {Map<number, { multipv: number, cp: number | null, mate: number | null, depth: number, pv: string, bestMove: string | null }>} */
const multiPvSnapshotV0 = new Map();

/**
 * Serialize all UCI traffic through the single shared worker.
 * @template T
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
export function withChessStockfishEngineLockV0(fn) {
  const op = engineOpChainV0.then(() => fn());
  engineOpChainV0 = op.then(
    () => undefined,
    () => undefined
  );
  return op;
}

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
      logStockfishV0("info", "worker js CORP absent — hash URL workers disabled; blob/xfer spawn only", {
        jsCorp: jsCorp || null,
        note: "expected_under_credentialless_when_using_blob_pipeline"
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

const STOCKFISH_AUTO_WORKER_GATE_V0 =
  '"undefined"!=typeof self&&"worker"===self.location.hash.split(",")[1]';
const STOCKFISH_AUTO_WORKER_GATE_DISABLED_V0 =
  'false&&"undefined"!=typeof self&&"worker"===self.location.hash.split(",")[1]';
const STOCKFISH_ONMESSAGE_WORKER_GATE_V0 =
  '"undefined"!=typeof onmessage&&("undefined"==typeof window||void 0===window.document)';
const STOCKFISH_ONMESSAGE_WORKER_GATE_DISABLED_V0 =
  'false&&"undefined"!=typeof onmessage&&("undefined"==typeof window||void 0===window.document)';
const STOCKFISH_FACTORY_EXPORT_V0 =
  '(typeof self!=="undefined"?self.__SF_STOCKFISH_FACTORY__=i:0)';

/**
 * Stockfish hi-ogawa bundle exports outer factory `i`; engine boots via i()(opts).then.
 * @param {Function} outerFactory
 * @param {Record<string, unknown>} [opts]
 */
export function invokeStockfishFactoryV0(outerFactory, opts = {}) {
  if (typeof outerFactory !== "function") {
    return Promise.reject(new Error("stockfish_factory_missing"));
  }
  const inner = outerFactory();
  if (typeof inner !== "function") {
    return Promise.reject(new Error("stockfish_factory_inner_missing"));
  }
  const result = inner(opts);
  if (result && typeof result.then === "function") {
    return result;
  }
  return Promise.reject(new Error("stockfish_factory_not_promise"));
}

const STOCKFISH_AUTO_BOOT_TAIL_V0 =
  '):"object"==typeof document&&document.currentScript?document.currentScript._exports=i():i())';
const STOCKFISH_AUTO_BOOT_TAIL_MANUAL_V0 =
  `):"object"==typeof document&&document.currentScript?${STOCKFISH_FACTORY_EXPORT_V0}:${STOCKFISH_FACTORY_EXPORT_V0})`;

function patchStockfishSourceForManualInitV0(jsSource) {
  if (!jsSource.includes(STOCKFISH_AUTO_WORKER_GATE_V0)) {
    throw new Error("stockfish_auto_worker_gate_missing");
  }
  if (!jsSource.includes(STOCKFISH_ONMESSAGE_WORKER_GATE_V0)) {
    throw new Error("stockfish_onmessage_worker_gate_missing");
  }
  if (!jsSource.includes(STOCKFISH_AUTO_BOOT_TAIL_V0)) {
    throw new Error("stockfish_auto_boot_tail_missing");
  }
  return jsSource
    .split(STOCKFISH_AUTO_WORKER_GATE_V0)
    .join(STOCKFISH_AUTO_WORKER_GATE_DISABLED_V0)
    .split(STOCKFISH_ONMESSAGE_WORKER_GATE_V0)
    .join(STOCKFISH_ONMESSAGE_WORKER_GATE_DISABLED_V0)
    .split(STOCKFISH_AUTO_BOOT_TAIL_V0)
    .join(STOCKFISH_AUTO_BOOT_TAIL_MANUAL_V0);
}

function loadStockfishFactoryFromPatchedSourceV0(patchedSource) {
  if (typeof document === "undefined") {
    return Promise.reject(new Error("main_thread_requires_document"));
  }
  return new Promise((resolve, reject) => {
    const globalRef = typeof globalThis !== "undefined" ? globalThis : window;
    globalRef.__SF_STOCKFISH_FACTORY__ = undefined;
    const blob = new Blob([patchedSource], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    trackSpawnBlobUrlV0(url);
    const script = document.createElement("script");
    script.async = true;
    script.src = url;
    script.onload = () => {
      const factory = globalRef.__SF_STOCKFISH_FACTORY__;
      script.remove();
      if (typeof factory !== "function") {
        reject(new Error("stockfish_factory_missing"));
        return;
      }
      resolve(factory);
    };
    script.onerror = () => reject(new Error("stockfish_script_load_failed"));
    document.head.appendChild(script);
  });
}

async function initStockfishEngineIsolatedV0() {
  lastSpawnStrategyV0 = CHESS_STOCKFISH_SINGLE_PIPELINE_V0;
  const assets = await ensureCachedStockfishAssetsV0();
  const compileStartedAt = Date.now();
  logStockfishV0("info", "starting isolated main-thread stockfish", {
    strategy: CHESS_STOCKFISH_SINGLE_PIPELINE_V0,
    uciTimeoutMs: STOCKFISH_UCI_TIMEOUT_MS_V0,
    wasmBytes: assets.wasmBytes.length,
    workerFallbackDisabled: true
  });
  const patched = patchStockfishSourceForManualInitV0(assets.jsSource);
  const factory = await loadStockfishFactoryFromPatchedSourceV0(patched);
  const wasmBinary = assets.wasmBytes.slice();
  const engine = await invokeStockfishFactoryV0(factory, { wasmBinary });
  lastMainThreadCompileMsV0 = Date.now() - compileStartedAt;
  attachStockfishEngineHandlersV0(engine);
  stockfishMainEngineV0 = engine;
  postStockfishBridgeMessageV0("uci");
  await waitUciOkV0(STOCKFISH_UCI_TIMEOUT_MS_V0);
  postStockfishBridgeMessageV0("isready");
  await waitReadyV0(STOCKFISH_READY_TIMEOUT_MS_V0);
  postStockfishBridgeMessageV0("setoption name UCI_AnalyseMode value false");
  postStockfishBridgeMessageV0("setoption name Hash value 64");
  return engine;
}

function listStockfishSpawnStrategiesV0() {
  return [CHESS_STOCKFISH_SINGLE_PIPELINE_V0];
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
  if (stockfishMainEngineV0 && readyV0) return stockfishMainEngineV0;
  if (typeof document === "undefined") {
    initFailedV0 = true;
    initErrorV0 = "main_thread_unavailable";
    return null;
  }
  if (initPromiseV0) return initPromiseV0;

  initPromiseV0 = (async () => {
    const initStartedAtMs = Date.now();
    armCompileWatchdogV0();
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
        pipeline: CHESS_STOCKFISH_SINGLE_PIPELINE_V0,
        workerJsCorpOk: workerJsCorpOkV0,
        wasmCorpOk: wasmCorpOkV0,
        workerFallbackDisabled: true
      });
      publishEngineStatusV0("preflight_ok");

      disposeStockfishBridgeV0();
      resetReadyFlagsV0();
      await initStockfishEngineIsolatedV0();
      logStockfishV0("info", "ready", {
        status: "stockfish_wasm",
        strategy: CHESS_STOCKFISH_SINGLE_PIPELINE_V0,
        initMs: Date.now() - initStartedAtMs
      });
      clearCompileWatchdogV0();
      publishEngineStatusV0("init_ready");
      return stockfishMainEngineV0;
    } catch (err) {
      initFailedV0 = true;
      initErrorV0 = String(err?.message || "stockfish_init_failed");
      logStockfishV0("error", "init failed", {
        error: initErrorV0,
        strategy: CHESS_STOCKFISH_SINGLE_PIPELINE_V0
      });
      clearCompileWatchdogV0();
      publishEngineStatusV0("init_failed");
      disposeStockfishBridgeV0();
      resetReadyFlagsV0();
      revokeSpawnBlobUrlsV0();
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
  if (getChessStockfishEngineStatusV0() !== "stockfish_wasm") {
    if (opts.awaitReady) {
      const worker = await ensureStockfishWorkerV0();
      if (!worker) return null;
    } else {
      return null;
    }
  }
  return withChessStockfishEngineLockV0(async () => {
  const position = String(fen || "").trim();
  if (!position) return null;
  if (!getActiveStockfishBridgeV0()) return null;

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
      postStockfishBridgeMessageV0("setoption name UCI_LimitStrength value true");
      postStockfishBridgeMessageV0(`setoption name Skill Level value ${skill}`);
      if (contempt != null) {
        postStockfishBridgeMessageV0(
          `setoption name Contempt value ${Math.max(-100, Math.min(100, contempt))}`
        );
      }
      currentPositionFenV0 = position;
      postStockfishBridgeMessageV0(`position fen ${position}`);
      postStockfishBridgeMessageV0(`go depth ${depth} movetime ${movetimeMs}`);
    } catch {
      clearTimeout(timer);
      pendingV0.delete(id);
      resolve(null);
    }
  });
  });
}

/**
 * Analyze a position — returns eval cp/mate, depth, pv, bestMove (UCI).
 * @param {string} fen
 * @param {{ depth?: number, movetimeMs?: number }} [opts]
 */
export async function analyzeChessPositionV0(fen, opts = {}) {
  return withChessStockfishEngineLockV0(async () => {
  const position = String(fen || "").trim();
  if (!position) return null;
  const worker = await ensureStockfishWorkerV0();
  if (!worker) return null;

  const depth = Math.max(6, Math.min(18, Number(opts.depth) || 10));
  const movetime = Math.max(120, Math.min(4000, Number(opts.movetimeMs) || 600));

  if (activeMultiPvAnalysisV0) {
    clearTimeout(activeMultiPvAnalysisV0.timer);
    activeMultiPvAnalysisV0 = null;
    multiPvSnapshotV0.clear();
  }
  if (activeAnalysisV0) {
    try {
      postStockfishBridgeMessageV0("stop");
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
      postStockfishBridgeMessageV0(`position fen ${position}`);
      postStockfishBridgeMessageV0(`go depth ${depth} movetime ${movetime}`);
    } catch {
      clearTimeout(timer);
      activeAnalysisV0 = null;
      resolve(null);
    }
  });
  });
}

/**
 * Multi-PV analysis — one engine, N strategic lines (cluster learning observatory).
 * @param {string} fen
 * @param {{ multiPv?: number, depth?: number, movetimeMs?: number }} [opts]
 */
export async function analyzeChessPositionMultiPvV0(fen, opts = {}) {
  return withChessStockfishEngineLockV0(async () => {
    const position = String(fen || "").trim();
    if (!position) return null;
    const worker = await ensureStockfishWorkerV0();
    if (!worker) return null;

    const multiPv = Math.max(
      1,
      Math.min(CHESS_STOCKFISH_CLUSTER_MULTI_PV_V0, Number(opts.multiPv) || CHESS_STOCKFISH_CLUSTER_MULTI_PV_V0)
    );
    const depth = Math.max(6, Math.min(16, Number(opts.depth) || 10));
    const movetime = Math.max(200, Math.min(3000, Number(opts.movetimeMs) || 500));

    if (activeAnalysisV0) {
      clearTimeout(activeAnalysisV0.timer);
      activeAnalysisV0 = null;
    }
    if (activeMultiPvAnalysisV0) {
      clearTimeout(activeMultiPvAnalysisV0.timer);
      activeMultiPvAnalysisV0 = null;
    }
    multiPvSnapshotV0.clear();

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        activeMultiPvAnalysisV0 = null;
        try {
          postStockfishBridgeMessageV0("stop");
        } catch {
          /* noop */
        }
        const lines = [...multiPvSnapshotV0.values()].sort((a, b) => a.multipv - b.multipv);
        multiPvSnapshotV0.clear();
        resolve(
          lines.length
            ? Object.freeze({
                fen: position,
                multiPv,
                lines: Object.freeze(lines.map((row) => Object.freeze({ ...row })))
              })
            : null
        );
      }, movetime + 600);

      activeMultiPvAnalysisV0 = { resolve, timer, multiPv };

      try {
        currentPositionFenV0 = position;
        postStockfishBridgeMessageV0(`setoption name MultiPV value ${multiPv}`);
        postStockfishBridgeMessageV0(`position fen ${position}`);
        postStockfishBridgeMessageV0(`go depth ${depth} movetime ${movetime}`);
      } catch {
        clearTimeout(timer);
        activeMultiPvAnalysisV0 = null;
        multiPvSnapshotV0.clear();
        resolve(null);
      }
    });
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

function arenaHeuristicFallbackV0(game, opts = {}) {
  const preset =
    opts.preset && CHESS_STOCKFISH_PRESET_V0[opts.preset]
      ? CHESS_STOCKFISH_PRESET_V0[opts.preset]
      : CHESS_STOCKFISH_PRESET_V0.ARENA;
  const policy = Object.freeze({
    contempt: preset.skill >= 18 ? 20 : preset.skill >= 14 ? 8 : -4,
    explorationRate: 0.09,
    riskProfile: preset.skill >= 18 ? "aggressive" : preset.skill >= 14 ? "balanced" : "defensive"
  });
  const move =
    pickChessAgentHeuristicMoveV0(game, policy, { agentId: opts.preset || "ARENA" }) ||
    pickChessArenaAiMoveV0(game);
  return Object.freeze({ move, engine: "heuristic_fallback" });
}

/**
 * @param {ReturnType<import('./chessArenaEngineV0.js').createChessArenaGameV0>} game
 * @param {{ useStockfish?: boolean, preset?: string, skill?: number, movetimeMs?: number }} [opts]
 */
export async function pickChessArenaEngineMoveV0(game, opts = {}) {
  if (opts.useStockfish === false) {
    return arenaHeuristicFallbackV0(game, opts);
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
  return arenaHeuristicFallbackV0(game, opts);
}

/**
 * Non-blocking Stockfish warm-up — safe during core boot / ingress overlay.
 */
export function prewarmChessStockfishEngineV0() {
  if (typeof window === "undefined") return Promise.resolve(null);
  return ensureStockfishWorkerV0().catch(() => null);
}

/** Wait for the single pipeline init attempt to finish (ready or fallback). */
export async function awaitChessStockfishEngineReadyV0() {
  await ensureStockfishWorkerV0();
  return getChessStockfishEngineStatusV0();
}

export function resetChessStockfishEngineV0() {
  disposeChessStockfishEngineV0();
  clearCompileWatchdogV0();
  initFailedV0 = false;
  initErrorV0 = null;
  initPromiseV0 = null;
  assetsVerifiedV0 = false;
  cachedAssetPayloadV0 = null;
  lastMainThreadCompileMsV0 = null;
  workerJsCorpOkV0 = null;
  wasmCorpOkV0 = null;
  publishEngineStatusV0("reset");
}

export function disposeChessStockfishEngineV0() {
  disposeStockfishBridgeV0();
  resetReadyFlagsV0();
  activeAnalysisV0 = null;
  pendingV0.clear();
  revokeSpawnBlobUrlsV0();
}
