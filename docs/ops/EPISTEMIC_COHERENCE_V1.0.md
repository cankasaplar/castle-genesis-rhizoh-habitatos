# Epistemic Coherence Layer (ECL) v1.0

**Gap after ASGL + ACRL:** Semantic Permission Algebra is correct but **fragmented** — same action can be “true” on three axes at once.

| Risk | Symptom |
|------|---------|
| Developer cognitive overload | Right answer spread across 4+ layers |
| False safety perception | ACRL `blocked` → “system is safe” |
| Hidden semantic conflicts | ASGL ok · ACRL review · World blocked · UX mismatch |

---

## Semantic Permission Algebra

| Space | Layer | Question |
|-------|-------|----------|
| Meaning | **ASGL** | What does the action *mean*? |
| Permission | **ACRL** | Valid in *this* context only? |
| Control | **GCL** | Resource constraint |
| World | **ASL** | Robotics / Spiral execution |
| **Coherence** | **ECL** | One *coherent system truth* |

---

## ECL components

1. **Cross-layer contradiction detection** — e.g. ASGL allowed + ACRL blocked → `semantic_ok_permission_blocked`
2. **System coherence score** — `coherent` \| `fragmented` \| `contradictory` (0–1)
3. **UX compression** — `coherent_decision_surface` — five layers → one operator headline + `operatorDecision`

---

## Export

`buildUnifiedStateNarrativeV0()` → `epistemicCoherence` (after `actionContextResolution`).

```bash
npm run ci:epistemic-coherence-gate
```

Module: `epistemicCoherenceLayerV0.js`

---

## Invariant

**ACRL `blocked` does not imply global safety** — ECL surfaces `false_safety_perception` when needed.

---

**CAB** (`COHERENCE_AUTHORITY_BOUNDARY_V1.0.md`) caps ECL: `coherent` ≠ executable truth / policy override / reality claim.

---

*ECL v1.0 — binds multi-world semantic compiler + execution firewall into one decision surface.*
