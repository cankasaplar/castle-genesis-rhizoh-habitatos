# Rhizoh Epistemic Return Field v0

**Status:** DRAFT · `RESEARCH-ONLY`  
**Merged with:** `observerLens` · `narrativePlane` · `visitorTrace`

---

## API

```javascript
window.__rhizoh.epistemicReturnField.evaluate(visitor);

// Example output (Mode B — Epistemic Familiarity)
{
  "familiarity": 0.62,
  "recognition": "pattern_only",
  "memory": false,
  "continuity": "statistical",
  "fingerprint": { ... },
  "returnLikelihood": 0.58,
  "stabilityIndex": 0.41
}
```

| Field | Meaning |
|-------|---------|
| `familiarity` | 0–1 pattern similarity vs statistical echo |
| `recognition` | `none` · `pattern_only` · `recurring_pattern` |
| `memory` | Always `false` |
| `continuity` | `none` or `statistical` |

---

## What this is NOT

- Not bidirectional coupling
- Not epistemic resonance (no `resonance_coefficient`)
- Not learning loop input
- Not identity update

Pattern echo in localStorage stores **statistical aggregates only** (`attention_pattern` centroid) — labeled `isPatternEcho: true`, `isMemory: false`.

---

## UX shift

| Before | After (familiarity ≥ 0.22) |
|--------|---------------------------|
| Anonymous observer | Recurring epistemic pattern |
| Interaction without continuity | Behavior shape recognized, not identity |

Narrative plane surfaces this via `observerPosture` and `youAreHere`.

---

## Console bundle

```javascript
const lens = window.__rhizoh.observerLens.project();
const narrative = window.__rhizoh.narrativePlane.build({ locale: "en" });
const returnField = window.__rhizoh.epistemicReturnField.evaluate();
```

`lens.returnField` and `lens.epistemicFingerprint` are always present.

---

## Related

- [`RHIZOH_EPISTEMIC_SOFT_IDENTITY_V0.md`](RHIZOH_EPISTEMIC_SOFT_IDENTITY_V0.md)
- [`RHIZOH_VISITOR_EPISTEMIC_TRACE_V0.md`](RHIZOH_VISITOR_EPISTEMIC_TRACE_V0.md)
