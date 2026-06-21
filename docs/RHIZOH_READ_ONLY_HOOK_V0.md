# Rhizoh Read-Only Hook v0 — Three-Plane Model

**Status:** DRAFT · `RESEARCH-ONLY`  
**Academic spine:** *A system can preserve identity continuity without attributing causal agency to its observers.*

---

## Three planes

### A) Causal Plane — immutable

| Component | Role |
|-----------|------|
| `causalMap` | Event-sourced why-graph |
| `identityLifecycle` | Container (not observer-written) |
| `epistemicIdentity` | Derived `epi_id_*` |
| event→graph bridge | Sealed paths |

**Rule:** Observer events **never** write here.

### B) Observation Plane — shadow writable, isolated

Observer enters as **epistemic lens** (projection), **not** as causal graph vertex.

Writable sinks (only):

- `observerTrace` — session perception log
- `visitorEpistemicTrace` — echo aggregate (not memory)
- `epistemicTelemetry` — intensity / focus metadata

Examples: map hover · chess view · panel open · zoom/pan · media play

### C) Narrative Plane — derived UI only

- "You are here"
- "System is stable"
- "Map exploration depth: 0.42"

**Rule:** 100% derived from A + B — never authoritative.

---

## Observer ≠ vertex

| Wrong | Right |
|-------|-------|
| Shadow node in causal graph | **Epistemic lens** — projection function over graph |
| Observer as agent | Observer as **graph filter** |

```javascript
window.__rhizoh.observerLens.project(causalMap)
// isVertex: false
```

---

## Read-only hook API

```javascript
window.__rhizoh.observe({
  type: "map_hover",
  target: "pin_42",
  meta: { focus: 0.2, surface: "map" }
});

window.__rhizoh.observerTrace.snapshot();
window.__rhizoh.narrativePlane.build({ locale: "en" });
```

**Mandatory rule:**

```
observe() → NEVER → causalMap.write()
observe() → ONLY  → observerTrace.append()
```

---

## Hard boundary (non-agentic claim depends on this)

`observerTrace` **must be excluded from:**

- learning loops
- identity updates
- causal compression
- identity event log
- WAL seal chain

CI: `npm run ops:validate-observer-trace-boundary-v0`

If observer trace becomes training/adaptation input → system becomes agent → **non-agentic claim falls**.

---

## User influence (3rd order)

| Layer | Observer influence |
|-------|-------------------|
| Causal graph | ❌ |
| Identity lifecycle | ❌ |
| UI heatmap / attention / narrative | ✔ derived |

> *System does not change, but system becomes more readable through the observer.*

---

## Runtime

| Module | Plane |
|--------|-------|
| `observerReadOnlyHookV0.js` | B |
| `visitorEpistemicTraceV0.js` | B (echo) |
| `observerEpistemicLensV0.js` | B→read A (+ fingerprint + return field) |
| `epistemicReturnFieldV0.js` | B (statistical familiarity) |
| `visitorEpistemicFingerprintV0.js` | B (reconstruction) |
| `narrativePlaneProjectionV0.js` | C |

---

## Related

- [`RHIZOH_OBSERVER_NODE_SPEC.md`](RHIZOH_OBSERVER_NODE_SPEC.md) (lens, not node)
- [`RHIZOH_EPISTEMIC_DASHBOARD_V1.md`](RHIZOH_EPISTEMIC_DASHBOARD_V1.md)
- [`academic/RHIZOH_RESEARCH_PREPRINT_V1.md`](academic/RHIZOH_RESEARCH_PREPRINT_V1.md)
