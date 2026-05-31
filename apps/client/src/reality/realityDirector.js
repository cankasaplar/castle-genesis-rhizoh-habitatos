/**
 * Single entry for reality mode changes: prepare → commit → notify → post.
 * Avoids desync (UI REAL_MAP + engine still GLOBE) and split dispatch/transition contracts.
 *
 * Gateway anlık görüntüsü (getGatewaySnapshot) aynı commit'te işlenir; Cesium yüzeyi
 * uiStore.mapSurfaceActive ile RealityDirector'tan yansır.
 */

import { emitRealityTransition, subscribeRealityTransition } from "./realityEventBus.js";
import { computeMapSurfaceActive } from "./realityEngineSurface.js";
import { flushL9ExecutionHoldQueue } from "../kernel/castleL9EventBusV2.js";
import "./realityNerveListeners.js";

const VALID_MODES = new Set(["GLOBE", "REAL_MAP"]);

/**
 * @type {{
 *   getEngine: () => unknown,
 *   getCoreWorld: () => unknown,
 *   dispatch: (a: unknown) => void,
 *   getState: () => { realityMode: string, mapSurfaceActive?: boolean },
 *   getGatewaySnapshot?: () => { phase?: string }
 * } | null}
 */
let infra = null;

/** Cesium camera.flyTo eşzamanlılığı — depth + __CASTLE_CESIUM__.isFlying */
let cesiumFlightDepth = 0;

/** REAL_MAP + mapSurfaceActive iken Cesium uçuşundayken ertelenen Apex kamera işleri (merge-last: en fazla bir bekleyen) */
const apexCameraDeferred = [];

function drainApexCameraDeferredQueue() {
  if (!apexCameraDeferred.length) return;
  if (!infra?.getState) {
    apexCameraDeferred.length = 0;
    return;
  }
  const st = infra.getState();
  if (st.realityMode !== "REAL_MAP" || !st.mapSurfaceActive) {
    apexCameraDeferred.length = 0;
    return;
  }
  const batch = apexCameraDeferred.splice(0);
  for (const fn of batch) {
    try {
      fn();
    } catch (e) {
      console.error("[CASTLE_APEX_CAMERA_DEFERRED]", e);
    }
  }
}

/**
 * Cesium flyTo başında çağrılır (CesiumRealMapLayer).
 */
export function notifyCesiumFlightStart() {
  cesiumFlightDepth++;
  try {
    if (typeof window !== "undefined" && window.__CASTLE_CESIUM__) {
      window.__CASTLE_CESIUM__.isFlying = true;
    }
  } catch {
    /* noop */
  }
}

/**
 * Cesium flyTo complete — depth 0 olunca Apex kuyruğu boşalır.
 */
export function notifyCesiumFlightEnd() {
  cesiumFlightDepth = Math.max(0, cesiumFlightDepth - 1);
  try {
    if (typeof window !== "undefined" && window.__CASTLE_CESIUM__) {
      window.__CASTLE_CESIUM__.isFlying = cesiumFlightDepth > 0;
    }
  } catch {
    /* noop */
  }
  if (cesiumFlightDepth === 0) {
    drainApexCameraDeferredQueue();
  }
}

/**
 * Viewer yok edildiğinde veya HMR — uçuş ve Apex kuyruğu sıfırlanır.
 */
export function resetCesiumApexCameraCoordinator() {
  cesiumFlightDepth = 0;
  apexCameraDeferred.length = 0;
  try {
    if (typeof window !== "undefined" && window.__CASTLE_CESIUM__) {
      window.__CASTLE_CESIUM__.isFlying = false;
    }
  } catch {
    /* noop */
  }
}

/**
 * REAL_MAP + aktif harita yüzeyi + Cesium uçuşu varken Apex otopilotu kuyruğa alır.
 * Meşgulken yeni istek gelirse önceki bekleyenler silinir (merge-last); WARN log yazılır.
 * @param {() => void} action
 * @param {string} [eventName] — log’da gösterilecek hedef adı
 * @returns {{ queued: boolean }}
 */
