/**
 * KataGo GTP bridge skeleton v0 — optional sidecar WebSocket transport.
 * RESEARCH-ONLY — no execution authority; learning confidence enrichment only.
 *
 * Configure via VITE_RHIZOH_KATAGO_GTP_URL (ws:// or wss:// GTP sidecar).
 * Weights live on sidecar; client never bundles KataGo.
 */

export const GO_KATAGO_GTP_BRIDGE_SCHEMA_V0 = "castle.rhizoh.go_katago_gtp_bridge.v0";
export const GO_KATAGO_GTP_STATUS_EVENT_V0 = "rhizoh:go-katago-gtp-status-v0";

const KATAGO_GTP_READY_TIMEOUT_MS_V0 = 12000;
const KATAGO_ANALYSIS_TIMEOUT_MS_V0 = 45000;

/** @type {WebSocket | null} */
let wsV0 = null;
/** @type {Promise<void> | null} */
let connectPromiseV0 = null;
let handshakeOkV0 = false;
let readyV0 = false;
let initFailedV0 = false;
let initErrorV0 = null;
/** @type {{ resolve: Function, timer: ReturnType<typeof setTimeout> } | null} */
let activeAnalysisV0 = null;
let lastAnalysisInfoV0 = { winrate: null, visits: 0, pv: "", bestMove: null };

/**
 * @returns {string | null}
 */
export function resolveGoKataGoGtpEndpointV0() {
  const raw = String(import.meta.env?.VITE_RHIZOH_KATAGO_GTP_URL || "").trim();
  return raw || null;
}

export function isGoKataGoGtpConfiguredV0() {
  return Boolean(resolveGoKataGoGtpEndpointV0());
}

export function getGoKataGoEngineStatusV0() {
  if (!isGoKataGoGtpConfiguredV0()) return "not_configured";
  if (initFailedV0) return "katago_offline";
  if (wsV0 && readyV0) return "katago_gtp";
  if (wsV0 && handshakeOkV0) return "katago_initializing";
  if (connectPromiseV0) return "katago_connecting";
  return "not_started";
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} [boardSize]
 */
export function xyToGoGtpCoordV0(x, y, boardSize = 19) {
  const col = x < 8 ? String.fromCharCode(97 + x) : String.fromCharCode(98 + x);
  const row = boardSize - y;
  return `${col}${row}`;
}

/**
 * @param {string} line
 */
export function parseKataGoGtpAnalyzeLineV0(line) {
  const text = String(line || "");
  const jsonStart = text.indexOf("{");
  if (jsonStart < 0) return null;
  try {
    const payload = JSON.parse(text.slice(jsonStart));
    return Object.freeze({
      winrate: Number.isFinite(payload.winrate) ? Number(payload.winrate) : null,
      visits: Number.isFinite(payload.visits) ? Number(payload.visits) : 0,
      pv: Array.isArray(payload.pv) ? payload.pv.join(" ") : String(payload.move || ""),
      bestMove: payload.move ? String(payload.move) : null,
      line: text
    });
  } catch {
    return null;
  }
}

/**
 * @param {{ winrate?: number | null, visits?: number }} [analysis]
 */
export function resolveKataGoConfidenceFromAnalysisV0(analysis) {
  if (analysis?.winrate == null) return null;
  const winrate = Number(analysis.winrate);
  if (!Number.isFinite(winrate)) return null;
  return Math.max(0, Math.min(1, winrate));
}

function publishKataGoStatusV0() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(GO_KATAGO_GTP_STATUS_EVENT_V0, {
      detail: Object.freeze({
        schema: GO_KATAGO_GTP_BRIDGE_SCHEMA_V0,
        status: getGoKataGoEngineStatusV0(),
        configured: isGoKataGoGtpConfiguredV0(),
        endpoint: resolveGoKataGoGtpEndpointV0(),
        atMs: Date.now()
      })
    })
  );
}

