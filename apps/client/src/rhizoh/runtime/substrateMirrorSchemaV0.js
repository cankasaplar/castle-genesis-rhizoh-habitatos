/**
 * PR-3.2.1 — Pure schema validators for mirror chain (drift guard).
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * Unknown keys are rejected at nested executionResult boundary to prevent
 * “wrong but internally consistent” mirror normalization.
 */

import { AMBIENT_BOX_MODE_V0 } from "./substrateMirrorConstantsV0.js";

const HEX_COLOR = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/;

/**
 * @param {unknown} er
 * @returns {{ ok: true } | { ok: false, errors: string[] }}
 */
export function validateNestedExecutionResultV0(er) {
  if (er == null) return { ok: true };
  if (typeof er !== "object" || Array.isArray(er)) {
    return { ok: false, errors: ["executionResult_not_plain_object"] };
  }
  const o = /** @type {Record<string, unknown>} */ (er);
  const top = Object.keys(o);
  for (const k of top) {
    if (k !== "light" && k !== "media") {
      return { ok: false, errors: [`executionResult_unknown_key:${k}`] };
    }
  }

  if (o.light !== undefined && o.light !== null) {
    if (typeof o.light !== "object" || Array.isArray(o.light)) {
      return { ok: false, errors: ["light_not_object"] };
    }
    const L = /** @type {Record<string, unknown>} */ (o.light);
    for (const k of Object.keys(L)) {
      if (k !== "color" && k !== "brightness" && k !== "temp" && k !== "temperature") {
        return { ok: false, errors: [`light_unknown_key:${k}`] };
      }
    }
    if (L.color !== undefined && typeof L.color !== "string") {
      return { ok: false, errors: ["light_color_type"] };
    }
    if (L.color !== undefined && typeof L.color === "string" && L.color.length > 0 && !HEX_COLOR.test(L.color)) {
      return { ok: false, errors: ["light_color_hex"] };
    }
    if (L.brightness !== undefined && (typeof L.brightness !== "number" || !Number.isFinite(L.brightness))) {
      return { ok: false, errors: ["light_brightness_type"] };
    }
    if (L.brightness !== undefined && (L.brightness < 0 || L.brightness > 1)) {
      return { ok: false, errors: ["light_brightness_range"] };
    }
    for (const tk of ["temp", "temperature"]) {
      const v = L[tk];
      if (v !== undefined && (typeof v !== "number" || !Number.isFinite(v))) {
        return { ok: false, errors: [`light_${tk}_type`] };
      }
    }
  }

  if (o.media !== undefined && o.media !== null) {
    if (typeof o.media !== "object" || Array.isArray(o.media)) {
      return { ok: false, errors: ["media_not_object"] };
    }
    const M = /** @type {Record<string, unknown>} */ (o.media);
    for (const k of Object.keys(M)) {
      if (k !== "action" && k !== "payload") {
        return { ok: false, errors: [`media_unknown_key:${k}`] };
      }
    }
    if (M.action !== undefined && M.action !== null && typeof M.action !== "string") {
      return { ok: false, errors: ["media_action_type"] };
    }
    if (M.payload !== undefined && M.payload !== null && typeof M.payload !== "string") {
      return { ok: false, errors: ["media_payload_type"] };
    }
  }

  return { ok: true };
}

/**
 * @param {unknown} box
 * @returns {{ ok: true } | { ok: false, errors: string[] }}
 */
export function validateAmbientBoxStateV0(box) {
  if (!box || typeof box !== "object" || Array.isArray(box)) {
    return { ok: false, errors: ["box_not_object"] };
  }
  const b = /** @type {Record<string, unknown>} */ (box);
  if (b.mode !== AMBIENT_BOX_MODE_V0) return { ok: false, errors: ["box_mode"] };
  if (typeof b.timestamp !== "number" || !Number.isFinite(b.timestamp)) {
    return { ok: false, errors: ["box_timestamp"] };
  }

  const light = b.light;
  if (!light || typeof light !== "object" || Array.isArray(light)) {
    return { ok: false, errors: ["box_light"] };
  }
  const L = /** @type {Record<string, unknown>} */ (light);
  if (typeof L.color !== "string" || !HEX_COLOR.test(L.color)) return { ok: false, errors: ["box_light_color"] };
  if (typeof L.brightness !== "number" || !Number.isFinite(L.brightness) || L.brightness < 0 || L.brightness > 1) {
    return { ok: false, errors: ["box_light_brightness"] };
  }
  if (typeof L.temperature !== "number" || !Number.isFinite(L.temperature)) {
    return { ok: false, errors: ["box_light_temperature"] };
  }

  const media = b.media;
  if (!media || typeof media !== "object" || Array.isArray(media)) {
    return { ok: false, errors: ["box_media"] };
  }
  const M = /** @type {Record<string, unknown>} */ (media);
  if (M.active !== null && typeof M.active !== "string") return { ok: false, errors: ["box_media_active"] };
  if (M.payload !== null && typeof M.payload !== "string") return { ok: false, errors: ["box_media_payload"] };
  for (const k of Object.keys(L)) {
    if (k !== "color" && k !== "brightness" && k !== "temperature") {
      return { ok: false, errors: [`box_light_unknown_key:${k}`] };
    }
  }
  for (const k of Object.keys(M)) {
    if (k !== "active" && k !== "payload") {
      return { ok: false, errors: [`box_media_unknown_key:${k}`] };
    }
  }

  return { ok: true };
}
