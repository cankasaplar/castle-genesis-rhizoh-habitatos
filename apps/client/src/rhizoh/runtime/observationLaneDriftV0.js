/**
 * PR-2.5 — Same `runtimeFrameId` bound to two different observation lanes → anomaly (replay bias guard).
 *
 * @see observationEnvelopeV0.js
 */

/** @typedef {import("./observationEnvelopeV0.js").ObservationIdentityLaneV0} ObservationIdentityLaneV0 */

const MAX_ENTRIES = 128;
/** @type {Map<string, ObservationIdentityLaneV0>} */
const _frameToLane = new Map();

/**
 * @param {string} runtimeFrameId
 * @param {ObservationIdentityLaneV0} lane
 * @returns {{ ok: true } | { ok: false, frameId: string, expectedLane: ObservationIdentityLaneV0, gotLane: ObservationIdentityLaneV0 }}
 */
export function checkObservationLaneDriftV0(runtimeFrameId, lane) {
  const fid = String(runtimeFrameId || "").trim();
  const gotLane = /** @type {ObservationIdentityLaneV0} */ (String(lane || "owner"));
  if (!fid) return { ok: true };

  const prev = _frameToLane.get(fid);
  if (prev && prev !== gotLane) {
    return { ok: false, frameId: fid, expectedLane: prev, gotLane };
  }
  if (!prev) {
    _frameToLane.set(fid, gotLane);
    while (_frameToLane.size > MAX_ENTRIES) {
      const first = _frameToLane.keys().next().value;
      if (first === undefined) break;
      _frameToLane.delete(first);
    }
  }
  return { ok: true };
}

export function resetObservationLaneDriftForTestsV0() {
  _frameToLane.clear();
}
