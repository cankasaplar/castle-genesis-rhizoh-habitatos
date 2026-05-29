/**
 * PR-3.3 — Physical ACK envelope: “device received command” witness, not epistemic truth.
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * ACK ≠ truth. Canonical executionResult / virtual substrate remain the interpretive SSOT
 * for planning; ACK only proves delivery / local device snapshot for parity checks.
 */

/**
 * @typedef {Object} PhysicalAckEnvelopeV0
 * @property {string} executionId
 * @property {'HUE' | 'TV' | string} actuator
 * @property {boolean} acknowledged
 * @property {number} receivedAt
 * @property {Record<string, unknown>} deviceState — opaque bridge/TV snapshot (never merge into epistemic stores)
 * @property {string} commandHash
 * @property {number} ackSchemaVersion — ACK normalization contract (replay / multi-firmware)
 * @property {string} [sequenceId] — PR-3.4 temporal ordering witness (ACK ↔ execution clock)
 * @property {boolean | Record<string, unknown> | undefined} [parityProof] — optional verifier hint; not ground truth
 */

/** Only v1 is supported at runtime today; bump when Hue/TV normalizers branch. */
export const PHYSICAL_ACK_SCHEMA_VERSION_V0 = 1;

/**
 * @param {import('./physicalAckEnvelopeV0.js').PhysicalAckEnvelopeV0} fields
 * @returns {Readonly<import('./physicalAckEnvelopeV0.js').PhysicalAckEnvelopeV0>}
 */
export function buildPhysicalAckEnvelopeV0(fields) {
  const e = fields;

  let parityProof = undefined;
  if (e.parityProof !== undefined) {
    if (typeof e.parityProof === "boolean") parityProof = e.parityProof;
    else if (e.parityProof && typeof e.parityProof === "object" && !Array.isArray(e.parityProof)) {
      parityProof = Object.freeze({ .../** @type {Record<string, unknown>} */ (e.parityProof) });
    }
  }

  return Object.freeze({
    executionId: String(e.executionId ?? ""),
    actuator: String(e.actuator ?? "UNKNOWN"),
    acknowledged: Boolean(e.acknowledged),
    receivedAt: typeof e.receivedAt === "number" && Number.isFinite(e.receivedAt) ? e.receivedAt : 0,
    deviceState:
      e.deviceState && typeof e.deviceState === "object" && !Array.isArray(e.deviceState)
        ? Object.freeze({ .../** @type {Record<string, unknown>} */ (e.deviceState) })
        : Object.freeze({}),
    commandHash: String(e.commandHash ?? ""),
    ackSchemaVersion: PHYSICAL_ACK_SCHEMA_VERSION_V0,
    ...(e.sequenceId != null && String(e.sequenceId).length > 0 ? { sequenceId: String(e.sequenceId) } : {}),
    parityProof
  });
}

/**
 * Normalize a minimal Hue REST success payload into an ACK envelope (dumb parse only).
 *
 * @param {{ executionId: string, commandHash: string, receivedAt: number, bridgeResponse?: unknown, lightId?: string }} io
 * @returns {Readonly<PhysicalAckEnvelopeV0>}
 */
export function normalizeHueAckEnvelopeV0(io) {
  const raw = io.bridgeResponse;
  let acknowledged = false;
  /** @type {Record<string, unknown>} */
  const deviceState = { raw: raw === undefined ? null : raw };

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const r = /** @type {Record<string, unknown>} */ (raw);
    const success = r.success;
    if (Array.isArray(success) && success.length > 0) acknowledged = true;
    if (r.state && typeof r.state === "object") {
      deviceState.hueLightState = /** @type {Record<string, unknown>} */ (r.state);
    }
  }

  return buildPhysicalAckEnvelopeV0({
    executionId: io.executionId,
    actuator: "HUE",
    acknowledged,
    receivedAt: io.receivedAt,
    deviceState,
    commandHash: io.commandHash
  });
}
