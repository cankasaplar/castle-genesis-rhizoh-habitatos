/**
 * Epistemic telemetry dependency barrier v1 — bootstrap gate for ledger channel.
 * Shadow-buffer events until gateway attach; flush on connect (no voice hard-block).
 */

export const EPISTEMIC_TELEMETRY_BARRIER_SCHEMA_V1 = "castle.epistemic_telemetry_barrier.v1";

/** @type {boolean} */
let channelAttached = false;

/** @type {string | null} */
let attachReason = null;

/** @type {number | null} */
let attachAtMs = null;

/** @type {{ entry: object, idToken: string, atMs: number }[]} */
const shadowBuffer = [];

const SHADOW_MAX = 240;

function publishBarrierSnapshot(extra = {}) {
  if (typeof window === "undefined") return;
  try {
    window.__CASTLE_EPISTEMIC_TELEMETRY_BARRIER__ = Object.freeze({
      schema: EPISTEMIC_TELEMETRY_BARRIER_SCHEMA_V1,
      channelAttached,
      attachReason,
      attachAtMs,
      shadowCount: shadowBuffer.length,
      atMs: Date.now(),
      ...extra
    });
  } catch {
    /* noop */
  }
}

export function isEpistemicTelemetryChannelAttachedV1() {
  return channelAttached === true;
}

export function getEpistemicTelemetryShadowCountV1() {
  return shadowBuffer.length;
}

/**
 * @param {{ entry: object, idToken?: string, atMs?: number }} row
 */
export function pushEpistemicTelemetryShadowV1(row) {
  if (!row?.entry || typeof row.entry !== "object") return false;
  shadowBuffer.push({
    entry: row.entry,
    idToken: String(row.idToken || ""),
    atMs: Number(row.atMs) > 0 ? Number(row.atMs) : Date.now()
  });
  if (shadowBuffer.length > SHADOW_MAX) shadowBuffer.splice(0, shadowBuffer.length - SHADOW_MAX);
  publishBarrierSnapshot({ lastStatus: "buffering" });
  return true;
}

/**
 * Drain shadow buffer into caller-owned batch (FIFO).
 * @returns {{ entry: object, idToken: string, atMs: number }[]}
 */
export function drainEpistemicTelemetryShadowV1() {
  if (!shadowBuffer.length) return [];
  return shadowBuffer.splice(0, shadowBuffer.length);
}

/**
 * Gateway / runtime attach — opens epistemic core channel and enables remote flush.
 * @param {string} [reason]
 */
export function attachEpistemicTelemetryChannelV1(reason = "gateway_connected") {
  const wasAttached = channelAttached;
  channelAttached = true;
  attachReason = String(reason || "gateway_connected");
  attachAtMs = Date.now();
  publishBarrierSnapshot({
    lastStatus: wasAttached ? "reattached" : "attached",
    flushedShadowPending: shadowBuffer.length
  });
  return Object.freeze({
    attached: true,
    reattached: wasAttached,
    shadowCount: shadowBuffer.length,
    reason: attachReason
  });
}

export function getEpistemicTelemetryBarrierSnapshotV1() {
  return Object.freeze({
    channelAttached,
    attachReason,
    attachAtMs,
    shadowCount: shadowBuffer.length
  });
}

/** @internal vitest */
export function resetEpistemicTelemetryBarrierForTestV1() {
  channelAttached = false;
  attachReason = null;
  attachAtMs = null;
  shadowBuffer.length = 0;
  if (typeof window !== "undefined") {
    delete window.__CASTLE_EPISTEMIC_TELEMETRY_BARRIER__;
  }
}

if (typeof window !== "undefined") {
  publishBarrierSnapshot({ lastStatus: "attach_pending" });
}
