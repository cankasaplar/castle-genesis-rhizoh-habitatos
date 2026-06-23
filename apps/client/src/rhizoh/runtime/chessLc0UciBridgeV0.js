/**
 * LC0 UCI bridge skeleton v0 — optional sidecar WebSocket transport.
 * RESEARCH-ONLY — no execution authority; learning/truth enrichment only.
 *
 * Configure via VITE_RHIZOH_LC0_UCI_URL (ws:// or wss:// UCI sidecar).
 * Weights are not bundled in the client; sidecar must host LC0.
 */

export const CHESS_LC0_UCI_BRIDGE_SCHEMA_V0 = "castle.rhizoh.chess_lc0_uci_bridge.v0";
export const CHESS_LC0_UCI_STATUS_EVENT_V0 = "rhizoh:chess-lc0-uci-status-v0";

const LC0_UCI_READY_TIMEOUT_MS_V0 = 12000;
const LC0_ANALYSIS_TIMEOUT_MS_V0 = 45000;

/** @type {WebSocket | null} */
let wsV0 = null;
/** @type {Promise<void> | null} */
let connectPromiseV0 = null;
let uciOkV0 = false;
let readyV0 = false;
let initFailedV0 = false;
let initErrorV0 = null;
/** @type {{ resolve: Function, reject: Function, timer: ReturnType<typeof setTimeout> } | null} */
let activeAnalysisV0 = null;
let lastAnalysisInfoV0 = { cp: null, mate: null, depth: 0, pv: "", bestMove: null };
let seqV0 = 0;

/**
 * @returns {string | null}
 */
export function resolveChessLc0UciEndpointV0() {
  const raw = String(import.meta.env?.VITE_RHIZOH_LC0_UCI_URL || "").trim();
  return raw || null;
}

export function isChessLc0UciConfiguredV0() {
  return Boolean(resolveChessLc0UciEndpointV0());
}

export function getChessLc0EngineStatusV0() {
  if (!isChessLc0UciConfiguredV0()) return "not_configured";
  if (initFailedV0) return "lc0_offline";
  if (wsV0 && readyV0) return "lc0_uci";
  if (wsV0 && uciOkV0) return "lc0_initializing";
  if (connectPromiseV0) return "lc0_connecting";
  return "not_started";
}

function publishLc0StatusV0() {
  if (typeof window === "undefined") return;
  const detail = Object.freeze({
    schema: CHESS_LC0_UCI_BRIDGE_SCHEMA_V0,
    status: getChessLc0EngineStatusV0(),
    configured: isChessLc0UciConfiguredV0(),
    endpoint: resolveChessLc0UciEndpointV0(),
    atMs: Date.now()
  });
  window.dispatchEvent(new CustomEvent(CHESS_LC0_UCI_STATUS_EVENT_V0, { detail }));
}

/**
 * Parse UCI info line for cp/mate/depth/pv.
 * @param {string} line
 */
export function parseChessLc0UciInfoLineV0(line) {
  const text = String(line || "");
  if (!text.startsWith("info ")) return null;
  const depthMatch = text.match(/\bdepth (\d+)/);
  const cpMatch = text.match(/\bscore cp (-?\d+)/);
  const mateMatch = text.match(/\bscore mate (-?\d+)/);
  const pvMatch = text.match(/\bpv (.+)$/);
  return Object.freeze({
    depth: depthMatch ? Number(depthMatch[1]) : 0,
    cp: cpMatch ? Number(cpMatch[1]) : null,
    mate: mateMatch ? Number(mateMatch[1]) : null,
    pv: pvMatch ? pvMatch[1].trim() : "",
    line: text
  });
}

/**
 * @param {string} line
 */
