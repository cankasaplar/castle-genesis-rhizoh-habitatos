/**
 * Cesium command executor — sole spatial camera mutation sink.
 * @see docs/CESIUM_EXECUTOR_SPEC_V1.md
 */

export const CESIUM_EXECUTOR_REQUEST_SCHEMA_V0 = "castle.cesium_executor.request.v0";
export const CESIUM_EXECUTOR_RESULT_SCHEMA_V0 = "castle.cesium_executor.result.v0";

export const CESIUM_ZOOM_IN_FACTOR_V0 = 0.72;
export const CESIUM_ZOOM_OUT_FACTOR_V0 = 1.38;
export const CESIUM_ZOOM_MIN_HEIGHT_V0 = 120;
export const CESIUM_ZOOM_MAX_HEIGHT_V0 = 18_500_000;

const RESULT_RING_MAX_V0 = 32;

const SPATIAL_OPS_V0 = new Set([
  "zoom_in",
  "zoom_out",
  "fly_to",
  "focus_castle",
  "focus_poi",
  "calibration_root",
  "topology_globe",
  "bootstrap_viewport",
  "street_view"
]);

/** @type {null | Record<string, unknown>} */
let layerApi = null;

/**
 * Guarantees `window.__CASTLE_CESIUM__` exists (Object.assign on `|| {}` was dropping the API).
 * @returns {Record<string, unknown> | null}
 */
export function ensureCastleCesiumApiV0() {
  if (typeof window === "undefined") return null;
  if (!window.__CASTLE_CESIUM__ || typeof window.__CASTLE_CESIUM__ !== "object") {
    window.__CASTLE_CESIUM__ = {};
  }
  return window.__CASTLE_CESIUM__;
}

/** @type {object | null} */
let pendingRequest = null;

/** @type {object[]} */
let resultRing = [];

/**
 * Executor accepts commands only when layout + camera surface are registered.
 * `ready` on __CASTLE_CESIUM__ may mean viewer exists; `commandReady` is the gate.
 * @param {Record<string, unknown> | null | undefined} [api]
 * @returns {boolean}
 */
export function isCesiumExecutorCommandReadyV0(api = layerApi) {
  if (!api || typeof api !== "object") return false;
  if (api.commandReady === true) return true;
  if (api.ready === true && api.commandReady !== false) return true;
  return false;
}

/**
 * @param {Record<string, unknown>} api
 */
export function registerCesiumExecutorApiV0(api) {
  const resolved =
    api && typeof api === "object" ? api : ensureCastleCesiumApiV0();
  layerApi = resolved;
  if (isCesiumExecutorCommandReadyV0(layerApi)) {
    drainCesiumExecutorPendingV0();
  }
}

export function clearCesiumExecutorApiV0() {
  layerApi = null;
  pendingRequest = null;
}

/** @internal vitest */
export function getCesiumExecutorApiV0() {
  return layerApi;
}

/** @internal vitest */
export function __resetCesiumExecutorForTestV0() {
  layerApi = null;
  pendingRequest = null;
  resultRing = [];
  if (typeof window !== "undefined") {
    try {
      delete window.__CASTLE_CESIUM_EXECUTOR__;
    } catch {
      /* noop */
    }
  }
}

function publishExecutorResultV0(result) {
  resultRing = [...resultRing, result].slice(-RESULT_RING_MAX_V0);
  if (typeof window !== "undefined") {
    window.__CASTLE_CESIUM_EXECUTOR__ = Object.freeze({
      schema: CESIUM_EXECUTOR_RESULT_SCHEMA_V0,
      last: result,
      ring: Object.freeze([...resultRing])
    });
  }
}

function buildResultV0(op, partial = {}) {
  return Object.freeze({
    schema: CESIUM_EXECUTOR_RESULT_SCHEMA_V0,
    ok: partial.ok === true,
    op: String(op || ""),
    skipped: partial.skipped === true,
    skipReason: partial.skipReason ? String(partial.skipReason) : null,
    deferred: partial.deferred === true,
    height: Number.isFinite(partial.height) ? Number(partial.height) : null,
    factor: Number.isFinite(partial.factor) ? Number(partial.factor) : null,
    atMs: Date.now(),
    meta: partial.meta ? Object.freeze({ ...partial.meta }) : null
  });
}

function logCameraMutatedV0(op, request, extra = {}) {
  console.info("[castle:cesium-executor] camera mutated via executor", {
    op,
    source: request.source || "unknown",
    canonical: request.canonical || null,
    ...extra
  });
}

export function drainCesiumExecutorPendingV0() {
  if (!pendingRequest || !isCesiumExecutorCommandReadyV0()) return null;
  const next = pendingRequest;
  pendingRequest = null;
  return executeCesiumCommandV0(next);
}

/**
 * @param {{
 *   schema?: string,
 *   op: string,
 *   source?: string,
 *   canonical?: string,
 *   traceId?: string,
 *   geo?: { lat?: number, lon?: number, alt?: number },
 *   meta?: object
 * }} request
 */
