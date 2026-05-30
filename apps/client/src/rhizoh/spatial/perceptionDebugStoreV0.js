/**
 * Perception debug store (v0) — **world state değil**, **SSOT değil**, **runtime karar yok**.
 *
 * Son `perceptionSignal` anlık görüntüsü (overlay / konsol). `worldPresenceState` veya snapshot ile karıştırılmamalı.
 *
 * @see perceptionSignalV0.js
 * @see docs/RHIZOH_PROJECTION_DISCIPLINE_V0.md (B2 daraltılmış kilit)
 */

/** @type {import("./perceptionSignalV0.js").PerceptionSignalV0 | null} */
let _lastSignal = null;
/** @type {number} */
let _recordedAtMs = 0;

/**
 * @param {import("./perceptionSignalV0.js").PerceptionSignalV0 | null | undefined} signal
 */
export function setPerceptionDebugSnapshotV0(signal) {
  if (!signal || typeof signal !== "object") return;
  _lastSignal = {
    schema: signal.schema,
    cameraDriftFromOrigin: signal.cameraDriftFromOrigin,
    anchorFieldDistortion: signal.anchorFieldDistortion,
    fogMismatchDelta: signal.fogMismatchDelta
  };
  _recordedAtMs = Date.now();
}

/**
 * @returns {(import("./perceptionSignalV0.js").PerceptionSignalV0 & { recordedAtMs: number }) | null}
 */
export function getPerceptionDebugSnapshotV0() {
  if (!_lastSignal) return null;
  return { ..._lastSignal, recordedAtMs: _recordedAtMs };
}

export function resetPerceptionDebugStoreForTestsV0() {
  _lastSignal = null;
  _recordedAtMs = 0;
}
