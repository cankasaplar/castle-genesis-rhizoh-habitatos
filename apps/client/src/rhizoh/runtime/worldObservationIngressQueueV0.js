/**
 * Client ingress queue — retry + backpressure; events delay, never silently drop.
 * Auth failures (401/403) open a circuit — no fetch spam when token missing/invalid.
 */

import { listGenesisAuthorityOriginsV0 } from "./genesisSingleAuthorityLockV0.js";
import { getCastleFlightConfig } from "../../castleFlight/castleFlightConfig.js";
import {
  buildWorldObservationIngressEnvelopeV1,
  WORLD_OBSERVATION_INGRESS_ENVELOPE_SCHEMA_V1
} from "./worldObservationIngressContractV0.js";

export const WORLD_OBSERVATION_INGRESS_PATH_V0 = "/rhizoh/genesis/ingress";
export const WORLD_OBSERVATION_INGRESS_QUEUE_SCHEMA_V0 = "castle.world_observation.ingress_queue.v0";

const MAX_QUEUE = 64;
const MAX_INFLIGHT = 2;
const MAX_ATTEMPTS = 5;
const RETRY_BASE_MS = 700;
const DRAIN_INTERVAL_MS = 400;
const AUTH_BLOCK_MS = 5 * 60 * 1000;
const INGRESS_FETCH_TIMEOUT_MS_V0 = 12000;

function listGenesisIngressOriginsV0() {
  return listGenesisAuthorityOriginsV0();
}

async function fetchIngressV0(url, init, timeoutMs = INGRESS_FETCH_TIMEOUT_MS_V0) {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** @type {{ row: object, envelope: object, attempts: number, nextAt: number }[]} */
let queue = [];
let inflight = 0;
let drainTimer = 0;
let lastAcceptedSeq = null;
/** @type {((snap: object) => void) | null} */
let onQueueChange = null;
/** @type {{ blocked: boolean, reason: string | null, untilMs: number | null }} */
let authCircuit = { blocked: false, reason: null, untilMs: null };
let authWarned = false;

function gatewayToken() {
  try {
    return String(getCastleFlightConfig()?.gatewayToken || import.meta.env?.VITE_GATEWAY_TOKEN || "").trim();
  } catch {
    return "";
  }
}

function blockIngressAuthV0(reason) {
  authCircuit = {
    blocked: true,
    reason: String(reason || "auth_blocked"),
    untilMs: Date.now() + AUTH_BLOCK_MS
  };
  queue = [];
  if (drainTimer) {
    window.clearInterval(drainTimer);
    drainTimer = 0;
  }
  if (!authWarned && typeof console !== "undefined") {
    authWarned = true;
    console.info(
      `[castle:ingress] observation ingress paused (${authCircuit.reason}) — set VITE_GATEWAY_TOKEN in .env.local`
    );
  }
  publishQueueTruth();
}

function refreshAuthCircuitV0() {
  if (!authCircuit.blocked) return;
  if (authCircuit.untilMs && Date.now() >= authCircuit.untilMs) {
    authCircuit = { blocked: false, reason: null, untilMs: null };
    authWarned = false;
  }
}

/** @returns {boolean} */
export function isIngressAuthBlockedV0() {
  refreshAuthCircuitV0();
  if (authCircuit.blocked) return true;
  return !gatewayToken();
}

export function getWorldObservationIngressQueueSnapshotV0() {
  refreshAuthCircuitV0();
  return Object.freeze({
    schema: WORLD_OBSERVATION_INGRESS_QUEUE_SCHEMA_V0,
    queued: queue.length,
    inflight,
    lastAcceptedSeq,
    backpressure: queue.length >= MAX_QUEUE - 8,
    authBlocked: authCircuit.blocked || !gatewayToken(),
    authReason: authCircuit.reason || (!gatewayToken() ? "no_gateway_token" : null),
    hasGatewayToken: Boolean(gatewayToken()),
    atMs: Date.now()
  });
}

function publishQueueTruth() {
  const snap = getWorldObservationIngressQueueSnapshotV0();
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.ingressQueue = snap;
  }
  try {
    onQueueChange?.(snap);
  } catch {
    /* observer */
  }
}

/**
 * @param {object} row
 * @returns {boolean} accepted into queue (may evict oldest under extreme pressure)
 */
export function enqueueWorldObservationIngressV0(row) {
  refreshAuthCircuitV0();
  if (isIngressAuthBlockedV0()) {
    if (!gatewayToken()) blockIngressAuthV0("no_gateway_token");
    return false;
  }

  const built = buildWorldObservationIngressEnvelopeV1({
    type: row?.type,
    atMs: row?.atMs,
    payload: row?.payload
  });
  if (!built.ok) return false;

  if (queue.length >= MAX_QUEUE) {
    queue.shift();
  }
  queue.push({
    row,
    envelope: built.envelope,
    attempts: 0,
    nextAt: Date.now()
  });
  publishQueueTruth();
  ensureDrainLoop();
  return true;
}