function handleLc0LineV0(line) {
  const text = String(line || "").trim();
  if (!text) return;

  if (text === "uciok") {
    uciOkV0 = true;
    deliverLc0UciCommandV0("isready");
    publishLc0StatusV0();
    return;
  }
  if (text === "readyok") {
    readyV0 = true;
    publishLc0StatusV0();
    return;
  }

  if (text.startsWith("info ")) {
    const info = parseChessLc0UciInfoLineV0(text);
    if (!info) return;
    lastAnalysisInfoV0 = {
      cp: info.mate != null ? (info.mate > 0 ? 10000 : -10000) : info.cp,
      mate: info.mate,
      depth: info.depth || lastAnalysisInfoV0.depth,
      pv: info.pv || lastAnalysisInfoV0.pv,
      bestMove: lastAnalysisInfoV0.bestMove
    };
    return;
  }

  if (text.startsWith("bestmove ")) {
    const parts = text.split(/\s+/);
    const bestMove = parts[1] && parts[1] !== "(none)" ? parts[1] : null;
    lastAnalysisInfoV0 = { ...lastAnalysisInfoV0, bestMove };
    if (activeAnalysisV0) {
      clearTimeout(activeAnalysisV0.timer);
      activeAnalysisV0.resolve(
        Object.freeze({
          schema: `${CHESS_LC0_UCI_BRIDGE_SCHEMA_V0}.analysis`,
          bestMove,
          cp: lastAnalysisInfoV0.cp,
          mate: lastAnalysisInfoV0.mate,
          depth: lastAnalysisInfoV0.depth,
          pv: lastAnalysisInfoV0.pv,
          backend: "lc0_uci",
          atMs: Date.now()
        })
      );
      activeAnalysisV0 = null;
    }
  }
}

function deliverLc0UciCommandV0(command) {
  const cmd = String(command || "");
  if (!wsV0 || wsV0.readyState !== WebSocket.OPEN || !cmd) return false;
  wsV0.send(`${cmd}\n`);
  return true;
}

function failConnectV0(error) {
  initFailedV0 = true;
  initErrorV0 = error instanceof Error ? error.message : String(error || "lc0_connect_failed");
  connectPromiseV0 = null;
  publishLc0StatusV0();
}

function connectChessLc0UciBridgeV0() {
  if (connectPromiseV0) return connectPromiseV0;
  const endpoint = resolveChessLc0UciEndpointV0();
  if (!endpoint) {
    return Promise.reject(new Error("lc0_not_configured"));
  }

  connectPromiseV0 = new Promise((resolve, reject) => {
    try {
      wsV0 = new WebSocket(endpoint);
    } catch (err) {
      failConnectV0(err);
      reject(err);
      return;
    }

    const readyTimer = setTimeout(() => {
      if (!readyV0) {
        failConnectV0(new Error("lc0_ready_timeout"));
        try {
          wsV0?.close();
        } catch {
          /* ignore */
        }
        reject(new Error("lc0_ready_timeout"));
      }
    }, LC0_UCI_READY_TIMEOUT_MS_V0);

    wsV0.onopen = () => {
      initFailedV0 = false;
      initErrorV0 = null;
      deliverLc0UciCommandV0("uci");
      publishLc0StatusV0();
    };

    wsV0.onmessage = (ev) => {
      const payload = String(ev.data || "");
      for (const line of payload.split("\n")) {
        handleLc0LineV0(line);
      }
      if (readyV0) {
        clearTimeout(readyTimer);
        resolve();
      }
    };

    wsV0.onerror = () => {
      clearTimeout(readyTimer);
      failConnectV0(new Error("lc0_ws_error"));
      reject(new Error("lc0_ws_error"));
    };

    wsV0.onclose = () => {
      readyV0 = false;
      uciOkV0 = false;
      connectPromiseV0 = null;
      publishLc0StatusV0();
    };
  });

  return connectPromiseV0;
}

/**
 * @param {{ movetimeMs?: number, nodes?: number }} [opts]
 */
