/**
 * PR-3.2 — Virtual substrate: ambient box = execution mirror (not UI).
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * Ontological rule: real-world output is a **verification target**, not the simulation engine.
 */

import { AMBIENT_BOX_MODE_V0 } from "./substrateMirrorConstantsV0.js";

/**
 * @param {unknown} executionResult — nested `{ light?: { color, brightness, temp|temperature }, media?: { action, payload } }`
 * @param {number} [nowMs] — inject for deterministic replay; defaults to `Date.now()`.
 */
export function createAmbientBoxStateV0(executionResult, nowMs) {
  const ts = typeof nowMs === "number" && Number.isFinite(nowMs) ? nowMs : Date.now();
  const er = executionResult && typeof executionResult === "object" ? executionResult : {};
  const L = /** @type {Record<string, unknown>} */ (/** @type {{ light?: unknown }} */ (er).light || {});
  const M = /** @type {Record<string, unknown>} */ (/** @type {{ media?: unknown }} */ (er).media || {});

  const tempIn =
    typeof L.temp === "number"
      ? L.temp
      : typeof L.temperature === "number"
        ? L.temperature
        : 0;

  return Object.freeze({
    light: Object.freeze({
      color: typeof L.color === "string" ? L.color : "#000000",
      brightness: typeof L.brightness === "number" ? L.brightness : 0,
      temperature: tempIn
    }),
    media: Object.freeze({
      active: typeof M.action === "string" ? M.action : null,
      payload:
        M.payload == null
          ? null
          : typeof M.payload === "string"
            ? M.payload
            : null
    }),
    timestamp: ts,
    mode: AMBIENT_BOX_MODE_V0
  });
}