function deliverGtpCommandV0(command) {
  if (!wsV0 || wsV0.readyState !== WebSocket.OPEN) return;
  wsV0.send(`${String(command).trim()}\n\n`);
}

function failConnectV0(error) {
  initFailedV0 = true;
  initErrorV0 = error instanceof Error ? error.message : String(error || "katago_connect_failed");
  connectPromiseV0 = null;
  publishKataGoStatusV0();
}

function handleKataGoLineV0(line) {
  const text = String(line || "").trim();
  if (!text) return;

  if (text.startsWith("=")) {
    if (!handshakeOkV0) {
      handshakeOkV0 = true;
      deliverGtpCommandV0("boardsize 19");
      deliverGtpCommandV0("clear_board");
      readyV0 = true;
      publishKataGoStatusV0();
    }
    return;
  }

  if (text.startsWith("?")) {
    if (activeAnalysisV0) {
      clearTimeout(activeAnalysisV0.timer);
      activeAnalysisV0.resolve(null);
      activeAnalysisV0 = null;
    }
    return;
  }

  const info = parseKataGoGtpAnalyzeLineV0(text);
  if (!info || !activeAnalysisV0) return;

  lastAnalysisInfoV0 = {
    winrate: info.winrate,
    visits: info.visits,
    pv: info.pv,
    bestMove: info.bestMove || lastAnalysisInfoV0.bestMove
  };

  if (info.visits > 0) {
    clearTimeout(activeAnalysisV0.timer);
    const resolve = activeAnalysisV0.resolve;
    activeAnalysisV0 = null;
    resolve(
      Object.freeze({
        schema: `${GO_KATAGO_GTP_BRIDGE_SCHEMA_V0}.analysis`,
        winrate: lastAnalysisInfoV0.winrate,
        visits: lastAnalysisInfoV0.visits,
        pv: lastAnalysisInfoV0.pv,
        bestMove: lastAnalysisInfoV0.bestMove,
        confidence: resolveKataGoConfidenceFromAnalysisV0(lastAnalysisInfoV0),
        backend: "katago_gtp",
        atMs: Date.now()
      })
    );
  }
}

function connectGoKataGoGtpBridgeV0() {
  if (readyV0) return Promise.resolve();
  if (connectPromiseV0) return connectPromiseV0;

  const endpoint = resolveGoKataGoGtpEndpointV0();
  if (!endpoint) {
    return Promise.reject(new Error("katago_not_configured"));
  }

  connectPromiseV0 = new Promise((resolve, reject) => {
    const readyTimer = setTimeout(() => {
      failConnectV0(new Error("katago_ready_timeout"));
      reject(new Error("katago_ready_timeout"));
    }, KATAGO_GTP_READY_TIMEOUT_MS_V0);

    wsV0 = new WebSocket(endpoint);
    let bufferV0 = "";

    wsV0.onopen = () => {
      initFailedV0 = false;
      initErrorV0 = null;
      deliverGtpCommandV0("name");
      publishKataGoStatusV0();
    };

    wsV0.onmessage = (ev) => {
      bufferV0 += String(ev.data || "");
      const parts = bufferV0.split("\n");
      bufferV0 = parts.pop() || "";
      for (const line of parts) {
        handleKataGoLineV0(line);
      }
      if (readyV0) {
        clearTimeout(readyTimer);
        resolve();
      }
    };

    wsV0.onerror = () => {
      clearTimeout(readyTimer);
      failConnectV0(new Error("katago_ws_error"));
      reject(new Error("katago_ws_error"));
    };

    wsV0.onclose = () => {
      readyV0 = false;
      handshakeOkV0 = false;
      connectPromiseV0 = null;
      publishKataGoStatusV0();
    };
  });

  return connectPromiseV0;
}

/**
 * @param {{ stones?: ReadonlyArray<{ x: number, y: number, color: 'B'|'W' }>, boardSize?: number, activeColor?: 'B'|'W' }} board
 * @param {{ visits?: number }} [opts]
 */
