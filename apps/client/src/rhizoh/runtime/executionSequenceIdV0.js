/**
 * PR-3.4 — Deterministic execution sequence id (actuator ordering / replay witness).
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * Pure function: same inputs → same id for a given logical tick (replay-stable when tick is in the log).
 */

/**
 * @param {{ lane?: string, logicalTick: number, actuator?: string, executionId?: string }} io
 * @returns {string}
 */
export function deriveExecutionSequenceIdV0(io) {
  const lane = String(io.lane ?? "unknown");
  const tick = typeof io.logicalTick === "number" && Number.isFinite(io.logicalTick) ? Math.max(0, Math.floor(io.logicalTick)) : 0;
  const act = String(io.actuator ?? "unknown");
  const ex = String(io.executionId ?? "");
  const basis = `${lane}|${tick.toString(16).padStart(8, "0")}|${act}|${ex}`;
  let h = 5381;
  for (let i = 0; i < basis.length; i++) {
    h = ((h << 5) + h) ^ basis.charCodeAt(i);
  }
  return `esq_${(h >>> 0).toString(16).padStart(8, "0")}_${tick.toString(16).padStart(8, "0")}`;
}
