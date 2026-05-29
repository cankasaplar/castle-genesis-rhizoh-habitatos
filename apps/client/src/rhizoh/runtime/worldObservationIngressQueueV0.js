/**
 * Client ingress queue — retry + backpressure; events delay, never silently drop.
 */

import { getGenesisProtocolGatewayOrigin } from "../../castleFlight/castleFlightConfig.js";
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

/** @type {{ row: object, envelope: object, attempts: number, nextAt: number }[]} */
let queue = [];
let inflight = 0;
let drainTimer = 0;
let lastAcceptedSeq = null;
/** @type {((snap: object) => void) | null} */
let onQueueChange = null;

function gatewayToken() {
  try {
    return String(getCastleFlightConfig()?.gatewayToken || import.meta.env?.VITE_GATEWAY_TOKEN || "").trim();
  } catch {
    return "";
  }
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

export function getWorldObservationIngressQueueSnapshotV0() {
  return Object.freeze({
    schema: WORLD_OBSERVATION_INGRESS_QUEUE_SCHEMA_V0,
    queued: queue.length,
    inflight,
    lastAcceptedSeq,
    backpressure: queue.length >= MAX_QUEUE - 8,
    atMs: Date.now()
  });
}

/**
 * @param {object} row
 * @returns {boolean} accepted into queue (may evict oldest under extreme pressure)
 */
export function enqueueWorldObservationIngressV0(row) {
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

async function postEnvelope(envelope) {
  const origin = String(getGenesisProtocolGatewayOrigin() || "").trim().replace(/\/+$/, "");
  if (!origin) throw new Error("no_gateway_origin");
  const token = gatewayToken();
  const headers = {
    "Content-Type": "application/json",
    "X-Castle-Ingress-Contract": WORLD_OBSERVATION_INGRESS_ENVELOPE_SCHEMA_V1
  };
  if (token) headers["X-Castle-Gateway-Token"] = token;
  const res = await fetch(`${origin}${WORLD_OBSERVATION_INGRESS_PATH_V0}`, {
    method: "POST",
    headers,
    body: JSON.stringify(envelope),
    keepalive: queue.length <= 1
  });
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

async function drainOnce() {
  if (inflight >= MAX_INFLIGHT) return;
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
      inflight -= 1;
      publishQueueTruth();
      return;
    }
    const retryable =
      res.status === 429 ||
      res.status === 503 ||
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
  } catch {
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
  if (drainTimer) return;
  drainTimer = window.setInterval(() => {
    void drainOnce();
    if (queue.length === 0 && inflight === 0) {
      window.clearInterval(drainTimer);
      drainTimer = 0;
    }
  }, DRAIN_INTERVAL_MS);
}

/** @returns {() => void} stop */
export function startWorldObservationIngressQueueV0() {
  if (typeof window === "undefined") return () => {};
  ensureDrainLoop();
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
  if (drainTimer) {
    window.clearInterval(drainTimer);
    drainTimer = 0;
  }
}

export function setWorldObservationIngressQueueObserverV0(fn) {
  onQueueChange = typeof fn === "function" ? fn : null;
}
