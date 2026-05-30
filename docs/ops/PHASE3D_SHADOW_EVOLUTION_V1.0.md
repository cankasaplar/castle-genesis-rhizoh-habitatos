# Phase 3D Shadow — Evolution Modes v1.0

**Status:** FROZEN (design) · **Question:** atlas only vs human-approved semi-actuator proposals?

---

## Short answer

**Both are valid — as phases, not as a fork.**

| Phase | Mode | What it is |
|-------|------|------------|
| **Now → mature shadow** | **Observing atlas** | Rich maps, no closure obligation |
| **Mature shadow → control change** | **Semi-actuator proposal system** | Ranked, bounded **proposals** — human closes the loop |

Shadow should **not** jump to semi-actuator before the atlas is stable and reviewed.  
Shadow should **not** stay atlas-only forever if proposals never get a queue and a cadence.

---

## Mode A — Observing atlas (default today)

**Purpose:** See the system — attractors, trajectories, perturbation field — without steering.

| ✔ | ✘ |
|---|-----|
| Internal representation growth | Live gate mutation |
| Export for ops / audit | Auto-apply thresholds |
| Twin-risk monitoring (over-stabilization vs bloat) | “Interpretation language” in product |

**Stays atlas-only when:** sample volume low, no weekly review, or firewall recently introduced (calibration period).

---

## Mode B — Human-approved semi-actuator (allowed evolution)

**Purpose:** Close the governance gap — shadow **suggests**, human **actuates**, control **only** changes via versioned config.

“Semi-actuator” means:

| Semi-actuator IS | Semi-actuator IS NOT |
|------------------|----------------------|
| Proposal queue (`pending_human` → `approved` / `rejected`) | Runtime reflex adapter |
| Ranked deltas: e.g. `entropyLimit -0.05`, `divergenceMid +0.02` | Attractor score → `executeOrContain` |
| Evidence bundle: export id + trajectory slice + stressor rank | ML policy network |
| Re-run **control harness** after approve | Same-request feedback |

```text
atlas (observe) → proposal (suggest) → human (approve) → config bump (actuate) → control harness (verify)
```

This preserves the firewall: observation still **never** feeds `phase3ExecutionGate` directly.

---

## Decision rule (when to evolve)

| Signal | Action |
|--------|--------|
| ≥ N weekly exports, stable schema, ops review happening | Eligible for **proposal queue** (Mode B) |
| Proposal queue always empty / never reviewed | Stay Mode A; fix **process**, not coupling |
| Control pass ↑ but shadow `optimalDrift` ↑ | Mode B **needed** — over-stabilization watch |
| Legal / counsel wants no automated suggestions | Stay Mode A explicitly |

---

## What must never happen (either mode)

- Shadow → live gateway turn import  
- `phase3dObservationGate` → deploy decision  
- Proposal auto-approve on confidence / attractor proximity  
- Narrative “system should relax because atlas says so” in SSOT  

---

## Recommendation for Rhizoh

1. **Keep shadow as observing atlas** through controlled exposure + shadow sampling.  
2. **Proposal queue v0** + **governance state machine** — frozen: [`PHASE3D_PROPOSAL_QUEUE_V0.md`](PHASE3D_PROPOSAL_QUEUE_V0.md), [`PHASE3D_HUMAN_APPROVAL_GOVERNANCE_V1.0.md`](PHASE3D_HUMAN_APPROVAL_GOVERNANCE_V1.0.md).  
3. **Activate Mode B** only when ops cadence exists; otherwise Mode B becomes the “ineffective atlas” failure mode in another costume.

---

## Related

- [`PHASE3D_SHADOW_LEARNING_BOUNDARY_V1.0.md`](PHASE3D_SHADOW_LEARNING_BOUNDARY_V1.0.md)  
- [`PHASE3_CONTROL_OBSERVATION_FIREWALL_V1.0.md`](PHASE3_CONTROL_OBSERVATION_FIREWALL_V1.0.md)  
- Phase 3.1 roadmap: adaptive gating **via approved config only**

---

*Shadow evolution v1.0 — atlas first; semi-actuator proposals second; full actuator never in shadow.*
