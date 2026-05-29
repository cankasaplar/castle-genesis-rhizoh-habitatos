/**
 * PR-3.2 — Pack PR-3.1 actuator outputs into nested `executionResult` for `createAmbientBoxStateV0`.
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * Drift-sensitive paths should use `canonicalMirrorPipelineV0.js` (`projectSubstrateFromRouterPartsV0`)
 * instead of calling `packExecutionMirrorV0` + `createAmbientBoxStateV0` ad hoc.
 */

/**
 * @param {{ light?: { color?: string, brightness?: number, temperature?: number, transition?: number, power?: number } | null, media?: { action?: string, payload?: string } | null }} parts
 * @returns {{ light?: { color: string, brightness: number, temp: number }, media?: { action: string, payload: string | null } }}
 */
export function packExecutionMirrorV0(parts = {}) {
  /** @type {{ light?: { color: string, brightness: number, temp: number }, media?: { action: string, payload: string | null } }} */
  const er = {};

  const lo = parts.light;
  if (lo && typeof lo === "object") {
    const hasAny =
      lo.color != null ||
      lo.brightness != null ||
      lo.temperature != null ||
      lo.transition != null ||
      lo.power != null;
    if (hasAny) {
      er.light = {
        color: typeof lo.color === "string" ? lo.color : "#000000",
        brightness: typeof lo.brightness === "number" ? lo.brightness : 0,
        temp:
          typeof lo.temperature === "number"
            ? lo.temperature
            : typeof lo.transition === "number"
              ? lo.transition
              : 0
      };
    }
  }

  const mo = parts.media;
  if (mo && typeof mo === "object" && typeof mo.action === "string" && mo.action.length > 0) {
    er.media = {
      action: mo.action,
      payload: mo.payload == null ? null : typeof mo.payload === "string" ? mo.payload : null
    };
  }

  return er;
}

/**
 * Compare two ambient box states for parity (ignores `timestamp`; compares `mode` + `light` + `media`).
 *
 * @param {ReturnType<import("./ambientBoxStateV0.js").createAmbientBoxStateV0>} a
 * @param {ReturnType<import("./ambientBoxStateV0.js").createAmbientBoxStateV0>} b
 */
export function substrateParityV0(a, b) {
  if (!a || !b) return false;
  if (a.mode !== b.mode) return false;
  if (JSON.stringify(a.light) !== JSON.stringify(b.light)) return false;
  if (JSON.stringify(a.media) !== JSON.stringify(b.media)) return false;
  return true;
}
