/**
 * PR-3.3 — Execution authority: forward-only control plane.
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * **Law:** Canonical execution may drive actuators; actuators may not drive canonical execution.
 *
 * This is distinct from the physical feedback barrier (ACK must not mutate epistemic state);
 * here we forbid reversing *execution authority* (e.g. device-driven replanning / command regeneration).
 */

export const EXECUTION_AUTHORITY_LAW_V0 =
  "Canonical execution may drive actuators; actuators may not drive canonical execution.";

export const EXECUTION_LAYER = Object.freeze({
  CANONICAL_EXECUTION: "canonical_execution",
  ACTUATOR: "actuator",
  EPISTEMIC: "epistemic"
});

/**
 * @param {string} fromLayer
 * @param {string} toLayer
 * @returns {{ ok: true } | { ok: false, code: "REVERSE_EXECUTION_AUTHORITY", fromLayer: string, toLayer: string }}
 */
export function assertForwardExecutionAuthorityV0(fromLayer, toLayer) {
  const f = String(fromLayer || "");
  const t = String(toLayer || "");
  /** Actuator must not upstream into canonical execution or epistemic planning. */
  if (f === EXECUTION_LAYER.ACTUATOR) {
    if (t === EXECUTION_LAYER.CANONICAL_EXECUTION || t === EXECUTION_LAYER.EPISTEMIC) {
      return { ok: false, code: "REVERSE_EXECUTION_AUTHORITY", fromLayer: f, toLayer: t };
    }
  }
  return { ok: true };
}
