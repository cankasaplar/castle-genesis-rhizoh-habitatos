/**
 * World observation bus — local fan-out (UI, throttled) + durable ingress queue sink.
 */

import { shouldEmitWorldObservationToUiV0 } from "./worldObservationDensityV0.js";

export const WORLD_OBSERVATION_SCHEMA_V0 = "castle.world_observation.v0";

const MAX_RING = 36;

/** @type {Set<(row: object) => void>} */
const listeners = new Set();

/** @type {((row: object) => void) | null} */
let ingressSink = null;

/** @type {object[]} */
let ring = [];

function formatDefaultLine(type, payload) {
  const p = payload && typeof payload === "object" ? payload : {};
  if (type === "world.tick") {
    return `world · sim ${Number(p.simTime || 0).toFixed(1)}s · agents ${p.activeCount ?? "—"}`;
  }
  if (type === "agent.spoke") {
    const t = String(p.preview || p.text || "");
    return `rhizoh · ${t.slice(0, 72)}${t.length > 72 ? "…" : ""}`;
  }
  if (type.startsWith("genesis.")) {
    return String(p.line || type.replace("genesis.", ""));
  }
  return String(type);
}

/**
 * @param {{ type: string, payload?: Record<string, unknown>, line?: string }} obs
 */
export function publishWorldObservationV0(obs) {
  const type = String(obs?.type || "unknown").slice(0, 64);
  const payload = obs?.payload && typeof obs.payload === "object" ? { ...obs.payload } : {};
  const row = Object.freeze({
    schema: WORLD_OBSERVATION_SCHEMA_V0,
    type,
    atMs: Date.now(),
    payload: Object.freeze(payload),
    line: obs?.line ? String(obs.line) : formatDefaultLine(type, payload)
  });

  if (ingressSink) {
    try {
      ingressSink(row);
    } catch {
      /* ingress queue — never block UI on transport */
    }
  }

  const uiGate = shouldEmitWorldObservationToUiV0(type);
  if (!uiGate.allow) {
    if (typeof window !== "undefined") {
      window.__rhizoh = window.__rhizoh || {};
      window.__rhizoh.lastWorldObservation = row;
    }
    return row;
  }

  ring = [...ring, row].slice(-MAX_RING);
  for (const fn of listeners) {
    try {
      fn(row);
    } catch {
      /* subscriber */
    }
  }
  if (typeof window !== "undefined") {
    if (!window.__rhizoh) window.__rhizoh = {};
    window.__rhizoh.lastWorldObservation = row;
    window.__rhizoh.worldObservationRing = ring.slice();
  }
  return row;
}

/**
 * @param {(row: object) => void | null} fn
 * @returns {() => void}
 */
export function setWorldObservationIngressSinkV0(fn) {
  ingressSink = typeof fn === "function" ? fn : null;
  return () => {
    if (ingressSink === fn) ingressSink = null;
  };
}

/** @param {(row: object) => void} fn */
export function subscribeWorldObservationV0(fn) {
  if (typeof fn !== "function") return () => {};
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getWorldObservationRingV0() {
  return ring.slice();
}

export function clearWorldObservationRingForTestV0() {
  ring = [];
  listeners.clear();
  ingressSink = null;
}
