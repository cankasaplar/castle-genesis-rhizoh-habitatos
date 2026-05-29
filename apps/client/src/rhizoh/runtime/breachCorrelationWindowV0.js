/**
 * Active breach correlation window — shared state only (no synthesis, no log).
 */

let correlationCounterV0 = 0;
/** @type {{ id: string, label: string, openedAtMs: number } | null} */
let activeCorrelationWindowV0 = null;

/**
 * @param {{ label?: string }} [opts]
 * @returns {string}
 */
export function beginBreachCorrelationWindowV0(opts = {}) {
  const id = `corr_${Date.now()}_${++correlationCounterV0}`;
  activeCorrelationWindowV0 = {
    id,
    label: String(opts.label || "incident"),
    openedAtMs: Date.now()
  };
  return id;
}

export function endBreachCorrelationWindowV0() {
  const ended = activeCorrelationWindowV0?.id ?? null;
  activeCorrelationWindowV0 = null;
  return ended;
}

/** @returns {string | null} */
export function getActiveCorrelationIdV0() {
  return activeCorrelationWindowV0?.id ?? null;
}

/** Test-only */
export function clearBreachCorrelationWindowForTestV0() {
  activeCorrelationWindowV0 = null;
  correlationCounterV0 = 0;
}
