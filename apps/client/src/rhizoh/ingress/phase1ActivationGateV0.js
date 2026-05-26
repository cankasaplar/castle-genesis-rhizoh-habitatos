/**
 * Phase 1 activation — SINGLE SWITCH (SSOT).
 * No subsystem may read VITE_RHIZOH_PHASE1_SIGNAL elsewhere.
 * @see docs/RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md
 */

export const PHASE1_ACTIVATION_ENV_KEY_V0 = "VITE_RHIZOH_PHASE1_SIGNAL";

/**
 * Data-plane active only when this returns true (after checklist + ops READY).
 */
export function isDataPlaneActiveV0() {
  if (typeof import.meta !== "undefined" && import.meta.env?.[PHASE1_ACTIVATION_ENV_KEY_V0] === "1") {
    return true;
  }
  return false;
}

/** Ingress / UI remain inert while data-plane is off. */
export function isIngressRuntimeInertV0() {
  return !isDataPlaneActiveV0();
}
