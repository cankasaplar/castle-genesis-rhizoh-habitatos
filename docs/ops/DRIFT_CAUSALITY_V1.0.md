# Drift Causality Layer (DCL) v1.0

**RDOL:** *what* drift exists. **DCL:** *why* it occurs.

Stack: `… → RDOL → DCL → human`

---

## Causal domains

| Domain | Question |
|--------|----------|
| **propagation** | Why does distortion amplify? |
| **EDPL pacing** | Why does temporal compression shift perception? |
| **DPUB uncertainty** | Why does closure illusion emerge? |
| **CAB / ECL** | Why does authority misread happen? |

Each domain exports `causes[]`, `drivers`, and `contributesToShapes` (RDOL taxonomy linkage).

---

## Shape causality links

For each `misapprehensionShapeCatalog` entry:

- `primaryCauses` — `domain:top_cause` strings
- `contributingDomains` — structured cross-layer contributors

---

## Invariants

- Causality is **hypothesis**, not blame assignment
- DCL does not remediate or execute
- No cause implies `execution_approval`

---

## Export

`buildUnifiedStateNarrativeV0()` → `driftCausality`

```bash
npm run ci:drift-causality-gate
```

Module: `driftCausalityLayerV0.js`

---

*DCL v1.0 — completes the observe → explain loop for operational drift.*
