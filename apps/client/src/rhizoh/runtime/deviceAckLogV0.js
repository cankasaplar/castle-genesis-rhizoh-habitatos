/**
 * PR-3.3 — Append-only device ACK log (isolation sink for physical feedback).
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * This log is the **only** approved sink for device ACK / bridge snapshots in the client
 * control plane. Do not forward entries into world presence, epistemic orb, or continuity.
 *
 * Debug UI may **read** snapshots for mirror comparison (PR-3.3-D); that is not “feedback
 * into execution authority.”
 */

import { assertPhysicalAckSinkAllowedV0 } from "./physicalFeedbackBarrierV0.js";

/** @typedef {import('./physicalAckEnvelopeV0.js').PhysicalAckEnvelopeV0} PhysicalAckEnvelopeV0 */

/**
 * @param {number} max
 */
export function createDeviceAckRingBufferV0(max) {
  const cap = Math.min(500, Math.max(4, Math.floor(max)));
  /** @type {PhysicalAckEnvelopeV0[]} */
  const buf = [];
  return {
    capacity: cap,
    /** @param {PhysicalAckEnvelopeV0} entry */
    append(entry) {
      buf.push(entry);
      while (buf.length > cap) buf.shift();
    },
    snapshot() {
      return Object.freeze([...buf]);
    },
    clear() {
      buf.length = 0;
    }
  };
}

/** Process-local default buffer for tests / dev mirror panel (not persisted). */
const defaultBuffer = createDeviceAckRingBufferV0(64);

/**
 * @param {PhysicalAckEnvelopeV0} entry
 * @param {string} sinkId — must be `device_ack_log` (see `physicalFeedbackBarrierV0.js`).
 * @returns {{ ok: true } | { ok: false, code?: string, sinkId?: string }}
 */
export function tryDispatchPhysicalAckV0(entry, sinkId) {
  const gate = assertPhysicalAckSinkAllowedV0(sinkId);
  if (!gate.ok) return gate;
  if (sinkId === "device_ack_log") {
    defaultBuffer.append(entry);
    return { ok: true };
  }
  return { ok: false, code: "FEEDBACK_SINK_REJECTED", sinkId: String(sinkId) };
}

/**
 * @param {PhysicalAckEnvelopeV0} entry
 */
export function appendDeviceAckEntryV0(entry) {
  tryDispatchPhysicalAckV0(entry, "device_ack_log");
}

export function getDeviceAckSnapshotV0() {
  return defaultBuffer.snapshot();
}

export function clearDeviceAckLogForTestsV0() {
  defaultBuffer.clear();
}
