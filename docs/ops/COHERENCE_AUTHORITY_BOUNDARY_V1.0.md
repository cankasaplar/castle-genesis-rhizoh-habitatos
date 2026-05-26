# Coherence Authority Boundary (CAB) v1.0

**Gap after ECL:** Coherence becomes a high-level authority *signal* — without CAB, operators infer truth, safety, or execution from `coherent`.

| Layer | Question |
|-------|----------|
| **ECL** | Which output is *coherent* across layers? |
| **CAB** | Does *coherent* mean true / executable / policy override? **No.** |

---

## Hard negations

| Negation | Meaning |
|----------|---------|
| `coherent_is_not_executable_truth` | Alignment ≠ go-ahead |
| `coherent_is_not_policy_override` | Cannot change GCL / rollout from ECL |
| `coherent_is_not_reality_claim` | Coherence ≠ ground truth over RAW |

---

## Authority drift (monitored)

| Misread | Class |
|---------|--------|
| UX: “system said it so it’s true” | `ux_coherent_implies_truth` |
| Ops: “coherent = safe” | `ops_coherent_implies_safe` |
| Robotics: “coherent = move” | `robotics_coherent_implies_move` |

CAB surfaces disclaimers; does not upgrade `can_execute`.

---

## Stack

```
RAW → … → ASGL → ACRL → ECL → CAB → human_or_external_ops
```

---

## Export

`buildUnifiedStateNarrativeV0()` → `coherenceAuthorityBoundary`

```bash
npm run ci:coherence-authority-gate
```

Module: `coherenceAuthorityBoundaryV0.js`

---

**DLGL** (`DECISION_LATENCY_GOVERNANCE_V1.0.md`) compresses human decision latency after CAB without bypassing negations.

---

*CAB v1.0 — epistemic binding without authority collapse.*
