/**
 * PR-3.3-B — Physical parity: **virtual substrate (mirror) vs device ACK** (physical scope only).
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * **Not the same as canonical mirror parity (PR-3.2.1):**
 * - **Canonical parity:** `executionResult` ↔ packed mirror ↔ `ambientBox` — `canonicalMirrorPipelineV0` + `canonicalSubstrateParityV0`.
 * - **Physical parity (this file):** frozen **virtual** `ambientBox` ↔ **normalized** Hue/TV state from ACK — delivery / hardware witness only.
 */

import { DRIFT_SCOPE, PHYSICAL_DRIFT_DETECTED } from "./driftNamespaceV0.js";

const BRI_EPS = 0.04;
const KELVIN_EPS = 200;

/**
 * Map Hue `state` object toward mirror light slice (numeric only; not SSOT).
 *
 * @param {unknown} hueState
 * @returns {{ color: string, brightness: number, temp: number } | null}
 */
export function hueDeviceStateToMirrorLightV0(hueState) {
  if (!hueState || typeof hueState !== "object" || Array.isArray(hueState)) return null;
  const s = /** @type {Record<string, unknown>} */ (hueState);
  const on = s.on === true;
  const briRaw = typeof s.bri === "number" && Number.isFinite(s.bri) ? s.bri : 0;
  const brightness = on ? Math.min(1, Math.max(0, briRaw / 254)) : 0;
  let temp = 4000;
  if (typeof s.ct === "number" && s.ct > 0) {
    temp = Math.round(1_000_000 / s.ct);
    temp = Math.min(6500, Math.max(1000, temp));
  }
  return { color: "#ffffff", brightness, temp };
}

/**
 * @param {import('./physicalAckEnvelopeV0.js').PhysicalAckEnvelopeV0} ack
 * @returns {Record<string, unknown> | null}
 */
function readHueLightStateFromAckV0(ack) {
  const ds = ack?.deviceState;
  if (!ds || typeof ds !== "object") return null;
  const d = /** @type {Record<string, unknown>} */ (ds);
  if (d.hueLightState && typeof d.hueLightState === "object") {
    return /** @type {Record<string, unknown>} */ (d.hueLightState);
  }
  const raw = d.raw;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const st = /** @type {Record<string, unknown>} */ (raw).state;
    if (st && typeof st === "object") return /** @type {Record<string, unknown>} */ (st);
  }
  return null;
}

/**
 * @param {{ virtualBox: unknown, ackEnvelope: import('./physicalAckEnvelopeV0.js').PhysicalAckEnvelopeV0 | null | undefined }} io
 * @returns {{ ok: boolean, scope: string, code?: string }}
 */
export function verifyPhysicalParityV0(io) {
  const scope = DRIFT_SCOPE.PHYSICAL;
  const box = io.virtualBox;
  const ack = io.ackEnvelope;
  if (!box || typeof box !== "object") {
    return { ok: false, scope, code: PHYSICAL_DRIFT_DETECTED };
  }
  if (!ack || typeof ack !== "object") {
    return { ok: false, scope, code: "NO_PHYSICAL_ACK" };
  }
  if (!ack.acknowledged) {
    return { ok: false, scope, code: "NO_PHYSICAL_ACK" };
  }

  const b = /** @type {{ light?: { brightness?: number, temperature?: number } }} */ (box);
  const vl = b.light;
  if (!vl || typeof vl !== "object") {
    return { ok: false, scope, code: PHYSICAL_DRIFT_DETECTED };
  }

  const hueSt = readHueLightStateFromAckV0(ack);
  const ml = hueDeviceStateToMirrorLightV0(hueSt);
  if (!ml) {
    return { ok: false, scope, code: PHYSICAL_DRIFT_DETECTED };
  }

  const db = Math.abs((vl.brightness ?? 0) - ml.brightness);
  const vt = typeof vl.temperature === "number" ? vl.temperature : 0;
  const dk = Math.abs(vt - ml.temp);

  if (db > BRI_EPS || dk > KELVIN_EPS) {
    return { ok: false, scope, code: PHYSICAL_DRIFT_DETECTED };
  }

  return { ok: true, scope };
}
