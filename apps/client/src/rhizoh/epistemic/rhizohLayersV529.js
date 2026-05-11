/**
 * RHIZOH vNext-529 — epistemik katman kimlikleri (L0–L13).
 * Akademik raporla hizalı isimlendirme; runtime’da yalnızca yönlendirme + ispat yükümlülükleri için kullanılır.
 */

export const RHIZOH_EPISTEMIC_LAYER = Object.freeze({
  L0: "L0",
  L1: "L1",
  L2: "L2",
  L3: "L3",
  L6: "L6",
  L7: "L7",
  L8: "L8",
  L9: "L9",
  L10: "L10",
  L11: "L11",
  L12: "L12",
  L13: "L13"
});

/** @type {Record<string, { title: string, proofSketch: string }>} */
export const RHIZOH_LAYER_PROOF_SKETCH = Object.freeze({
  [RHIZOH_EPISTEMIC_LAYER.L0]: {
    title: "Core physics integration",
    proofSketch: "Damped integration / energy bound (stability envelope)."
  },
  [RHIZOH_EPISTEMIC_LAYER.L1]: {
    title: "Spatial indexing",
    proofSketch: "Uniform hash family → collision rate bound under bucket load."
  },
  [RHIZOH_EPISTEMIC_LAYER.L2]: {
    title: "Agent decision core",
    proofSketch: "MDP / Bellman contraction → policy fixed point."
  },
  [RHIZOH_EPISTEMIC_LAYER.L3]: {
    title: "MMO presence & temporal coherence",
    proofSketch: "Dead reckoning + jitter budget τ."
  },
  [RHIZOH_EPISTEMIC_LAYER.L6]: {
    title: "Swarm field (coarse)",
    proofSketch: "Mean-field / N→∞ density limit."
  },
  [RHIZOH_EPISTEMIC_LAYER.L7]: {
    title: "Companion / pet ecology",
    proofSketch: "Bounded orbit + stage machine (SEED→GUARDIAN)."
  },
  [RHIZOH_EPISTEMIC_LAYER.L8]: {
    title: "City-scale diffusion & narrative substrate",
    proofSketch: "Diffusive state + bounded drift."
  },
  [RHIZOH_EPISTEMIC_LAYER.L9]: {
    title: "Event mesh / social liveness",
    proofSketch: "Petri / temporal logic: progress under fairness assumptions."
  },
  [RHIZOH_EPISTEMIC_LAYER.L10]: {
    title: "Intent orchestration (default)",
    proofSketch: "Intent router → tool hints + policy envelope."
  },
  [RHIZOH_EPISTEMIC_LAYER.L11]: {
    title: "Continuity & memory contract",
    proofSketch: "Authoritative continuity JSON; no ungrounded claims beyond it."
  },
  [RHIZOH_EPISTEMIC_LAYER.L12]: {
    title: "Sovereign runtime / policy SAT",
    proofSketch: "SMT soundness: SAT ⇒ ∃ model satisfying policy theory."
  },
  [RHIZOH_EPISTEMIC_LAYER.L13]: {
    title: "Robotics / sim-to-real bridge",
    proofSketch: "WGS84→ENU + constrained dynamics; sealed command envelope."
  }
});