export function executeCesiumCommandV0(request = {}) {
  const op = String(request.op || "").trim();
  if (!op) {
    const result = buildResultV0("", { ok: false, skipped: true, skipReason: "missing_op" });
    publishExecutorResultV0(result);
    return result;
  }

  if (!isCesiumExecutorCommandReadyV0()) {
    pendingRequest = Object.freeze({ ...request, schema: CESIUM_EXECUTOR_REQUEST_SCHEMA_V0 });
    const result = buildResultV0(op, {
      ok: false,
      deferred: true,
      skipReason: "cesium_not_ready",
      meta: Object.freeze({ source: request.source || "unknown" })
    });
    publishExecutorResultV0(result);
    return result;
  }

  if (op === "ensure_ready") {
    const ok = isCesiumExecutorCommandReadyV0();
    const result = buildResultV0(op, {
      ok,
      skipped: !ok,
      skipReason: ok ? null : "cesium_not_ready",
      meta: Object.freeze({ source: request.source || "unknown" })
    });
    publishExecutorResultV0(result);
    return result;
  }

  if (op === "zoom_in" || op === "zoom_out") {
    return executeZoomOpV0(op, request);
  }

  if (SPATIAL_OPS_V0.has(op)) {
    return executeSpatialOpV0(op, request);
  }

  const result = buildResultV0(op, {
    ok: false,
    skipped: true,
    skipReason: "unsupported_op",
    meta: Object.freeze({ source: request.source || "unknown" })
  });
  publishExecutorResultV0(result);
  return result;
}

/**
 * @param {"zoom_in" | "zoom_out"} op
 * @param {object} request
 */
function executeZoomOpV0(op, request) {
  const factor = op === "zoom_in" ? CESIUM_ZOOM_IN_FACTOR_V0 : CESIUM_ZOOM_OUT_FACTOR_V0;
  if (typeof layerApi?.zoomByFactor !== "function") {
    const result = buildResultV0(op, {
      ok: false,
      skipped: true,
      skipReason: "zoom_by_factor_missing"
    });
    publishExecutorResultV0(result);
    return result;
  }

  const zoomOut = layerApi.zoomByFactor(factor);
  const ok = zoomOut?.ok === true;

  if (ok) {
    logCameraMutatedV0(op, request, { factor, height: zoomOut.height ?? null });
  }

  const result = buildResultV0(op, {
    ok,
    skipped: !ok,
    skipReason: ok ? null : String(zoomOut?.reason || "zoom_failed"),
    height: zoomOut?.height,
    factor,
    meta: Object.freeze({
      source: request.source || "unknown",
      canonical: request.canonical || null,
      ingress: request.meta?.ingress || null
    })
  });
  publishExecutorResultV0(result);
  return result;
}

/**
 * @param {string} op
 * @param {object} request
 */
function executeSpatialOpV0(op, request) {
  const api = layerApi;
  const geo = request.geo || {};
  const lat = Number(geo.lat);
  const lon = Number(geo.lon);
  const alt = Number.isFinite(Number(geo.alt)) ? Number(geo.alt) : null;
  const poiKey = String(request.meta?.poiKey || "");

  let ok = false;
  let skipReason = "spatial_op_failed";

  switch (op) {
    case "fly_to":
      if (Number.isFinite(lat) && Number.isFinite(lon) && typeof api.flyToCustom === "function") {
        api.flyToCustom(lat, lon, alt ?? 900);
        ok = true;
      } else {
        skipReason = "invalid_fly_to_geo";
      }
      break;
    case "focus_castle":
      if (typeof api.focusCastle === "function") {
        api.focusCastle();
        ok = true;
      } else {
        skipReason = "focus_castle_missing";
      }
      break;
    case "focus_poi":
      if (poiKey && typeof api.focusPOI === "function") {
        api.focusPOI(poiKey);
        ok = true;
      } else {
        skipReason = "focus_poi_missing";
      }
      break;
    case "calibration_root":
      if (typeof api.flyToIstanbul === "function") {
        api.flyToIstanbul();
        ok = true;
      } else {
        skipReason = "calibration_root_missing";
      }
      break;
    case "topology_globe":
      if (typeof api.flyToTopologyGlobe === "function") {
        api.flyToTopologyGlobe();
        ok = true;
      } else {
        skipReason = "topology_globe_missing";
      }
      break;
    case "bootstrap_viewport":
      if (typeof api.flyToBootstrapViewport === "function") {
        api.flyToBootstrapViewport();
        ok = true;
      } else {
        skipReason = "bootstrap_viewport_missing";
      }
      break;
    case "street_view":
      if (Number.isFinite(lat) && Number.isFinite(lon) && typeof api.streetView === "function") {
        api.streetView(lat, lon, alt ?? 130);
        ok = true;
      } else {
        skipReason = "invalid_street_view_geo";
      }
      break;
    default:
      skipReason = "unsupported_spatial_op";
  }

  if (ok) {
    logCameraMutatedV0(op, request, {
      lat: Number.isFinite(lat) ? lat : null,
      lon: Number.isFinite(lon) ? lon : null,
      alt,
      poiKey: poiKey || null
    });
  }

  const result = buildResultV0(op, {
    ok,
    skipped: !ok,
    skipReason: ok ? null : skipReason,
    meta: Object.freeze({
      source: request.source || "unknown",
      canonical: request.canonical || null,
      ingress: request.meta?.ingress || null,
      poiKey: poiKey || null
    })
  });
  publishExecutorResultV0(result);
  return result;
}
