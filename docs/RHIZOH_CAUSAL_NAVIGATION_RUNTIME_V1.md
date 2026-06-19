# Rhizoh Causal Navigation Runtime v1

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY` — architectural SSOT for the ticket epistemic stack.

**Prerequisites:** [`RHIZOH_SECURITY_BOUNDARY_V1.md`](RHIZOH_SECURITY_BOUNDARY_V1.md) · [`RHIZOH_COGNITIVE_ACTION_LAYER_V1.md`](RHIZOH_COGNITIVE_ACTION_LAYER_V1.md) · [`RHIZOH_COGNITIVE_VISUALIZATION_BINDING_V1.md`](RHIZOH_COGNITIVE_VISUALIZATION_BINDING_V1.md)

**Code:** `apps/client/src/rhizoh/ticket/causalNavigationRuntimeV0.js`

---

## 0. SSOT sentence (locked)

> **Rhizoh is a permission-separated causal traversal runtime — epistemic topology becomes navigable space.**

> **perception ≠ interaction ≠ execution**

These three do not convert into each other, trigger each other, or bypass each other.

---

## 1. What Rhizoh is (and is not)

| Rhizoh is | Rhizoh is not |
|-----------|---------------|
| **Causal Navigation Runtime (CNR)** | UI framework |
| Permission-separated epistemic runtime | AI system (decision maker) |
| Navigable causality substrate | Graph engine alone |
| Single-authority mutation gate | Auto-executing suggestion loop |

---

## 2. Four-axis runtime (canonical)

| Axis | Field | Question | Components | Mutates truth? |
|------|-------|----------|------------|----------------|
| **1. Epistemic** | Reason | What is the system thinking? | TraceGraph · Drift · Reason Ontology · Feature vectors | No |
| **2. Authority** | Commit | What becomes real? | Admission Engine · CubeState commit · executionClass gate | Yes — only here |
| **3. Temporal** | Memory | How is past remembered? | REC · Tombstone · Causal residue | Batch only |
| **4. Traversal** | CAL | How does the user move inside? | Lineage expansion · Cause-chain navigation · Interaction mapping | No — causally inert |

```text
Epistemic   → “sistem ne düşünüyor”
Authority   → “sistem neyi gerçek yapıyor”
Temporal    → “sistem geçmişi nasıl hatırlıyor”
Traversal   → “kullanıcı sistemin içinde nasıl dolaşıyor”
```

---

## 3. Triple separation (the lock)

| Mode | Layer | Module | Direction |
|------|-------|--------|-----------|
| **Perception** | Binding | `cognitiveVisualizationBindingV0` | state → perception |
| **Interaction** | CAL | `cognitiveActionLayerV0` | perception → traversal |
| **Execution** | Admission | `admissionCubeCommitV0` | authority → CubeState |

```text
Binding  = görmek   (render · projection · field mapping)
CAL      = yürümek  (click · expand · lineage walk · causal zoom)
Admission = onaylamak (mutate_l1/l2 · single write gate)
```

---

## 4. Evolution ladder

| Stage | Class | Capability |
|-------|-------|------------|
| 1 | Event System | log → graph |
| 2 | Graph System | graph → memory |
| 3 | Memory System | memory → reasoning |
| 4 | Perception OS | reasoning → visibility |
| **5 (now)** | **Causal Navigation Runtime** | topology → navigable space |
| 6 (next) | Cognitive UX Layer | traverse · see · approve as consciousness model |

---

## 5. What Rhizoh shows (design thesis)

| Generation | Behavior |
|------------|----------|
| Classic | Show data |
| Advanced | Explain data |
| **Rhizoh** | Make **how data came to be** traversable |

CAL does not explain the system. CAL does not change the system. CAL **walks** the system.

> User gains **viewpoint**, not **power**.

---

## 6. Safety barriers (why CAL is a safe epistemic sandbox)

| Barrier | Effect |
|---------|--------|
| **SC-01 / SC-02** | No traversal produces mutation |
| **DR-01 / DR-02** | Suggestion space cannot contain authority |
| **CAL-01** | Suggestion space is causally inert |
| **Admission isolation** | Single write gate |

Combined: **system cannot hallucinate authority**.

---

## 7. Invariant summary

| ID | Rule |
|----|------|
| SC-01 | Reconcile proposes; does not write CubeState |
| SC-02 | Admission is sole CubeState writer |
| DR-01 | Drift is perception stream, not control channel |
| DR-02 | Suggestions = categories and deltas only |
| CAL-01 | Traversal is read_only and causally inert |
| CNR-01 | perception ≠ interaction ≠ execution |

---

## 8. Pipeline (full stack)

```text
MutationRecord
  → Live Index (measurement)
  → Drift / AlertPacket (perception stream)
  → cognitiveVisualizationBindingV0 (state → perception)
  → cognitiveActionLayerV0 (perception → traversal)
  → admissionCubeCommitV0 (authority → reality)  [human gate only]
  → REC cycle (temporal accounting)
```

---

## 9. Next evolution

See [`RHIZOH_COGNITIVE_UX_LAYER_V1.md`](RHIZOH_COGNITIVE_UX_LAYER_V1.md) — CAL + Visualization + Admission as unified consciousness-model UX (CUX).

---

## 10. Changelog

| Date | Change |
|------|--------|
| 2026-06-19 | v1.0 — CNR four-axis model · triple separation · CUX pointer |
