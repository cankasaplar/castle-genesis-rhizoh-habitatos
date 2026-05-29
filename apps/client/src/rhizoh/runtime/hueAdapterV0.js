/**
 * PR-3.3-A — Hue adapter: dumb effector mapping only.
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * Does **not**: produce epistemic/world state, smooth values, retry, or interpret semantics.
 * Does: canonical light projection → Hue REST-shaped payload + stable address hint.
 *
 * **Semantic blindness:** this module must not encode or import weather, drift bloom,
 * stability / governance modes, or any epistemic vocabulary — only numeric / RGB **effect** fields.
 * If that boundary slips, the actuator layer becomes epistemic and parity + replay lose meaning.
 *
 * **Zero-Feedback Safety Rule:** Hue device state must **only** enter `deviceAckLogV0` (or
 * parity UI reading that log). Never `uiStore`, `worldPresence`, epistemic runtime, or continuity memory.
 */

/** Keys permitted on the light projection object passed into the Hue bridge mapper. */
export const DUMB_HUE_LIGHT_KEYS_V0 = Object.freeze([
  "power",
  "brightness",
  "temperature",
  "transition",
  "color"
]);

/**
 * Reject epistemic / world / execution metadata accidentally fused into the dumb projection.
 *
 * @param {unknown} light
 * @returns {{ ok: true } | { ok: false, errors: string[] }}
 */
export function validateDumbLightProjectionForHueV0(light) {
  if (light == null || typeof light !== "object" || Array.isArray(light)) return { ok: true };
  const o = /** @type {Record<string, unknown>} */ (light);
  /** @type {string[]} */
  const errors = [];
  for (const k of Object.keys(o)) {
    if (!DUMB_HUE_LIGHT_KEYS_V0.includes(k)) errors.push(`forbidden_light_key:${k}`);
  }
  return errors.length ? { ok: false, errors } : { ok: true };
}

/**
 * Kelvin (CCT) → Hue `ct` mired (153–500 typical).
 * @param {number} kelvin
 */
export function kelvinToHueCtMiredV0(kelvin) {
  const k = typeof kelvin === "number" && Number.isFinite(kelvin) ? kelvin : 4000;
  const kk = Math.min(6500, Math.max(1000, k));
  const m = Math.round(1_000_000 / kk);
  return Math.min(500, Math.max(153, m));
}

/**
 * @param {{ brightness?: number, temperature?: number, power?: number, transition?: number, color?: string }} light — e.g. `lightActuatorV0.apply` output
 * @param {{ lightId?: string }} [opts]
 * @returns {{ method: 'PUT', path: string, body: Record<string, number | boolean> } | null} `null` if projection carries forbidden (non-dumb) keys
 */
export function canonicalLightToHueBridgePayloadV0(light, opts = {}) {
  const id = String(opts.lightId ?? "1").replace(/[^\w-]/g, "") || "1";
  const L = light && typeof light === "object" ? light : {};
  const gate = validateDumbLightProjectionForHueV0(L);
  if (!gate.ok) return null;
  const bri01 =
    typeof L.brightness === "number" && Number.isFinite(L.brightness)
      ? Math.min(1, Math.max(0, L.brightness))
      : 0;
  const on =
    typeof L.power === "number" && L.power > 0
      ? true
      : bri01 > 0.001;
  const transitiontime =
    typeof L.transition === "number" && Number.isFinite(L.transition)
      ? Math.round(Math.min(65535, Math.max(0, L.transition / 100)))
      : 4;

  if (!on) {
    return {
      method: /** @type {const} */ ("PUT"),
      path: `/api/<username>/lights/${id}/state`,
      body: { on: false, transitiontime }
    };
  }

  const bri = Math.round(Math.min(254, Math.max(1, bri01 * 254)));

  /** @type {Record<string, number | boolean>} */
  const body = { on: true, bri, transitiontime };

  const temp =
    typeof L.temperature === "number" && Number.isFinite(L.temperature) ? L.temperature : null;
  if (temp != null) {
    body.ct = kelvinToHueCtMiredV0(temp);
  }

  return {
    method: /** @type {const} */ ("PUT"),
    path: `/api/<username>/lights/${id}/state`,
    body
  };
}
