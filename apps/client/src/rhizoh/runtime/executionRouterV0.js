/**
 * PR-3.1 — Execution router (namespace → actuator). Elegant gate; no cross-wiring.
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * **Seal — never:**
 * - TV / media outcome → epistemic state update
 * - Light command → media trigger (or reverse)
 * - Device telemetry → epistemic loop closure here
 *
 * **Only:** validated command → deterministic physical projection (actuator output).
 */

import { lightActuatorV0 } from "./lightActuatorV0.js";
import { mediaActuatorV0 } from "./mediaActuatorV0.js";

/**
 * @param {{ namespace?: string } | null | undefined} cmd
 * @returns {unknown}
 */
export function executionRouterV0(cmd) {
  if (!cmd || typeof cmd !== "object") return null;
  const ns = /** @type {{ namespace?: string }} */ (cmd).namespace;
  switch (ns) {
    case "LIGHT_ACTUATOR":
      return lightActuatorV0.apply(cmd);
    case "MEDIA_ACTUATOR":
      return mediaActuatorV0.apply(cmd);
    default:
      return null;
  }
}
