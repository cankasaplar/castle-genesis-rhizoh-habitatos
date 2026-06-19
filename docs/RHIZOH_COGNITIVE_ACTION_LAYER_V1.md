# Rhizoh Cognitive Action Layer v1

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY` — **Epistemic Traversal Layer**; not UI.

**Prerequisites:** [`RHIZOH_CAUSAL_NAVIGATION_RUNTIME_V1.md`](RHIZOH_CAUSAL_NAVIGATION_RUNTIME_V1.md) · [`RHIZOH_COGNITIVE_VISUALIZATION_BINDING_V1.md`](RHIZOH_COGNITIVE_VISUALIZATION_BINDING_V1.md) · [`RHIZOH_SECURITY_BOUNDARY_V1.md`](RHIZOH_SECURITY_BOUNDARY_V1.md) (DR-01, DR-02, CAL-01)

**Code:** `apps/client/src/rhizoh/ticket/cognitiveActionLayerV0.js`

---

## 0. SSOT sentences (locked)

> **CAL is the Epistemic Traversal Layer — user walks the causality graph, not data, state, or decisions.**

> **Suggestion space is causally inert.**

> **perception ≠ interaction ≠ execution**

User does not see data — user **navigates how causality formed**.

---

## 1. Four-axis runtime — Traversal field (axis 4)

| Axis | Field | Question |
|------|-------|----------|
| Epistemic | Reason | What is the system thinking? |
| Authority | Commit | What becomes real? |
| Temporal | Memory | How is past remembered? |
| **Traversal** | **CAL** | **How does the user move inside?** |

Full model: [`RHIZOH_CAUSAL_NAVIGATION_RUNTIME_V1.md`](RHIZOH_CAUSAL_NAVIGATION_RUNTIME_V1.md)

---

## 2. CAL vs Binding (critical split)

| Layer | Direction | Verbs | Module |
|-------|-----------|-------|--------|
| **Binding** | state → perception | görmek | `cognitiveVisualizationBindingV0` |
| **CAL** | perception → traversal | yürümek | `cognitiveActionLayerV0` |
| **Admission** | authority → reality | onaylamak | `admissionCubeCommitV0` |

CAL does not explain the system. CAL does not change the system. CAL **walks** the system.

> User gains **viewpoint**, not **power**.

---

## 3. Invariant CAL-01 — Exploration is causally inert

> **CAL interactions SHALL NOT mutate CubeState, admission, trace truth, or tombstone state.**

| Allowed | Forbidden |
|---------|-----------|
| `read_only` exploration packets | `mutate_l1` / `mutate_l2` from CAL |
| Lineage / cause-chain fetch | Auto admission from CAL click |
| `exploration_view` proposals | DR-02 violating prescriptions |

---

## 4. Interaction model

| Interaction | User action | CAL output |
|-------------|-------------|------------|
| `category_spike_click` | Tap SC/QUOTA/REC density | Lineage + drift cause chain |
| `alert_packet_click` | Tap AlertPacket | Alert context + mutations |
| `rec_epoch_click` | Tap REC waveform | Tombstone + residue window |
| `audit_chain_click` | Tap audit link | Chain expansion |

---

## 5. Exploration packet

```json
{
  "schema": "castle.rhizoh.epistemic_exploration.v0",
  "executionClass": "read_only",
  "causallyInert": true,
  "ticketLineage": [],
  "driftCauseChain": [],
  "recInfluenceWindow": {},
  "stateProposal": { "kind": "exploration_view" }
}
```

---

## 6. Pipeline

```text
cognitiveVisualizationBindingV0  (görmek)
  → user interaction
  → cognitiveActionLayerV0       (yürümek)
  → EpistemicExplorationPacket
  → (never) admissionCubeCommitV0
```

---

## 7. Next: Cognitive UX Layer

[`RHIZOH_COGNITIVE_UX_LAYER_V1.md`](RHIZOH_COGNITIVE_UX_LAYER_V1.md) — gezer · görür · onaylar as unified consciousness-model UX.

---

## 8. Changelog

| Date | Change |
|------|--------|
| 2026-06-19 | v1.1 — CNR four-axis · traversal field · binding split |
| 2026-06-19 | v1.0 — CAL-01 · exploration packet |
