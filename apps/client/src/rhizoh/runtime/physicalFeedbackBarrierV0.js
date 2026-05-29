/**
 * PR-3.3 — Physical feedback write barrier (constitutional sink control).
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * **Constitution:** Physical actuator state cannot mutate epistemic state.
 *
 * Without this separation, hardware failure (bulb offline, bridge timeout, color skew)
 * becomes epistemology driven by hardware failure — collapsing the architecture.
 *
 * ACK / device snapshots may only be written to explicitly allowed sinks. All other
 * targets must be rejected at routing time (survives refactors better than comments alone).
 */

/** Single-sentence law for docs / audits / agent context. */
export const PHYSICAL_FEEDBACK_CONSTITUTION_V0 =
  "Physical actuator state cannot mutate epistemic state.";

/** Positive allowlist: only these sink ids may receive physical ACK / device snapshots. */
export const ALLOWED_PHYSICAL_ACK_SINK_IDS = Object.freeze(["device_ack_log"]);

/** Negative catalog (documentation + static analysis hints); routing must never target these. */
export const FORBIDDEN_PHYSICAL_ACK_SINK_IDS = Object.freeze([
  "uiStore",
  "worldPresence",
  "continuity_memory",
  "epistemic_runtime"
]);

/**
 * @param {string} sinkId
 * @returns {{ ok: true } | { ok: false, code: "FEEDBACK_SINK_REJECTED", sinkId: string }}
 */
export function assertPhysicalAckSinkAllowedV0(sinkId) {
  const id = String(sinkId || "").trim();
  if (!id) return { ok: false, code: "FEEDBACK_SINK_REJECTED", sinkId: String(sinkId) };
  if (FORBIDDEN_PHYSICAL_ACK_SINK_IDS.includes(id)) {
    return { ok: false, code: "FEEDBACK_SINK_REJECTED", sinkId: id };
  }
  if (!ALLOWED_PHYSICAL_ACK_SINK_IDS.includes(id)) {
    return { ok: false, code: "FEEDBACK_SINK_REJECTED", sinkId: id };
  }
  return { ok: true };
}