export async function analyzeChessPositionLc0V0(fen, opts = {}) {
  const position = String(fen || "").trim();
  if (!position) return null;
  if (!isChessLc0UciConfiguredV0()) return null;

  try {
    await connectChessLc0UciBridgeV0();
  } catch {
    return null;
  }
  if (!readyV0) return null;

  const movetimeMs = Math.max(50, Number(opts.movetimeMs) || 800);
  const nodes = Number(opts.nodes);

  return new Promise((resolve, reject) => {
    if (activeAnalysisV0) {
      clearTimeout(activeAnalysisV0.timer);
      activeAnalysisV0.reject(new Error("lc0_analysis_superseded"));
    }

    const timer = setTimeout(() => {
      activeAnalysisV0 = null;
      deliverLc0UciCommandV0("stop");
      resolve(
        Object.freeze({
          schema: `${CHESS_LC0_UCI_BRIDGE_SCHEMA_V0}.analysis`,
          bestMove: lastAnalysisInfoV0.bestMove,
          cp: lastAnalysisInfoV0.cp,
          mate: lastAnalysisInfoV0.mate,
          depth: lastAnalysisInfoV0.depth,
          pv: lastAnalysisInfoV0.pv,
          timedOut: true,
          backend: "lc0_uci",
          atMs: Date.now()
        })
      );
    }, LC0_ANALYSIS_TIMEOUT_MS_V0);

    activeAnalysisV0 = { resolve, reject, timer };
    lastAnalysisInfoV0 = { cp: null, mate: null, depth: 0, pv: "", bestMove: null };

    deliverLc0UciCommandV0(`position fen ${position}`);
    if (Number.isFinite(nodes) && nodes > 0) {
      deliverLc0UciCommandV0(`go nodes ${Math.floor(nodes)}`);
    } else {
      deliverLc0UciCommandV0(`go movetime ${Math.floor(movetimeMs)}`);
    }
  });
}

/**
 * Centipawn eval for fusion when bridge is ready; null otherwise.
 * @param {string | null} fen
 * @param {{ movetimeMs?: number }} [opts]
 */
export async function resolveLc0EvalCpV0(fen, opts = {}) {
  const analysis = await analyzeChessPositionLc0V0(fen, opts);
  if (!analysis || analysis.cp == null) return null;
  return Number(analysis.cp);
}

export function prewarmChessLc0EngineV0() {
  if (!isChessLc0UciConfiguredV0()) {
    return Promise.resolve(getChessLc0EngineStatusV0());
  }
  return connectChessLc0UciBridgeV0()
    .then(() => getChessLc0EngineStatusV0())
    .catch(() => getChessLc0EngineStatusV0());
}

export function getChessLc0BridgeSnapshotV0() {
  return Object.freeze({
    schema: CHESS_LC0_UCI_BRIDGE_SCHEMA_V0,
    status: getChessLc0EngineStatusV0(),
    configured: isChessLc0UciConfiguredV0(),
    endpoint: resolveChessLc0UciEndpointV0(),
    ready: readyV0,
    initFailed: initFailedV0,
    initError: initErrorV0,
    lastAnalysis: Object.freeze({ ...lastAnalysisInfoV0 }),
    atMs: Date.now(),
    interpretationOnly: true,
    nonExecutive: true
  });
}

export function ensureChessLc0UciBridgeDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.chessLc0UciBridge = () => getChessLc0BridgeSnapshotV0();
  window.__rhizoh.analyzeChessPositionLc0 = (fen, opts) => analyzeChessPositionLc0V0(fen, opts);
  return window.__rhizoh.chessLc0UciBridge;
}

/** @internal vitest */
export function __resetChessLc0UciBridgeForTestV0() {
  if (activeAnalysisV0) {
    clearTimeout(activeAnalysisV0.timer);
    activeAnalysisV0 = null;
  }
  try {
    wsV0?.close();
  } catch {
    /* ignore */
  }
  wsV0 = null;
  connectPromiseV0 = null;
  uciOkV0 = false;
  readyV0 = false;
  initFailedV0 = false;
  initErrorV0 = null;
  lastAnalysisInfoV0 = { cp: null, mate: null, depth: 0, pv: "", bestMove: null };
}
