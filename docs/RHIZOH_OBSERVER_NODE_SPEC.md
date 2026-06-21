# Rhizoh Observer Epistemic Lens v0

**Status:** DRAFT · `RESEARCH-ONLY`  
**Correction:** Observer is **not** a causal graph vertex.

---

## Model

```
Observer ≠ vertex
Observer = projection function over graph (epistemic lens)
```

| If you add observer as node | If you use projection |
|----------------------------|------------------------|
| Agency creep begins | Stays "viewing layer" |
| Graph topology mutates | Graph immutable |
| Non-agentic claim weakens | Non-agentic claim holds |

---

## Validated observer (revised)

The human is in the **co-observational field** as:

- **Epistemic lens** — filters what surfaces are emphasized (explorer / research / signal)
- **Observation plane writer** — `observe()` → trace only
- **Not** a WAL actor · **not** `epi_id` · **not** causal vertex

---

## API

```javascript
const lens = window.__rhizoh.observerLens.project();
// { isVertex: false, isAgent: false, perceptionMode, weights, causalSummary, observerEcho }
```

---

## Three-plane placement

| Plane | Observer role |
|-------|----------------|
| A Causal | **No write** |
| B Observation | Trace + lens weights |
| C Narrative | Derived copy |

---

## Related

- [`RHIZOH_READ_ONLY_HOOK_V0.md`](RHIZOH_READ_ONLY_HOOK_V0.md)
- [`RHIZOH_VISITOR_EPISTEMIC_TRACE_V0.md`](RHIZOH_VISITOR_EPISTEMIC_TRACE_V0.md)