export async function analyzeGoPositionKataGoV0(board, opts = {}) {
  if (!isGoKataGoGtpConfiguredV0()) return null;
  const stones = Array.isArray(board?.stones) ? board.stones : [];
  const boardSize = Number(board?.boardSize) || 19;
  const activeColor = board?.activeColor === "W" ? "W" : "B";

  try {
    await connectGoKataGoGtpBridgeV0();
  } catch {
    return null;
  }
  if (!readyV0) return null;

  deliverGtpCommandV0("clear_board");
  for (const stone of stones) {
    deliverGtpCommandV0(`play ${stone.color} ${xyToGoGtpCoordV0(stone.x, stone.y, boardSize)}`);
  }

  const visits = Math.max(10, Number(opts.visits) || 80);

  return new Promise((resolve) => {
    if (activeAnalysisV0) {
      clearTimeout(activeAnalysisV0.timer);
      activeAnalysisV0.resolve(null);
    }

    const timer = setTimeout(() => {
      activeAnalysisV0 = null;
      resolve(
        Object.freeze({
          schema: `${GO_KATAGO_GTP_BRIDGE_SCHEMA_V0}.analysis`,
          winrate: lastAnalysisInfoV0.winrate,
          visits: lastAnalysisInfoV0.visits,
          pv: lastAnalysisInfoV0.pv,
          bestMove: lastAnalysisInfoV0.bestMove,
          confidence: resolveKataGoConfidenceFromAnalysisV0(lastAnalysisInfoV0),
          timedOut: true,
          backend: "katago_gtp",
          atMs: Date.now()
        })
      );
    }, KATAGO_ANALYSIS_TIMEOUT_MS_V0);

    activeAnalysisV0 = { resolve, timer };
    lastAnalysisInfoV0 = { winrate: null, visits: 0, pv: "", bestMove: null };
    deliverGtpCommandV0(`kata-genmove_analyze ${activeColor} ${visits}`);
  });
}

export function prewarmGoKataGoEngineV0() {
  if (!isGoKataGoGtpConfiguredV0()) {
    return Promise.resolve(getGoKataGoEngineStatusV0());
  }
  return connectGoKataGoGtpBridgeV0()
    .then(() => getGoKataGoEngineStatusV0())
    .catch(() => getGoKataGoEngineStatusV0());
}

export function getGoKataGoBridgeSnapshotV0() {
  return Object.freeze({
    schema: GO_KATAGO_GTP_BRIDGE_SCHEMA_V0,
    status: getGoKataGoEngineStatusV0(),
    configured: isGoKataGoGtpConfiguredV0(),
    endpoint: resolveGoKataGoGtpEndpointV0(),
    ready: readyV0,
    initFailed: initFailedV0,
    initError: initErrorV0,
    lastAnalysis: Object.freeze({ ...lastAnalysisInfoV0 }),
    atMs: Date.now(),
    interpretationOnly: true,
    nonExecutive: true
  });
}

export function ensureGoKataGoGtpBridgeDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.goKataGoGtpBridge = () => getGoKataGoBridgeSnapshotV0();
  window.__rhizoh.analyzeGoPositionKataGo = (board, opts) => analyzeGoPositionKataGoV0(board, opts);
  return window.__rhizoh.goKataGoGtpBridge;
}

/** @internal vitest */
export function __resetGoKataGoGtpBridgeForTestV0() {
  if (activeAnalysisV0) {
    clearTimeout(activeAnalysisV0.timer);
    activeAnalysisV0 = null;
  }
  try {
    wsV0?.close();
  } catch {
    /* noop */
  }
  wsV0 = null;
  connectPromiseV0 = null;
  handshakeOkV0 = false;
  readyV0 = false;
  initFailedV0 = false;
  initErrorV0 = null;
  lastAnalysisInfoV0 = { winrate: null, visits: 0, pv: "", bestMove: null };
}
