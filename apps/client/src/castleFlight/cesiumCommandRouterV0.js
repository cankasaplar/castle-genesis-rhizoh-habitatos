/**
 * Cesium command router — single ingress for map spatial ops.
 * fly_to / calibration_root coalesce (500ms latest-wins) to cut log noise and camera churn.
 */

import { executeCesiumCommandV0 } from "./cesiumCommandExecutorV0.js";
import { RHIZOH_MAP_COMMAND_EVENT_V0 } from "../rhizoh/runtime/rhizohLocalCommandHandlersV0.js";
import { gateRhizohSpatialCommandV0 } from "../rhizoh/runtime/rhizohLayerContextV0.js";
import { readRhizohWorldSystemModeV0 } from "../rhizoh/runtime/rhizohWorldSystemModeV0.js";

function resolveSpatialGateContextV0() {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  return Object.freeze({
    pathname,
    worldSystemMode: readRhizohWorldSystemModeV0()
  });
}

const SPATIAL_LAYER_OPS_V0 = new Set([
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

/** World lifecycle intents — gate / studio only, never Cesium camera ops. */
const WORLD_LIFECYCLE_ACTIONS_V0 = new Set([
  "create_castle",
  "exit_castle",
  "freeze",
  "resume_world",
  "world_state",
  "log_spatial",
  "ghosts_show",
  "ghosts_hide"
]);

const FLY_COALESCE_MS = 500;
const COALESCE_OPS = new Set(["fly_to", "calibration_root"]);
const COMMAND_DEDUPE_MS = 650;
const DEFERRED_LOG_DEDUPE_MS = 5000;

/** @type {Map<string, number>} */
const deferredLogAtV0 = new Map();

/** @type {ReturnType<typeof setTimeout> | null} */
let flyCoalesceTimer = null;
/** @type {object | null} */
let flyCoalescePending = null;
let lastImmediateCommandKey = "";
let lastImmediateCommandAt = 0;

let bridgeInstalled = false;

export function getCesiumCommandRouterSnapshotV0() {
  return Object.freeze({
    schema: "castle.cesium_command_router.v0",
    installed: bridgeInstalled,
    flyCoalescePending: Boolean(flyCoalescePending),
    spatialLayerOps: Object.freeze([...SPATIAL_LAYER_OPS_V0, "commit_spatial_node"]),
    atMs: Date.now()
  });
}

function publishCesiumCommandRouterRegistryV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.cesiumRouter = getCesiumCommandRouterSnapshotV0();
}

const ROOM_POI_KEY_BY_ACTION = Object.freeze({
  room_library: "FATIH",
  room_garden: "BESIKTAS",
  room_lab: "KADIKOY"
});

/**
 * @param {object} request
 * @returns {object}
 */
function routeCesiumCommandImmediateV0(request = {}) {
  const op = String(request.op || "").trim();
  const canonical = String(request.canonical || "");
  const key = `${op}:${canonical}:${request.source || ""}`;
  const now = Date.now();
  if ((op === "zoom_in" || op === "zoom_out") && key === lastImmediateCommandKey && now - lastImmediateCommandAt < COMMAND_DEDUPE_MS) {
    return Object.freeze({
      ok: true,
      skipped: true,
      deferred: false,
      op,
      skipReason: "duplicate_command_window",
      deduped: true
    });
  }
  lastImmediateCommandKey = key;
  lastImmediateCommandAt = now;
  const result = executeCesiumCommandV0(request);

  if (typeof console !== "undefined" && console.info) {
    const quietDeferred =
      result.deferred === true &&
      (op === "commit_spatial_node" || result.skipReason === "v11_map_no_cesium_sink");

    if (!quietDeferred) {
      console.info("[castle:cesium-router] routed to cesium_executor", {
        op,
        source: request.source ?? null,
        canonical: request.canonical ?? null
      });
    }

    if (result.deferred) {
      const skipReason = result.skipReason ?? "cesium_not_ready";
      const logKey = `${op}:${skipReason}`;
      const now = Date.now();
      const last = deferredLogAtV0.get(logKey) || 0;
      if (!quietDeferred && now - last >= DEFERRED_LOG_DEDUPE_MS) {
        deferredLogAtV0.set(logKey, now);
        console.warn("[castle:cesium-router] deferred — viewer not ready", {
          op,
          skipReason
        });
      }
    } else if (!quietDeferred) {
      if (result.ok) {
        console.info("[castle:cesium-router] executor ok", {
          op,
          height: result.height ?? null
        });
      } else if (result.skipped) {
        console.info("[castle:cesium-router] executor skipped", {
          op,
          skipReason: result.skipReason ?? null
        });
      }
    }
  }

  return result;
}

/**
 * @param {object} request
 * @returns {object}
 */
export function routeCesiumCommandV0(request = {}) {
  const op = String(request.op || "").trim();

  if (op === "commit_spatial_node") {
    return routeCesiumCommandImmediateV0(request);
  }

  if (SPATIAL_LAYER_OPS_V0.has(op)) {
    const gate = gateRhizohSpatialCommandV0(op, resolveSpatialGateContextV0());
    if (!gate.allowed) {
      const blocked = Object.freeze({
        ok: false,
        op,
        deferred: true,
        skipped: false,
        skipReason: gate.reason || "layer_gate_blocked",
        coalesced: false
      });
      if (typeof console !== "undefined" && console.warn) {
        console.warn("[castle:cesium-router] blocked — layer gate", { op, skipReason: gate.reason });
      }
      return blocked;
    }
  }

  if (COALESCE_OPS.has(op)) {
    flyCoalescePending = { ...request, op };
    if (flyCoalesceTimer) clearTimeout(flyCoalesceTimer);
    flyCoalesceTimer = setTimeout(() => {
      flyCoalesceTimer = null;
      const pending = flyCoalescePending;
      flyCoalescePending = null;
      if (pending) routeCesiumCommandImmediateV0(pending);
    }, FLY_COALESCE_MS);

    return Object.freeze({
      ok: true,
      coalesced: true,
      op,
      pendingMs: FLY_COALESCE_MS
    });
  }

  return routeCesiumCommandImmediateV0(request);
}

function onRhizohMapCommand(ev) {
  const detail = ev?.detail;
  if (!detail || typeof detail !== "object") return;

  const action = String(detail.action || detail.canonical || "").trim();
  const canonical = String(detail.canonical || action).trim();

  if (
    WORLD_LIFECYCLE_ACTIONS_V0.has(action) ||
    WORLD_LIFECYCLE_ACTIONS_V0.has(canonical) ||
    canonical === "castle_create"
  ) {
    return;
  }

  let op = null;
  if (action === "zoom_in" || canonical === "map_zoom_in") op = "zoom_in";
  else if (action === "zoom_out" || canonical === "map_zoom_out") op = "zoom_out";
  else if (action === "fly_to" || canonical === "map_fly_to") op = "fly_to";
  else if (action === "open" || canonical === "map_open") op = "bootstrap_viewport";
  else if (action === "center" || canonical === "map_center") op = "calibration_root";
  else if (action === "enter_castle" || canonical === "castle_enter") op = "focus_castle";
  else if (ROOM_POI_KEY_BY_ACTION[action] || ROOM_POI_KEY_BY_ACTION[canonical]) op = "focus_poi";
  else if (action === "calibration_root" || canonical === "map_calibration_root") {
    op = "calibration_root";
  }

  if (!op) return;

  routeCesiumCommandV0({
    op,
    source: "rhizoh_map_command",
    canonical,
    lat: detail.lat,
    lon: detail.lon,
    lng: detail.lng,
    height: detail.height,
    durationSec: detail.durationSec,
    reason: detail.reason,
    meta: Object.freeze({
      poiKey: detail.poiKey || ROOM_POI_KEY_BY_ACTION[action] || ROOM_POI_KEY_BY_ACTION[canonical] || null
    })
  });

  if (typeof console !== "undefined" && console.info) {
    console.info("[rhizoh:map-command]", {
      canonical,
      action: detail.action ?? null
    });
  }
}

export function installCesiumCommandBridgeV0() {
  if (typeof window === "undefined" || bridgeInstalled) return;
  bridgeInstalled = true;
  window.addEventListener(RHIZOH_MAP_COMMAND_EVENT_V0, onRhizohMapCommand);
  publishCesiumCommandRouterRegistryV0();
}

export function __uninstallCesiumCommandBridgeForTestV0() {
  if (typeof window === "undefined") return;
  window.removeEventListener(RHIZOH_MAP_COMMAND_EVENT_V0, onRhizohMapCommand);
  bridgeInstalled = false;
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.cesiumRouter;
  }
  if (flyCoalesceTimer) {
    clearTimeout(flyCoalesceTimer);
    flyCoalesceTimer = null;
  }
  flyCoalescePending = null;
  lastImmediateCommandKey = "";
  lastImmediateCommandAt = 0;
}

/** @internal test hook — flush pending coalesced fly_to immediately */
export function __flushCesiumFlyCoalesceForTestV0() {
  if (flyCoalesceTimer) {
    clearTimeout(flyCoalesceTimer);
    flyCoalesceTimer = null;
  }
  const pending = flyCoalescePending;
  flyCoalescePending = null;
  if (pending) return routeCesiumCommandImmediateV0(pending);
  return null;
}

/** @internal test hook */
export function __resetCesiumFlyCoalesceForTestV0() {
  if (flyCoalesceTimer) clearTimeout(flyCoalesceTimer);
  flyCoalesceTimer = null;
  flyCoalescePending = null;
}
