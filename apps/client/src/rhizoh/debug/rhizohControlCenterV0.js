/**
 * CASTLE_DEBUG_LAYER_V1 — Rhizoh Control Center (observer / staging).
 * Opt-in only: ?castle_debug=1 or localStorage castle.debug.layer.v1=1
 * @see docs/RHIZOH_OBSERVABLE_REALITY_LAYER_V0.1.md
 */

import {
  getRhizohChromePanelsSnapshotV0,
  resolveOpenProductSurfaceDrawerIdV0,
  RHIZOH_CHROME_PANEL_CHANGE_EVENT_V0,
  subscribeRhizohChromePanelsV0
} from "../runtime/rhizohProductChromePanelsV0.js";
import {
  listProductBindingEventsV0,
  RHIZOH_PRODUCT_BINDING_EVENT_V0
} from "../runtime/rhizohProductBindingV0.js";
import { readProductionLiveMonitorV0 } from "../runtime/rhizohProductionDeploymentRunbookV0.js";
import { getCastleWorldDataStateV0 } from "../../castleFlight/castleWorldDataProviderV0.js";

export const CASTLE_DEBUG_LAYER_SCHEMA_V1 = "castle.debug.layer.v1";
export const CASTLE_DEBUG_LAYER_STORAGE_KEY_V1 = "castle.debug.layer.v1";

const BINDING_RING_MAX = 24;
/** @type {object[]} */
const bindingRing = [];
/** @type {Set<() => void>} */
const listeners = new Set();
/** @type {object | null} */
let cachedSnapshotV0 = null;
/** @type {string} */
let cachedSnapshotKeyV0 = "";

function notify() {
  cachedSnapshotV0 = null;
  cachedSnapshotKeyV0 = "";
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      /* noop */
    }
  }
}

/**
 * @returns {boolean}
 */
export function isRhizohControlCenterEnabledV0() {
  if (typeof window === "undefined") return false;
  if (import.meta.env?.DEV) {
    try {
      return localStorage.getItem(CASTLE_DEBUG_LAYER_STORAGE_KEY_V1) !== "0";
    } catch {
      return true;
    }
  }
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get("castle_debug") === "1" || q.get("castle_debug") === "true") return true;
    return localStorage.getItem(CASTLE_DEBUG_LAYER_STORAGE_KEY_V1) === "1";
  } catch {
    return false;
  }
}

export function enableRhizohControlCenterV0() {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(CASTLE_DEBUG_LAYER_STORAGE_KEY_V1, "1");
  }
  installRhizohControlCenterV0();
}

export function disableRhizohControlCenterV0() {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(CASTLE_DEBUG_LAYER_STORAGE_KEY_V1, "0");
  }
  if (typeof window !== "undefined") {
    window.__CASTLE_DEBUG_LAYER_V1 = Object.freeze({ enabled: false });
  }
}

/**
 * @param {() => void} fn
 */
