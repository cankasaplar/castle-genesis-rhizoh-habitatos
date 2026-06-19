# Rhizoh Cognitive UX Layer v1

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY` — **consciousness-model UX**; not execution.

**Prerequisites:** [`RHIZOH_CAUSAL_NAVIGATION_RUNTIME_V1.md`](RHIZOH_CAUSAL_NAVIGATION_RUNTIME_V1.md) · [`RHIZOH_EPISTEMIC_VISUALIZATION_LAYER_V1.md`](RHIZOH_EPISTEMIC_VISUALIZATION_LAYER_V1.md) · [`RHIZOH_COGNITIVE_ACTION_LAYER_V1.md`](RHIZOH_COGNITIVE_ACTION_LAYER_V1.md)

**Status:** v0 scaffold — `cognitiveUxLayerV0.js` + `RhizohCognitiveUxShellV0.jsx` wired.

**Code:** `apps/client/src/rhizoh/ticket/cognitiveUxLayerV0.js` · `cognitiveUxSpatialProjectionV0.js` · `RhizohCognitiveUxShellV0.jsx`

---

## 0. SSOT sentence

> **CUX unifies traverse · see · approve — without merging perception, interaction, or execution.**

The question is no longer technical alone:

**How should the experience feel like a consciousness model?**

---

## 1. Three user verbs (locked)

| Verb | Layer | User does | System does |
|------|-------|-----------|-------------|
| **Gezer** | CAL (Traversal) | Walk causality graph | Returns lineage · cause chain · REC window |
| **Görür** | Binding (Perception) | Observe density fields · alerts · vectors | Projects state → perception |
| **Onaylar** | Authority (Commit) | Explicit admission approval | Writes CubeState — only here |

User never receives hidden power from drift or traversal.

---

## 2. Panel composition (CUX)

```text
┌─────────────────────────────────────────────────────────┐
│  DRIFT SPACE (suggest-only)     │  REC TIME LAYER       │
│  density field · AlertPacket    │  06:44 / 18:44 wave   │
│  feature vector readout         │  tombstone envelope   │
├─────────────────────────────────┴───────────────────────┤
│  CAL TRAVERSAL (read_only)                            │
│  lineage · cause chain · audit chain expansion        │
├─────────────────────────────────────────────────────────┤
│  AUTHORITY GATE (human only)                          │
│  proposedCubeDelta · admission approve / reject       │
└─────────────────────────────────────────────────────────┘
```

Panels MUST remain visually and logically separated (CNR-01 / UI-01).

---

## 3. Consciousness-model design principles

| Principle | Implementation |
|-----------|----------------|
| No authority from drift | DR-01 · DR-02 · CAL-01 |
| Traversal ≠ mutation | CAL-01 · SC-01/SC-02 |
| Time is visible | REC waveform · tombstone depth |
| Causality is walkable | CAL lineage + cause chain |
| Reality requires explicit gate | Admission panel only |

---

## 4. Wire map (v0)

| Source | Target panel | Flow |
|--------|--------------|------|
| `pushPerceptionStreamV0` | Drift Space | PUSH · rate-limited |
| `pullAuthorityContextV0` | Authority Gate | PULL · audit-safe |
| `buildRecTimeLayerV0` | REC Time Layer | read-only |
| `onUserTraverseV0` | CAL Traversal | read_only · `rhizoh:cognitive-ux-traversal-v0` |
| `bindCognitiveUxV0` | Full CUX shell | composite + CNR-01 guard |

**DevTools:** `window.__rhizoh.cognitiveUxSnapshot()` · `cognitiveUxTraverse(nodeId)` · `localStorage castle.cux.v0=1` (prod opt-in)

**nodeId conventions:** `category:SC` · `alert:<id>` · `rec:<epoch>` · `audit:<mutationId>` · `ticket:<ticketId>`

---

## 5. What CUX is not

| CUX is not | Why |
|------------|-----|
| Dashboard | Shows process, not KPIs alone |
| Control panel | No execution shortcut from drift |
| Log viewer | Traversable causality, not flat list |
| Chat UI | User walks topology; does not command |

---

## 6. Changelog

| Date | Change |
|------|--------|
| 2026-06-19 | v0.1 — CUX compositor + spatial projection + 4-panel shell + CAL pipeline wire |
| 2026-06-19 | v1.0 — CUX scaffold · three verbs · panel composition |
