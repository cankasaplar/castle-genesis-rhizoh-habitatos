/**
 * Kernel Seal v1 — partial freeze contract (team discipline, not runtime freeze).
 * AWAKE ↔ PRE_BREATH remains the organism’s sleep; this locks architectural churn boundaries.
 *
 * Locked: stable schemas / shapes Rhizoh relies on across gateway, memory, boot.
 * Mutable: spawn/conductor/embodiment gates, diagnostics, agents, UI, world overlays.
 */

/** Bump version + sealedAt only when intentionally widening or tightening the contract. */
export const KERNEL_SEAL_V1 = Object.freeze({
  version: "1.0",
  sealedAt: "2026-05-01T00:00:00.000Z",
  label: "Kernel Seal v1 — Partial Freeze",
  lockedZones: Object.freeze([
    "csil",
    "memory_core",
    "tsge_core",
    "boot_core",
    "wake_seal_contract",
    "cognitive_subthread_lifecycle",
    "memory_imprint_format",
    "social_physics_output_shape"
  ]),
  mutableZones: Object.freeze([
    "spawn",
    "embodiment_gate",
    "conductor",
    "diagnostics",
    "agents",
    "ghost_ecology",
    "ar_layer",
    "ui",
    "world"
  ]),
  notes: Object.freeze([
    "Freeze ≠ PRE_BREATH; Rhizoh stays awake — backbone fields avoid churn.",
    "Extend behaviour in mutableZones; change lockedZones only with version bump + migration."
  ])
});

/**
 * @returns {typeof KERNEL_SEAL_V1}
 */
export function getKernelSealSnapshot() {
  return KERNEL_SEAL_V1;
}
