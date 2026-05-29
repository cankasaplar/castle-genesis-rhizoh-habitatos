/**
 * Genesis continuity — append-style SSE with monotonic `seq` (canonical continuity accept order)
 * and SSE `id:` for Last-Event-ID / reconnect catch-up (bounded ring).
 *
 * Event kinds: TickAdvanced | SealIssued | LedgerAdvanced | ReplayState | PresenceMesh | InfraHealth
 *   | SpiralWebSocket | RuntimeCapabilityEvent | ReplayFingerprint | WorldObservation
 *
 * Semantics:
 * - `continuitySeq` / `event.seq` = causal **acceptance line** (continuity exists without observers).
 * - SSE + ring = **resumable transport + bounded catch-up** (performance / federation primitive), not the
 *   cryptographic truth ledger. Keep **signed checkpoints / merkle continuity root** separate from this ring.
 *
 * @see `castle.genesis.continuity_event.v0`
 */

import { scheduleGenesisContinuityHeadPersistV0 } from "./genesisContinuityPersistenceV0.js";
import { maybeAppendGenesisContinuityEventArchiveV0 } from "./genesisContinuityEventArchiveV0.js";

export const GENESIS_CONTINUITY_EVENT_SCHEMA = "castle.genesis.continuity_event.v0";

const RING_MAX = 512;

/** Optional hook after each accepted `seq` (e.g. signed checkpoint; must not throw). */
/** @type {((seq: number) => void) | null} */
let afterPublishHook = null;

export function setGenesisContinuityAfterPublishHook(fn) {
  afterPublishHook = typeof fn === "function" ? fn : null;
}

/** Monotonic: assigned on every accepted publish (even with zero SSE observers). */
let continuitySeq = 0;

/** @type {{ seq: number, wire: string }[]} */
const eventRing = [];

/** @type {Set<import("http").ServerResponse>} */
const sseClients = new Set();

let heartbeatTimer = null;

function clearHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function ensureHeartbeat() {
  if (heartbeatTimer || sseClients.size === 0) return;
  heartbeatTimer = setInterval(() => {
    const t = Date.now();
    for (const res of sseClients) {
      try {
        if (!res.writableEnded) res.write(`: hb ${t}\n\n`);
      } catch {
        sseClients.delete(res);
      }
    }
    if (sseClients.size === 0) clearHeartbeat();
  }, 15000);
}

function pushRing(seq, wire) {
  eventRing.push({ seq, wire });
  if (eventRing.length > RING_MAX) eventRing.shift();
}

/**
 * @param {import("http").ServerResponse} res
 * @param {string} wire
 */
function writeWire(res, wire) {
  if (res.writableEnded) return;
  res.write(wire);
}

/**
 * @param {{ type: string, id: string, payload?: Record<string, unknown> }} event
 */
export function publishGenesisContinuityEvent(event) {
  continuitySeq += 1;
  const seq = continuitySeq;
  const envelope = {
    schema: GENESIS_CONTINUITY_EVENT_SCHEMA,
    seq,
    serverTime: Date.now(),
    type: event.type,
    id: event.id,
    ...(event.payload != null ? { payload: event.payload } : {})
  };
  const wire = `id: ${seq}\ndata: ${JSON.stringify(envelope)}\n\n`;
  pushRing(seq, wire);
  maybeAppendGenesisContinuityEventArchiveV0(envelope);

  try {
    afterPublishHook?.(seq);
  } catch {
    /* never break causal transport */
  }

  scheduleGenesisContinuityHeadPersistV0(seq);

  if (sseClients.size === 0) return;

  for (const res of [...sseClients]) {
    try {
      writeWire(res, wire);
    } catch {
      sseClients.delete(res);
    }
  }
  if (sseClients.size === 0) clearHeartbeat();
}

export function getGenesisContinuitySeq() {
  return continuitySeq;
}

/** Boot only: raise accepted seq floor after durable rehydrate (monotonic). */
export function rehydrateGenesisContinuitySeqFromBootV0(n) {
  const v = Math.floor(Number(n) || 0);
  if (v > continuitySeq) continuitySeq = v;
}

export function genesisContinuityStreamSubscriberCount() {
  return sseClients.size;
}

/**
 * Replay SSE wire blocks with `seq` strictly greater than `afterSeq` (Last-Event-ID).
 * @param {import("http").ServerResponse} res
 * @param {number} afterSeq
 */
export function replayGenesisContinuitySinceSeq(res, afterSeq) {
  if (!Number.isFinite(afterSeq) || afterSeq < 0) return;
  for (const item of eventRing) {
    if (item.seq > afterSeq) {
      try {
        writeWire(res, item.wire);
      } catch {
        return;
      }
    }
  }
}

/**
 * Parse `data: {json}` line from precomposed SSE wire (same shape as live stream).
 * @param {string} wire
 * @returns {Record<string, unknown> | null}
 */
function parseContinuityEnvelopeFromWire(wire) {
  const lines = String(wire || "").split("\n");
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      try {
        const j = JSON.parse(line.slice(6));
        return j && typeof j === "object" ? j : null;
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * In-memory ring slice for unified replay (priority over archive for same `seq`).
 * @param {number} fromSeq inclusive
 * @param {number} toSeq inclusive
 * @param {string} [typeFilter]
 * @returns {{ ok: true, events: Record<string, unknown>[] } | { ok: false, error: string, events: [] }}
 */
export function queryGenesisContinuityRingV0(fromSeq, toSeq, typeFilter) {
  const from = Math.floor(Number(fromSeq) || 0);
  const to = Math.floor(Number(toSeq) || 0);
  const tf = String(typeFilter || "").trim();
  if (from <= 0 || to <= 0) return { ok: false, error: "invalid_range", events: [] };
  if (to < from) return { ok: false, error: "range_inverted", events: [] };
  if (to - from > RING_MAX) {
    return { ok: false, error: "range_span_too_large", maxSpan: RING_MAX, events: [] };
  }
  /** @type {Record<string, unknown>[]} */
  const out = [];
  for (const item of eventRing) {
    if (item.seq < from || item.seq > to) continue;
    const j = parseContinuityEnvelopeFromWire(item.wire);
    if (!j) continue;
    if (tf && String(j.type || "") !== tf) continue;
    out.push(j);
  }
  out.sort((a, b) => Math.floor(Number(a.seq) || 0) - Math.floor(Number(b.seq) || 0));
  return { ok: true, events: out };
}

/**
 * @param {import("http").ServerResponse} res
 * @param {import("http").IncomingMessage} [req]
 * @returns {() => void} unregister
 */
export function registerGenesisSseClient(res, req) {
  const raw = String(req?.headers?.["last-event-id"] ?? req?.headers?.["Last-Event-ID"] ?? "").trim();
  const after = parseInt(raw, 10);
  if (Number.isFinite(after) && after > 0) {
    replayGenesisContinuitySinceSeq(res, after);
  }

  sseClients.add(res);
  ensureHeartbeat();
  const detach = () => {
    sseClients.delete(res);
    if (sseClients.size === 0) clearHeartbeat();
  };
  res.on("close", detach);
  res.on("finish", detach);
  return detach;
}

/** @public Tests — clears ring, subscribers, seq (same process). */
export function resetGenesisContinuityStreamHubForTests() {
  clearHeartbeat();
  sseClients.clear();
  eventRing.length = 0;
  continuitySeq = 0;
  afterPublishHook = null;
}
