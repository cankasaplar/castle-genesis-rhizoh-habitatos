/**
 * PR-3.1 — LIGHT_ACTUATOR: physical light only (no media side-effects).
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * System boundary: actuator output is a **physical projection** — never feed epistemic state
 * from device feedback here (no TV → state, no light → runtime loop).
 */

/** @typedef {"LIGHT_ACTUATOR"} LightActuatorNamespaceV0 */

export const lightActuatorV0 = {
  /**
   * @param {{ power?: number, color?: string, brightness?: number, transition?: number, temperature?: number }} cmd
   * @returns {{ power: number | undefined, color: string | undefined, brightness: number | undefined, transition: number | undefined, temperature: number | undefined }}
   */
  apply(cmd) {
    if (!cmd || typeof cmd !== "object") {
      return {
        power: undefined,
        color: undefined,
        brightness: undefined,
        transition: undefined,
        temperature: undefined
      };
    }
    const c = /** @type {Record<string, unknown>} */ (cmd);
    return {
      power: typeof c.power === "number" ? c.power : undefined,
      color: typeof c.color === "string" ? c.color : undefined,
      brightness: typeof c.brightness === "number" ? c.brightness : undefined,
      transition: typeof c.transition === "number" ? c.transition : undefined,
      temperature: typeof c.temperature === "number" ? c.temperature : undefined
    };
  }
};