export function subscribeRhizohControlCenterV0(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function pushBindingEvent(detail) {
  if (!detail) return;
  bindingRing.push(detail);
  while (bindingRing.length > BINDING_RING_MAX) bindingRing.shift();
  notify();
}

function readDomProbesV0() {
  if (typeof document === "undefined") {
    return Object.freeze({ drawer: null, reality: null, detailDrawer: false });
  }
  const drawerEl = document.querySelector("[data-rhizoh-product-drawer]");
  const realityEl = document.querySelector("[data-rhizoh-observable-reality]");
  return Object.freeze({
    drawer: drawerEl?.getAttribute("data-rhizoh-product-drawer") || null,
    reality: realityEl?.getAttribute("data-rhizoh-observable-reality") || null,
    detailDrawer: Boolean(document.getElementById("rhizoh-detail-drawer")),
    ariaLabel: document.querySelector('[role="dialog"]')?.getAttribute("aria-label") || null
  });
}

/**
 * Stable cache key — must not include Date.now() (breaks useSyncExternalStore / setState loops).
 * @returns {string}
 */
function controlCenterSnapshotKeyV0() {
  const rh = typeof window !== "undefined" ? window.__rhizoh || {} : {};
  const panels = getRhizohChromePanelsSnapshotV0();
  const openDrawerId = resolveOpenProductSurfaceDrawerIdV0();
  const dom = readDomProbesV0();
  const tail = bindingRing.slice(-12);
  const last = tail[tail.length - 1];
  const wd = getCastleWorldDataStateV0();
  let tickSeq = "";
  let rhythmOk = "";
  try {
    const m = readProductionLiveMonitorV0() || rh.liveMonitor;
    tickSeq = String(m?.scr?.tick_seq ?? "");
    rhythmOk = String(m?.rhythm?.ok ?? "");
  } catch {
    /* noop */
  }
  return [
    typeof window !== "undefined" ? window.location.pathname : "",
    openDrawerId,
    JSON.stringify(panels),
    dom.drawer,
    dom.reality,
    dom.detailDrawer ? "1" : "0",
    String(rh.productBinding?.count ?? bindingRing.length),
    last?.atMs,
    last?.action,
    tail.length,
    tickSeq,
    rhythmOk,
    rh.gatewayPhase,
    rh.replayMode ? "1" : "0",
    String(rh.worldActionLog?.count ?? ""),
    wd.provider,
    String(wd.poiCount),
    String(wd.buildingCount),
    wd.lastError
  ].join("|");
}

/**
 * @returns {object}
 */
export function snapshotRhizohControlCenterV0() {
  const key = controlCenterSnapshotKeyV0();
  if (key === cachedSnapshotKeyV0 && cachedSnapshotV0) {
    return cachedSnapshotV0;
  }

  const rh = typeof window !== "undefined" ? window.__rhizoh || {} : {};
  let monitor = null;
  try {
    monitor = readProductionLiveMonitorV0();
  } catch {
    monitor = rh.liveMonitor || null;
  }
  const panels = getRhizohChromePanelsSnapshotV0();
  const openDrawerId = resolveOpenProductSurfaceDrawerIdV0();
  const dom = readDomProbesV0();
  const tail = Object.freeze(bindingRing.slice(-12));

  cachedSnapshotKeyV0 = key;
  cachedSnapshotV0 = Object.freeze({
    schema: CASTLE_DEBUG_LAYER_SCHEMA_V1,
    atMs: Date.now(),
    pathname: typeof window !== "undefined" ? window.location.pathname : "",
    uiChrome: Object.freeze({
      panels,
      openDrawerId,
      drawerDomHint: openDrawerId ? `[data-rhizoh-product-drawer="${openDrawerId}"]` : null
    }),
    dom,
    productBinding: Object.freeze({
      count: rh.productBinding?.count ?? bindingRing.length,
      last: rh.productBinding?.last || bindingRing[bindingRing.length - 1] || null,
      tail
    }),
    liveMonitor: monitor
      ? Object.freeze({
          rhythmOk: monitor.rhythm?.ok,
          tickSeq: monitor.scr?.tick_seq,
          driftClass: monitor.identity?.drift_class,
          anomalies: (monitor.anomalies || []).length
        })
      : null,
    gatewayPhase: rh.gatewayPhase || null,
    replayMode: rh.replayMode === true,
    walCount: rh.worldActionLog?.count ?? null,
    worldData: getCastleWorldDataStateV0()
  });
  return cachedSnapshotV0;
}

let installed = false;
/** @type {(() => void) | null} */
let unsubChrome = null;

export function installRhizohControlCenterV0() {
  if (typeof window === "undefined" || installed) return;
  installed = true;

  const onBinding = (ev) => pushBindingEvent(ev.detail);
  const onChrome = () => notify();

  window.addEventListener(RHIZOH_PRODUCT_BINDING_EVENT_V0, onBinding);
  unsubChrome = subscribeRhizohChromePanelsV0(onChrome);

  window.__CASTLE_DEBUG_LAYER_V1 = Object.freeze({
    schema: CASTLE_DEBUG_LAYER_SCHEMA_V1,
    enabled: isRhizohControlCenterEnabledV0(),
    snapshot: snapshotRhizohControlCenterV0,
    enable: enableRhizohControlCenterV0,
    disable: disableRhizohControlCenterV0,
    bindingTail: () => Object.freeze(bindingRing.slice())
  });

  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.controlCenter = window.__CASTLE_DEBUG_LAYER_V1;
}

export function uninstallRhizohControlCenterV0() {
  installed = false;
  unsubChrome?.();
  unsubChrome = null;
}