export function enqueueApexCameraAfterCesiumIfNeeded(action, eventName) {
  if (typeof action !== "function") return { queued: false };
  if (!infra?.getState) {
    try {
      action();
    } catch (e) {
      console.error("[CASTLE_APEX_CAMERA]", e);
    }
    return { queued: false };
  }
  const st = infra.getState();
  const c = typeof window !== "undefined" ? window.__CASTLE_CESIUM__ : null;
  const cesiumBusy = !!(c && c.isFlying);
  if (st.realityMode === "REAL_MAP" && st.mapSurfaceActive && cesiumBusy) {
    if (apexCameraDeferred.length > 0) {
      apexCameraDeferred.length = 0;
      try {
        infra.dispatch?.({
          type: "ADD_LOG",
          payload: {
            ts: new Date().toLocaleTimeString(),
            type: "WARN",
            data: `CAMERA: Hızlı geçiş. Önceki odak iptal edildi, en yeni hedefe (${String(eventName || "bilinmiyor")}) kilitleniliyor.`
          }
        });
      } catch {
        /* noop */
      }
    }
    apexCameraDeferred.push(action);
    return { queued: true };
  }
  try {
    action();
  } catch (e) {
    console.error("[CASTLE_APEX_CAMERA]", e);
  }
  return { queued: false };
}

/** @type {Array<{ mode: string, opts: object, resolve: (v: unknown) => void, reject: (e: unknown) => void }>} */
const intentQueue = [];

let gate = Promise.resolve();

function withGate(fn) {
  const run = gate.then(fn, fn);
  gate = run.catch(() => {});
  return run;
}

export function configureRealityDirector(nextInfra) {
  infra = nextInfra;
}

function readGatewayPhase() {
  const snap = infra?.getGatewaySnapshot?.();
  const p = snap?.phase;
  return typeof p === "string" && p.length ? p : "unconfigured";
}

/**
 * realityMode değişmeden gateway fazı değişince Cesium yüzeyini yeniden hesaplar.
 */
export function reconcileMapSurfaceFromGateway() {
  if (!infra?.dispatch || !infra.getState) return;
  const mode = infra.getState().realityMode;
  const gatewayPhase = readGatewayPhase();
  const mapSurfaceActive = computeMapSurfaceActive(mode, gatewayPhase);
  const prev = infra.getState().mapSurfaceActive;
  if (prev === mapSurfaceActive) return;
  infra.dispatch({
    type: "REALITY_ENGINE_SYNC",
    payload: {
      mapSurfaceActive,
      gatewayPhase,
      reason: "gateway_phase_changed"
    }
  });
  if (mapSurfaceActive && !prev) {
    try {
      flushL9ExecutionHoldQueue();
    } catch {
      /* noop */
    }
  }
}

export { subscribeRealityTransition };

/**
 * Call after ApexEngine is constructed so queued intents can drain.
 */
export function notifyRealityEngineReady() {
  void (async () => {
    while (intentQueue.length && infra?.getEngine?.()) {
      const item = intentQueue.shift();
      try {
        const r = await withGate(() => runTransition(item.mode, item.opts));
        item.resolve(r);
      } catch (e) {
        item.reject(e);
      }
    }
    try {
      flushL9ExecutionHoldQueue();
    } catch {
      /* noop */
    }
  })();
}

function assertInfra() {
  if (!infra?.getEngine || !infra.getCoreWorld || !infra.dispatch || !infra.getState) {
    throw new Error("RealityDirector: configureRealityDirector() not called");
  }
}

