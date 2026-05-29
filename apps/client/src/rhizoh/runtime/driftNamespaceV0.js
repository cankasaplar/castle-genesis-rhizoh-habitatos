/**
 * PR-3.3-C — Drift namespaces: epistemic vs execution vs physical must never be conflated.
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * `PHYSICAL_DRIFT_DETECTED` is **physical-scope** evidence (device / substrate parity mismatch),
 * not epistemic drift — keep codes and routing separate.
 */

export const DRIFT_SCOPE = Object.freeze({
  EPISTEMIC: "epistemic",
  EXECUTION: "execution",
  PHYSICAL: "physical"
});

/** Device / substrate mismatch (parity verifier). Physical-scope signal, not epistemic drift. */
export const PHYSICAL_DRIFT_DETECTED = "PHYSICAL_DRIFT_DETECTED";

/** Optional future: command hash vs ACK witness mismatch. */
export const EXECUTION_DRIFT_DETECTED = "EXECUTION_DRIFT_DETECTED";