async function postEnvelopeToOrigin(origin, envelope) {
  const token = gatewayToken();
  if (!token) {
    return {
      res: { ok: false, status: 401 },
      json: { ok: false, error: "no_gateway_token", deferred: false },
      ingressOrigin: origin
    };
  }
  const headers = {
    "Content-Type": "application/json",
    "X-Castle-Ingress-Contract": WORLD_OBSERVATION_INGRESS_ENVELOPE_SCHEMA_V1,
    "X-Castle-Gateway-Token": token
  };
  const res = await fetchIngressV0(`${origin}${WORLD_OBSERVATION_INGRESS_PATH_V0}`, {
    method: "POST",
    headers,
    body: JSON.stringify(envelope),
    keepalive: queue.length <= 1
  });
  const json = await res.json().catch(() => ({}));
  return { res, json, ingressOrigin: origin };
}

async function postEnvelope(envelope) {
  const origins = listGenesisIngressOriginsV0();
  if (!origins.length) throw new Error("no_gateway_origin");

  let lastResult = null;
  for (let index = 0; index < origins.length; index += 1) {
    const origin = origins[index];
    const hasFallback = index < origins.length - 1;
    try {
      const result = await postEnvelopeToOrigin(origin, envelope);
      lastResult = result;
      if (result.res.ok) return result;
      if (hasFallback && [502, 503, 504].includes(result.res.status)) continue;
      return result;
    } catch (err) {
      lastResult = {
        res: { ok: false, status: 0 },
        json: { ok: false, error: String(err?.message || err || "fetch_failed") },
        ingressOrigin: origin
      };
      if (hasFallback) continue;
      throw err;
    }
  }
  return lastResult || { res: { ok: false, status: 0 }, json: { ok: false, error: "no_gateway_origin" } };
}

async function drainOnce() {
  if (inflight >= MAX_INFLIGHT) return;
  if (isIngressAuthBlockedV0()) return;

  const now = Date.now();
  const idx = queue.findIndex((item) => item.nextAt <= now);
  if (idx < 0) return;

  const [item] = queue.splice(idx, 1);
  inflight += 1;
  publishQueueTruth();

  try {
    const { res, json } = await postEnvelope(item.envelope);
    if (res.ok && json?.ok) {
      if (typeof json.seq === "number") lastAcceptedSeq = json.seq;
      authCircuit = { blocked: false, reason: null, untilMs: null };
      authWarned = false;
      inflight -= 1;
      publishQueueTruth();
      return;
    }
    if (res.status === 401 || res.status === 403) {
      blockIngressAuthV0(json?.error || `http_${res.status}`);
      inflight -= 1;
      publishQueueTruth();
      return;
    }
    const retryable =
      res.status === 429 ||
      res.status === 502 ||
      res.status === 503 ||
      res.status === 504 ||
      json?.deferred === true ||
      json?.error === "rate_limited" ||
      json?.error === "agent_spoke_throttled";
    item.attempts += 1;
    if (retryable && item.attempts < MAX_ATTEMPTS) {
      const delay = RETRY_BASE_MS * item.attempts + Math.floor(Math.random() * 200);
      item.nextAt = Date.now() + delay;
      queue.push(item);
    } else if (!res.ok && item.attempts < MAX_ATTEMPTS) {
      item.nextAt = Date.now() + RETRY_BASE_MS * item.attempts;
      queue.push(item);
    }
  } catch (err) {
    item.attempts += 1;
    if (item.attempts < MAX_ATTEMPTS) {
      item.nextAt = Date.now() + RETRY_BASE_MS * item.attempts;
      queue.push(item);
    }
  } finally {
    inflight = Math.max(0, inflight - 1);
    publishQueueTruth();
  }
}

function ensureDrainLoop() {
  if (typeof window === "undefined") return;
  if (isIngressAuthBlockedV0()) return;
  if (drainTimer) return;
  drainTimer = window.setInterval(() => {
    void drainOnce();
    if ((queue.length === 0 && inflight === 0) || isIngressAuthBlockedV0()) {
      window.clearInterval(drainTimer);
      drainTimer = 0;
    }
  }, DRAIN_INTERVAL_MS);
}

/** @returns {() => void} stop */
export function startWorldObservationIngressQueueV0() {
  if (typeof window === "undefined") return () => {};
  if (!isIngressAuthBlockedV0()) ensureDrainLoop();
  return stopWorldObservationIngressQueueV0;
}

export function stopWorldObservationIngressQueueV0() {
  if (drainTimer) {
    window.clearInterval(drainTimer);
    drainTimer = 0;
  }
}

export function clearWorldObservationIngressQueueForTestV0() {
  queue = [];
  inflight = 0;
  lastAcceptedSeq = null;
  authCircuit = { blocked: false, reason: null, untilMs: null };
  authWarned = false;
  if (drainTimer) {
    window.clearInterval(drainTimer);
    drainTimer = 0;
  }
}

export function setWorldObservationIngressQueueObserverV0(fn) {
  onQueueChange = typeof fn === "function" ? fn : null;
}
