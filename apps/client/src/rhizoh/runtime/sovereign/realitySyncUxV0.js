/**
 * Reality Sync UX V0 — node birth cinematic state (presentation only).
 */

export const REALITY_SYNC_UX_SCHEMA_V0 = "castle.rhizoh.reality_sync_ux.v0";

export const REALITY_SYNC_PHASE_V0 = Object.freeze({
  IDLE: "idle",
  SEAL_PULSE: "seal_pulse",
  NODE_BIRTH: "node_birth",
  SIGNATURE_REVEAL: "signature_reveal",
  COMPLETE: "complete"
});

/**
 * @typedef {Object} RealitySyncBirthPayloadV0
 * @property {string} nodeId
 * @property {{ lat: number, lon: number }} anchor
 * @property {string|null} composedSignature
 * @property {string|null} topologyMapSignature
 */

/**
 * @param {RealitySyncBirthPayloadV0} payload
 * @returns {{ phase: string, payload: RealitySyncBirthPayloadV0, startedAtMs: number }}
 */
export function createRealitySyncBirthSessionV0(payload) {
  const session = Object.freeze({
    schema: REALITY_SYNC_UX_SCHEMA_V0,
    phase: REALITY_SYNC_PHASE_V0.SEAL_PULSE,
    payload: Object.freeze({ ...payload }),
    startedAtMs: Date.now(),
    readOnly: true
  });
  if (typeof window !== "undefined") {
    window.__rhizoh_reality_sync_session = session;
  }
  return session;
}

export function clearRealitySyncBirthSessionV0() {
  if (typeof window === "undefined") return;
  try {
    delete window.__rhizoh_reality_sync_session;
  } catch {
    /* noop */
  }
}
