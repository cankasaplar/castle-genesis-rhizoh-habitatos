/**
 * User Agent Skeleton v0.1 — non-autonomous stance (contract only).
 * No self-spawn, no ecology write-back; perception may attach read-only shadows later.
 */

export const USER_AGENT_SKELETON_V1 = Object.freeze({
  contractVersion: "0.1",
  autonomyTier: "none",
  selfSpawn: false,
  ecologyMutation: false,
  ecologyWriteBack: false,
  ecologyPerceptionMode: "read_only_shadow",
  notes: Object.freeze([
    "Perception is sliced from diagnostics.ghostEcology — never mutates ecology kernels.",
    "Activation ladder later: passive → reactive → semi-autonomous (not enabled here)."
  ])
});
