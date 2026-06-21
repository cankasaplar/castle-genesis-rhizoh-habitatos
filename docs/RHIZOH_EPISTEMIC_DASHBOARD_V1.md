# Rhizoh Epistemic Dashboard v1 (spec)

**Status:** DRAFT · `RESEARCH-ONLY` · **spec only** — UI not production  
**Purpose:** Explain the three layers humans cannot see today without console access.

---

## Problem

Rhizoh **knows itself as a system** (`epi_id_*`, causal graph, ledger) but does not yet **model the human as part of the field** in the UI.

Dashboard v1 = **3-layer explanation panel** for invited observers (read-only).

---

## Layer 1 — System identity (internal continuity)

| Field | Source |
|-------|--------|
| `epi_id_*` | `identityManifest.project()` |
| `continuityVerdict` | `read_only_projection` |
| `epistemicVerdict` | `same_subject` / drift / fork |
| Causal summary | node/edge counts |

**Label:** "What the system claims about itself"

---

## Layer 2 — Ontology translation (meaning)

Three epistemic coordinate systems:

| Surface | Role |
|---------|------|
| Map | Spatial causality projection |
| Chess | Temporal reasoning surface |
| Castle | Narrative coherence anchor |

**Label:** "What you are looking at"

---

## Layer 3 — Observer echo trace (you in the field)

| Field | Source |
|-------|--------|
| `visited_surfaces` | `visitorTrace.snapshot()` |
| `sessions` | cross-tab echo (localStorage) |
| `coherence_alignment` | 0–1 vs map/chess/castle |
| `return_vector` | `weak_identity_resonance` … `strong_return_echo` |

**Label:** "Your observation path — not memory, not agent identity"

---

## Console prototype (today)

```javascript
const m = window.__rhizoh.identityManifest.project();
const t = window.__rhizoh.visitorTrace.snapshot();
console.log({ system: m?.subjectId, you: t });
```

---

## v1 UI placement (future)

- Invite landing: partial (Why am I here + meaning layer) — **shipped**
- Post-enter strip: collapsible "Epistemic dashboard" on World tab
- Research mode: full 3-layer panel

---

## Related

- [`RHIZOH_OBSERVER_NODE_SPEC.md`](RHIZOH_OBSERVER_NODE_SPEC.md)
- [`RHIZOH_RETURN_BEHAVIOR_TRACE_V0.md`](RHIZOH_RETURN_BEHAVIOR_TRACE_V0.md)
