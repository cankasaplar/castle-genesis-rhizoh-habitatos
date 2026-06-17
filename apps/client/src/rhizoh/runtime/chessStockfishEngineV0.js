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

/** COEP-safe: blob inline WASM only — hash URL workers permanently disabled. */
export const CHESS_STOCKFISH_SPAWN_POLICY_V0 = "wasm_binary_inline";
export const CHESS_STOCKFISH_WORKER_STRATEGY_V0 = "blob";

/** @type {boolean | null} */
let workerJsCorpOkV0 = null;
/** @type {boolean | null} */
let wasmCorpOkV0 = null;

function isCorpHeaderOkV0(value) {
  const corp = String(value || "").toLowerCase();
  return corp.includes("same-origin") || corp.includes("same-site");
}

/** @returns {"wasm_binary_inline"} */
export function resolveChessStockfishEffectiveSpawnPolicyV0() {
  return "wasm_binary_inline";
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
/** @type {{ postMessage: Function, terminate?: Function, addMessageListener?: Function } | null} */
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
/** @type {WebAssembly.Module | null} */
let cachedWasmModuleV0 = null;
/** @type {number | null} */
let lastMainThreadCompileMsV0 = null;
/** @type {string[]} */
const spawnBlobUrlsV0 = [];
/** @type {string | null} */
let currentPositionFenV0 = null;

const STOCKFISH_UCI_TIMEOUT_MS_V0 = 45000;
const STOCKFISH_READY_TIMEOUT_MS_V0 = 20000;
const STOCKFISH_UCI_TIMEOUT_HEAVY_MS_V0 = 90000;
const STOCKFISH_COMPILE_WATCHDOG_MS_V0 = 195000;

/** @type {ReturnType<typeof setInterval> | null} */
let compileWatchdogTimerV0 = null;
let compileWatchdogStartedAtV0 = 0;

export function getChessStockfishEngineStatusV0() {
  if (initFailedV0) return "heuristic_fallback";
  const bridgeActive = Boolean(workerV0 || stockfishMainEngineV0);
  if (bridgeActive && readyV0) return "stockfish_wasm";
  if (bridgeActive && uciOkV0) return "stockfish_initializing";
  if (bridgeActive) return "stockfish_compiling";
  if (initPromiseV0) return "stockfish_compiling";
  return "not_started";
}

function getActiveStockfishBridgeV0() {
  return workerV0 || stockfishMainEngineV0;
}

function postStockfishBridgeMessageV0(message) {
  const bridge = getActiveStockfishBridgeV0();
  if (!bridge) return;
  if (workerV0) {
    workerV0.postMessage(message);
    return;
  }
  stockfishMainEngineV0?.postMessage?.(message);
}

function disposeStockfishBridgeV0() {
  try {
    workerV0?.terminate?.();
  } catch {
    /* noop */
  }
  try {
    stockfishMainEngineV0?.terminate?.();
  } catch {
    /* noop */
  }
  workerV0 = null;
  stockfishMainEngineV0 = null;
}

export function getChessStockfishEngineDetailV0() {
  const status = getChessStockfishEngineStatusV0();
  return Object.freeze({
    status,
    initError: initErrorV0,
    assetsVerified: assetsVerifiedV0,
    workerUrl: resolveStockfishWorkerUrlV0(),
    wasmPath: CHESS_STOCKFISH_ASSET_PATHS_V0.wasm,
    lastSpawnStrategy: lastSpawnStrategyV0,
    compileElapsedMs:
      compileWatchdogStartedAtV0 > 0 && status.includes("stockfish")
        ? Date.now() - compileWatchdogStartedAtV0
        : null,
    mainThreadCompileMs: lastMainThreadCompileMsV0,
    wasmModuleCached: Boolean(cachedWasmModuleV0),
    spawnStrategies: listStockfishSpawnStrategiesV0().map((s) => s.name),
    spawnPolicy: CHESS_STOCKFISH_SPAWN_POLICY_V0,
    spawnPolicyEffective: resolveChessStockfishEffectiveSpawnPolicyV0(),
    workerStrategy: CHESS_STOCKFISH_WORKER_STRATEGY_V0,
    hashWorkersDisabled: true,
    deploymentLayer: Object.freeze({
      workerJsCorpOk: workerJsCorpOkV0,
      wasmCorpOk: wasmCorpOkV0,
      siteCoep: "credentialless",
      workerJsSpawnDisabled: true
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

function attachMainThreadHandlersV0(engine) {
  engine.addMessageListener((line) => {
    handleStockfishLineV0(typeof line === "string" ? line : String(line ?? ""));
  });
}

function attachWorkerHandlersV0(worker) {
  worker.onmessage = (ev) => {
    const raw = ev?.data;
    const line = typeof raw === "string" ? raw : raw != null ? String(raw) : "";
    handleStockfishLineV0(line);
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
    stockfishMainEngineV0 = null;
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

const STOCKFISH_WORKER_WEB_INIT_RE_V0 =
  /e=\{locateFile:function\(e\)\{return-1<e\.indexOf\("\.wasm"\)\?r:self\.location\.origin\+self\.location\.pathname\+"#"\+r\+",worker"\}\},i\(\)\(e\)\.then/;

const STOCKFISH_AUTO_WORKER_GATE_V0 =
  '"undefined"!=typeof self&&"worker"===self.location.hash.split(",")[1]';
const STOCKFISH_AUTO_WORKER_GATE_DISABLED_V0 =
  'false&&"undefined"!=typeof self&&"worker"===self.location.hash.split(",")[1]';
const STOCKFISH_AUTO_BOOT_TAIL_V0 =
  '):"object"==typeof document&&document.currentScript?document.currentScript._exports=i():i())';
const STOCKFISH_AUTO_BOOT_TAIL_MANUAL_V0 =
  '):"object"==typeof document&&document.currentScript?document.currentScript._exports=i():(typeof self!=="undefined"?self.__SF_STOCKFISH_FACTORY__=i:0))';

function patchStockfishSourceForManualInitV0(jsSource) {
  if (!jsSource.includes(STOCKFISH_AUTO_WORKER_GATE_V0)) {
    throw new Error("stockfish_auto_worker_gate_missing");
  }
  if (!jsSource.includes(STOCKFISH_AUTO_BOOT_TAIL_V0)) {
    throw new Error("stockfish_auto_boot_tail_missing");
  }
  return jsSource
    .split(STOCKFISH_AUTO_WORKER_GATE_V0)
    .join(STOCKFISH_AUTO_WORKER_GATE_DISABLED_V0)
    .split(STOCKFISH_AUTO_BOOT_TAIL_V0)
    .join(STOCKFISH_AUTO_BOOT_TAIL_MANUAL_V0);
}

const STOCKFISH_XFER_BOOTSTRAP_PREFIX_V0 = `"use strict";
self.__SF_WASM_MODULE__=null;
var __sfModuleWaiters=[];
self.__SF_WAIT_MODULE__=function(){
  return self.__SF_WASM_MODULE__?Promise.resolve(self.__SF_WASM_MODULE__):new Promise(function(r){__sfModuleWaiters.push(r);});
};
function __sfArmWasmModule(m){
  self.__SF_WASM_MODULE__=m;
  __sfModuleWaiters.forEach(function(r){r(m);});
  __sfModuleWaiters=[];
}
self.addEventListener("message",function(ev){
  if(ev.data&&ev.data.cmd==="sf_arm_wasm"){
    __sfArmWasmModule(ev.data.wasmModule);
  }
});
`;

const STOCKFISH_WASM_BINARY_WORKER_INIT_PATCH_V0 =
  'e={wasmBinary:self.__SF_WASM_BYTES__,locateFile:function(e){return-1<e.indexOf(".wasm")?r:self.location.origin+self.location.pathname+"#"+r+",worker"}},i()(e).then';

const STOCKFISH_XFER_WORKER_INIT_PATCH_V0 =
  'e={instantiateWasm:function(im,rcv){var m=self.__SF_WASM_MODULE__;if(!m)throw new Error("sf_wasm_module_missing");WebAssembly.instantiate(m,im).then(function(r){rcv(r.instance,r.module)}).catch(function(err){throw err;});return{}},locateFile:function(e){return-1<e.indexOf(".wasm")?r:self.location.origin+self.location.pathname+"#"+r+",worker"}},(self.__SF_WAIT_MODULE__?self.__SF_WAIT_MODULE__():Promise.resolve()).then(function(){return i()(e)}).then';

function bytesToBase64V0(bytes) {
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, bytes.length);
    for (let j = i; j < end; j += 1) binary += String.fromCharCode(bytes[j]);
  }
  return btoa(binary);
}

function buildBlobJsWasmBlobWorkerUrlV0(assets) {
  if (!STOCKFISH_WORKER_WEB_INIT_RE_V0.test(assets.jsSource)) {
    throw new Error("stockfish_worker_patch_missing");
  }
  const wasmBlobUrl = URL.createObjectURL(
    new Blob([assets.wasmBytes], { type: "application/wasm" })
  );
  trackSpawnBlobUrlV0(wasmBlobUrl);
  const patched = assets.jsSource.replace(
    STOCKFISH_WORKER_WEB_INIT_RE_V0,
    `e={locateFile:function(e){return-1<e.indexOf(".wasm")?${JSON.stringify(wasmBlobUrl)}:self.location.origin+self.location.pathname+"#"+r+",worker"}},i()(e).then`
  );
  const jsBlobUrl = URL.createObjectURL(new Blob([patched], { type: "application/javascript" }));
  trackSpawnBlobUrlV0(jsBlobUrl);
  return `${jsBlobUrl}#wasm_blob,worker`;
}

function buildBlobJsWasmHashWorkerUrlV0(assets) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const wasmUrl = `${origin}${CHESS_STOCKFISH_ASSET_PATHS_V0.wasm}`;
  const jsBlobUrl = URL.createObjectURL(
    new Blob([assets.jsSource], { type: "application/javascript" })
  );
  trackSpawnBlobUrlV0(jsBlobUrl);
  return `${jsBlobUrl}#${encodeURIComponent(wasmUrl)},worker`;
}

async function compileWasmModuleOnMainThreadV0(wasmBytes) {
  if (cachedWasmModuleV0) return cachedWasmModuleV0;
  if (typeof WebAssembly === "undefined" || typeof WebAssembly.compile !== "function") {
    throw new Error("webassembly_compile_unavailable");
  }
  const startedAt = Date.now();
  cachedWasmModuleV0 = await WebAssembly.compile(wasmBytes);
  lastMainThreadCompileMsV0 = Date.now() - startedAt;
  logStockfishV0("info", "main thread wasm compile complete", {
    compileMs: lastMainThreadCompileMsV0,
    wasmBytes: wasmBytes.length
  });
  return cachedWasmModuleV0;
}

function buildXferWasmBytesDeferredWorkerUrlV0(assets) {
  const patched = patchStockfishSourceForManualInitV0(assets.jsSource);
  const stockfishBlobUrl = URL.createObjectURL(
    new Blob([patched], { type: "application/javascript" })
  );
  trackSpawnBlobUrlV0(stockfishBlobUrl);
  const bootstrap = `"use strict";
var __sfBootstrapped=false;
var __sfPendingUci=[];
function __sfDrainPendingUci(){
  if(!self.__sfEngine)return;
  while(__sfPendingUci.length)self.__sfEngine.postMessage(__sfPendingUci.shift());
}
self.addEventListener("message",function(ev){
  var d=ev.data;
  if(typeof d==="string"){
    if(self.__sfEngine)self.__sfEngine.postMessage(d);
    else __sfPendingUci.push(d);
    return;
  }
  if(!d||d.cmd!=="sf_arm_wasm_bytes"||!d.wasmBytes||__sfBootstrapped)return;
  __sfBootstrapped=true;
  self.__SF_WASM_BYTES__=d.wasmBytes;
  try{
    postMessage("sf_worker_stage:import_scripts_start");
    importScripts(${JSON.stringify(stockfishBlobUrl)});
    postMessage("sf_worker_stage:import_scripts_done");
    var create=self.__SF_STOCKFISH_FACTORY__;
    if(typeof create!=="function"){postMessage("sf_worker_error:stockfish_factory_missing");return;}
    create({wasmBinary:self.__SF_WASM_BYTES__}).then(function(engine){
      self.__sfEngine=engine;
      engine.addMessageListener(function(line){postMessage(line);});
      postMessage("sf_worker_stage:engine_ready");
      __sfDrainPendingUci();
    }).catch(function(err){
      postMessage("sf_worker_error:"+String(err&&err.message||err));
    });
  }catch(err){
    postMessage("sf_worker_error:"+String(err&&err.message||err));
  }
});
`;
  const jsBlobUrl = URL.createObjectURL(new Blob([bootstrap], { type: "application/javascript" }));
  trackSpawnBlobUrlV0(jsBlobUrl);
  return `${jsBlobUrl}#xfer_bytes`;
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

async function initMainThreadStockfishEngineV0(assets) {
  const patched = patchStockfishSourceForManualInitV0(assets.jsSource);
  const factory = await loadStockfishFactoryFromPatchedSourceV0(patched);
  const wasmBinary = assets.wasmBytes.slice();
  const engine = await factory({ wasmBinary });
  stockfishMainEngineV0 = engine;
  attachMainThreadHandlersV0(engine);
  postStockfishBridgeMessageV0("uci");
  await waitForWorkerOrUciV0(STOCKFISH_UCI_TIMEOUT_HEAVY_MS_V0);
  postStockfishBridgeMessageV0("isready");
  await waitReadyV0(STOCKFISH_READY_TIMEOUT_MS_V0);
  postStockfishBridgeMessageV0("setoption name UCI_AnalyseMode value false");
  postStockfishBridgeMessageV0("setoption name Hash value 64");
  return engine;
}

function buildXferWasmCompiledWorkerUrlV0(assets) {
  if (!STOCKFISH_WORKER_WEB_INIT_RE_V0.test(assets.jsSource)) {
    throw new Error("stockfish_worker_patch_missing");
  }
  const patched = assets.jsSource.replace(
    STOCKFISH_WORKER_WEB_INIT_RE_V0,
    STOCKFISH_XFER_WORKER_INIT_PATCH_V0
  );
  const bootstrap = `${STOCKFISH_XFER_BOOTSTRAP_PREFIX_V0}${patched}`;
  const jsBlobUrl = URL.createObjectURL(new Blob([bootstrap], { type: "application/javascript" }));
  trackSpawnBlobUrlV0(jsBlobUrl);
  return `${jsBlobUrl}#xfer_wasm,worker`;
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

function listStockfishSpawnStrategiesV0() {
  return [
    {
      name: "main_thread_wasm_binary",
      uciTimeoutMs: STOCKFISH_UCI_TIMEOUT_HEAVY_MS_V0,
      mainThread: true,
      build: async () => {
        await ensureCachedStockfishAssetsV0();
        return "main_thread";
      }
    },
    {
      name: "xfer_wasm_bytes_deferred_import",
      uciTimeoutMs: STOCKFISH_UCI_TIMEOUT_HEAVY_MS_V0,
      xferBytes: true,
      build: async () => {
        const assets = await ensureCachedStockfishAssetsV0();
        return buildXferWasmBytesDeferredWorkerUrlV0(assets);
      }
    },
    {
      name: "xfer_wasm_compiled_module",
      uciTimeoutMs: STOCKFISH_UCI_TIMEOUT_HEAVY_MS_V0,
      xferModule: true,
      build: async () => {
        const assets = await ensureCachedStockfishAssetsV0();
        await compileWasmModuleOnMainThreadV0(assets.wasmBytes);
        return buildXferWasmCompiledWorkerUrlV0(assets);
      }
    },
    {
      name: "blob_js_wasm_blob",
      uciTimeoutMs: STOCKFISH_UCI_TIMEOUT_HEAVY_MS_V0,
      build: async () => {
        const assets = await ensureCachedStockfishAssetsV0();
        return buildBlobJsWasmBlobWorkerUrlV0(assets);
      }
    },
    {
      name: "blob_js_wasm_hash",
      uciTimeoutMs: STOCKFISH_UCI_TIMEOUT_HEAVY_MS_V0,
      build: async () => {
        const assets = await ensureCachedStockfishAssetsV0();
        return buildBlobJsWasmHashWorkerUrlV0(assets);
      }
    },
    {
      name: "wasm_binary_inline",
      uciTimeoutMs: STOCKFISH_UCI_TIMEOUT_HEAVY_MS_V0,
      build: async () => {
        const assets = await ensureCachedStockfishAssetsV0();
        return buildWasmBinaryInlineWorkerUrlV0(assets);
      }
    }
  ];
}

async function initStockfishWorkerWithStrategyV0(strategy) {
  lastSpawnStrategyV0 = strategy.name;
  const uciTimeoutMs = Number(strategy.uciTimeoutMs) || STOCKFISH_UCI_TIMEOUT_MS_V0;

  if (strategy.mainThread) {
    const assets = await ensureCachedStockfishAssetsV0();
    logStockfishV0("info", "starting main-thread stockfish", {
      strategy: strategy.name,
      uciTimeoutMs,
      wasmBytes: assets.wasmBytes.length
    });
    await initMainThreadStockfishEngineV0(assets);
    return stockfishMainEngineV0;
  }

  const workerUrl = await strategy.build();
  logStockfishV0("info", "spawning worker", {
    workerUrl,
    strategy: strategy.name,
    uciTimeoutMs,
    mainThreadCompileMs: lastMainThreadCompileMsV0
  });
  const worker = new Worker(workerUrl, { type: "classic" });
  workerV0 = worker;
  attachWorkerHandlersV0(worker);
  if (strategy.xferBytes) {
    if (!cachedAssetPayloadV0?.wasmBytes) throw new Error("sf_wasm_bytes_cache_missing");
    const bytesCopy = cachedAssetPayloadV0.wasmBytes.slice();
    worker.postMessage({ cmd: "sf_arm_wasm_bytes", wasmBytes: bytesCopy });
  } else if (strategy.xferModule) {
    if (!cachedWasmModuleV0) throw new Error("sf_wasm_module_cache_missing");
    worker.postMessage({ cmd: "sf_arm_wasm", wasmModule: cachedWasmModuleV0 });
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
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
  if ((workerV0 || stockfishMainEngineV0) && readyV0) {
    return workerV0 || stockfishMainEngineV0;
  }
  if (typeof Worker === "undefined") {
    initFailedV0 = true;
    initErrorV0 = "worker_unavailable";
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
        workerJsCorpOk: workerJsCorpOkV0,
        wasmCorpOk: wasmCorpOkV0
      });
      publishEngineStatusV0("preflight_ok");

      resetReadyFlagsV0();
      let lastErr = null;
      for (const strategy of listStockfishSpawnStrategiesV0()) {
        try {
          disposeStockfishBridgeV0();
          resetReadyFlagsV0();
          await initStockfishWorkerWithStrategyV0(strategy);
          if (strategy.mainThread) {
            workerV0 = null;
          } else {
            workerV0 = /** @type {Worker} */ (getActiveStockfishBridgeV0());
            stockfishMainEngineV0 = null;
          }
          logStockfishV0("info", "ready", {
            status: "stockfish_wasm",
            strategy: strategy.name,
            initMs: Date.now() - initStartedAtMs
          });
          clearCompileWatchdogV0();
          publishEngineStatusV0("init_ready");
          return getActiveStockfishBridgeV0();
        } catch (err) {
          lastErr = err;
          logStockfishV0("warn", "worker strategy init failed", {
            strategy: strategy.name,
            error: String(err?.message || err)
          });
          disposeStockfishBridgeV0();
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
      clearCompileWatchdogV0();
      publishEngineStatusV0("init_failed");
      disposeStockfishBridgeV0();
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

export function resetChessStockfishEngineV0() {
  disposeChessStockfishEngineV0();
  clearCompileWatchdogV0();
  initFailedV0 = false;
  initErrorV0 = null;
  initPromiseV0 = null;
  assetsVerifiedV0 = false;
  cachedAssetPayloadV0 = null;
  cachedWasmModuleV0 = null;
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