async function runTransition(mode, opts) {
  assertInfra();
  const t0 = performance.now();
  const { source = "APP" } = opts || {};
  const getState = infra.getState;
  const durationMs = () => Math.round(performance.now() - t0);

  if (!VALID_MODES.has(mode)) {
    emitRealityTransition({
      from: getState().realityMode,
      to: mode,
      source,
      durationMs: durationMs(),
      success: false,
      reason: "INVALID_MODE"
    });
    return { ok: false, reason: "INVALID_MODE", mode };
  }

  const engine = infra.getEngine();
  const prev = getState().realityMode;

  if (!engine) {
    emitRealityTransition({
      from: prev,
      to: mode,
      source,
      durationMs: durationMs(),
      success: false,
      reason: "NO_ENGINE"
    });
    return { ok: false, reason: "NO_ENGINE", mode: prev };
  }

  if (prev === mode && engine.internalRealityMode === mode) {
    const gatewayPhase = readGatewayPhase();
    const mapSurfaceActive = computeMapSurfaceActive(mode, gatewayPhase);
    const st = getState();
    if (st.mapSurfaceActive !== mapSurfaceActive) {
      infra.dispatch({
        type: "REALITY_ENGINE_SYNC",
        payload: {
          mapSurfaceActive,
          gatewayPhase,
          reason: "same_mode_gateway_resync"
        }
      });
    }
    return { ok: true, mode, skipped: true };
  }

  try {
    await engine.prepareReality(mode);
  } catch (err) {
    try {
      engine.rollbackPartialRealMapPrepare?.();
    } catch {
      /* noop */
    }
    emitRealityTransition({
      from: prev,
      to: mode,
      source,
      durationMs: durationMs(),
      success: false,
      error: err,
      reason: "PREPARE_FAILED"
    });
    return { ok: false, reason: "PREPARE_FAILED", error: err, mode: prev };
  }

  infra.getCoreWorld().targetMode = mode;
  engine.commitReality(mode);

  const elapsed = durationMs();
  const gatewayPhase = readGatewayPhase();
  const mapSurfaceActive = computeMapSurfaceActive(mode, gatewayPhase);

  infra.dispatch({
    type: "REALITY_CHANGED",
    payload: {
      from: prev,
      to: mode,
      source,
      durationMs: elapsed,
      success: true,
      gatewayPhase,
      mapSurfaceActive
    }
  });

  try {
    flushL9ExecutionHoldQueue();
  } catch {
    /* noop */
  }

  emitRealityTransition({
    from: prev,
    to: mode,
    source,
    durationMs: elapsed,
    success: true,
    gatewayPhase,
    mapSurfaceActive
  });

  const ts = new Date().toLocaleTimeString();
  infra.dispatch({
    type: "ADD_LOG",
    payload: {
      ts,
      type: "SYS",
      data: `REALITY · ${prev} → ${mode} · ${source} · ${elapsed}ms`
    }
  });

  return { ok: true, mode, prevMode: prev, durationMs: elapsed };
}

/**
 * @param {"GLOBE" | "REAL_MAP"} mode
 * @param {{ source?: string }} [opts]
 */
export async function setRealityMode(mode, opts = {}) {
  if (!infra?.getEngine) {
    return new Promise((resolve, reject) => {
      intentQueue.push({ mode, opts, resolve, reject });
    });
  }

  if (!infra.getEngine()) {
    return new Promise((resolve, reject) => {
      intentQueue.push({ mode, opts, resolve, reject });
    });
  }

  return withGate(() => runTransition(mode, opts));
}

/** Namespace alias for call sites that prefer `RealityDirector.setMode(...)` */
export function getRealityDirectorStateV0() {
  if (!infra?.getState) return { realityMode: "REAL_MAP", mapSurfaceActive: false };
  return infra.getState();
}

export const RealityDirector = {
  configure: configureRealityDirector,
  notifyEngineReady: notifyRealityEngineReady,
  setMode: setRealityMode,
  getState: getRealityDirectorStateV0,
  subscribe: subscribeRealityTransition,
  enqueueApexCameraAfterCesiumIfNeeded,
  resetCesiumApexCameraCoordinator
};
