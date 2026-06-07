/**
 * Spatial Ready Gate — WORLD domain cannot emit spatial ops until Cesium command-ready.
 * Tensor → Control Plane → Spatial Gate → Cesium executor.
 */

import { isCesiumExecutorCommandReadyV0 } from "../../castleFlight/cesiumCommandExecutorV0.js";
import { RHIZOH_DOMAIN_ID_V0 } from "./rhizohDomainCoreStoreV0.js";
import { traceFallbackV0 } from "./rhizohTruthTraceLayerV0.js";

export const RHIZOH_SPATIAL_READY_GATE_SCHEMA_V0 = "rhizoh.spatial_ready_gate.v0";
export const RHIZOH_SPATIAL_READY_GATE_EVENT_V0 = "rhizoh:spatial-ready-gate-v0";
export const CASTLE_CESIUM_COMMAND_READY_EVENT_V0 = "castle:cesium-command-ready-v0";

/** Domains that require Cesium command-ready before spatial registry mutation. */
const GATED_DOMAINS = new Set([RHIZOH_DOMAIN_ID_V0.WORLD]);
const MAX_BUFFER = 48;

/** @type {{ domain: string, event: object, enqueuedAtMs: number }[]} */
let preReadyBuffer = [];
/** @type {number | null} */
let lastDrainAtMs = null;
let forceOpenForTest = false;

/**
 * @returns {boolean}
 */
export function isCesiumViewerSpatialReadyV0() {
  const api = typeof window !== "undefined" ? window.__CASTLE_CESIUM__ : null;
  return isCesiumExecutorCommandReadyV0(api);
}

/**
 * @returns {boolean}
 */
export function isSpatialReadyGateOpenV0() {
  if (forceOpenForTest) return true;
  return isCesiumViewerSpatialReadyV0();
}

/**
 * @param {string} domainId
 * @returns {boolean}
 */
export function shouldSpatialReadyGateDomainV0(domainId) {
  return GATED_DOMAINS.has(String(domainId || "").trim());
}

/**
 * Probe pins bypass gate (full-system probe / audit harness).
 * @param {string} nodeId
 */
export function isSpatialReadyProbeNodeV0(nodeId) {
  const id = String(nodeId || "");
  return id.startsWith("probe-") || id.startsWith("probe_");
}

/**
 * @param {string} domain
 * @param {object} event
 */
export function enqueuePreReadySpatialEventV0(domain, event) {
  if (preReadyBuffer.length >= MAX_BUFFER) preReadyBuffer.shift();
  preReadyBuffer.push({
    domain: String(domain || "").trim(),
    event: { ...event },
    enqueuedAtMs: Date.now()
  });
  return preReadyBuffer.length;
}

/**
 * @param {(domain: string, event: object) => unknown} emitImmediate
 * @returns {number}
 */
export function drainPreReadySpatialQueueV0(emitImmediate) {
  if (!isSpatialReadyGateOpenV0() || typeof emitImmediate !== "function") return 0;
  const pending = preReadyBuffer.splice(0);
  if (pending.length === 0) return 0;
  for (const item of pending) {
    emitImmediate(item.domain, {
      ...item.event,
      trigger: item.event?.trigger || "spatial_ready_drain"
    });
  }
  lastDrainAtMs = Date.now();
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(RHIZOH_SPATIAL_READY_GATE_EVENT_V0, {
        detail: getSpatialReadyGateSnapshotV0()
      })
    );
  }
  return pending.length;
}

/**
 * @param {(domain: string, event: object) => unknown} emitImmediate
 */
export function noteCesiumSpatialReadyV0(emitImmediate) {
  return drainPreReadySpatialQueueV0(emitImmediate);
}

export function getSpatialReadyGateSnapshotV0() {
  return Object.freeze({
    schema: RHIZOH_SPATIAL_READY_GATE_SCHEMA_V0,
    open: isSpatialReadyGateOpenV0(),
    cesiumReady: isCesiumViewerSpatialReadyV0(),
    buffered: preReadyBuffer.length,
    lastDrainAtMs,
    gatedDomains: Object.freeze([...GATED_DOMAINS]),
    atMs: Date.now()
  });
}

/**
 * Wire Cesium command-ready → drain pre-ready spatial buffer.
 * @param {(domain: string, event: object) => unknown} emitImmediate
 * @returns {() => void}
 */
export function installSpatialReadyGateWireV0(emitImmediate) {
  if (typeof window === "undefined") return () => {};
  const onReady = () => {
    noteCesiumSpatialReadyV0(emitImmediate);
  };
  window.addEventListener(CASTLE_CESIUM_COMMAND_READY_EVENT_V0, onReady);
  let polls = 0;
  const pollId = window.setInterval(() => {
    if (isSpatialReadyGateOpenV0()) {
      window.clearInterval(pollId);
      onReady();
      return;
    }
    polls += 1;
    if (polls >= 120) window.clearInterval(pollId);
  }, 500);
  return () => {
    window.removeEventListener(CASTLE_CESIUM_COMMAND_READY_EVENT_V0, onReady);
    window.clearInterval(pollId);
  };
}

/** @internal vitest */
export function __forceSpatialReadyGateOpenForTestV0(open = true) {
  forceOpenForTest = open === true;
}

/** @internal vitest */
export function __resetSpatialReadyGateForTestV0() {
  preReadyBuffer = [];
  lastDrainAtMs = null;
  forceOpenForTest = false;
}
