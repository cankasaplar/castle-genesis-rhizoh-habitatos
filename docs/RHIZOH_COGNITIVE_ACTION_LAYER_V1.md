# Rhizoh Cognitive Action Layer v1

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY` — **Interactive Epistemic Simulator**; not execution.

**Prerequisites:** [`RHIZOH_COGNITIVE_VISUALIZATION_BINDING_V1.md`](RHIZOH_COGNITIVE_VISUALIZATION_BINDING_V1.md) · [`RHIZOH_SECURITY_BOUNDARY_V1.md`](RHIZOH_SECURITY_BOUNDARY_V1.md) (DR-01, DR-02, CAL-01)

**Code:** `apps/client/src/rhizoh/ticket/cognitiveActionLayerV0.js`

---

## 0. SSOT sentences (locked)

> **Suggestion space is causally inert.**

> **Drift is a perception stream, not a control channel.**

> **Admission is the only control channel in Rhizoh.**

Rhizoh is a **Causal-perception separated epistemic runtime with single-authority mutation gate**.

---

## 1. Three-layer runtime (canonical)

| Layer | Question | Components | Mutates truth? |
|-------|----------|------------|----------------|
| **Epistemic** | What is happening? | TraceGraph · Drift · Reason Ontology | No — thinks, does not change |
| **Authority** | What will happen? | Admission · CubeState commit · executionClass gate | Yes — reality created here only |
| **Temporal** | What happened? | REC · Tombstone · Residue compression | Batch only — writes memory, not past |

---

## 2. What CAL is

CAL is not UI. CAL is **interaction-based epistemic exploration** — the user traverses the system's thought topology without speaking to it or commanding it.

| CAL is | CAL is not |
|--------|------------|
| Interactive epistemic simulator | Chat interface |
| State proposal generator (read-only) | Mutation trigger |
| Causal visibility on demand | Control panel |

**User does not talk to the system. User walks the system's thought topology.**

---

## 3. Invariant CAL-01 — Exploration is causally inert

> **CAL interactions SHALL NOT mutate CubeState, admission, trace truth, or tombstone state.**

| Allowed | Forbidden |
|---------|-----------|
| `read_only` exploration packets | `mutate_l1` / `mutate_l2` from CAL |
| Lineage / cause-chain fetch | Auto admission from CAL click |
| State proposal views | DR-02 violating action text |

**Completion of DR-02:** suggestion space cannot leak into execution space.

```text
drift ↑ · alert created · feature vector changed
  → nothing crosses into execution space without admission gate
```

---

## 4. Interaction model

### 4.1 Trigger types

| Interaction | User action | CAL output |
|-------------|-------------|------------|
| `category_spike_click` | Tap SC/QUOTA/REC density field | Category lineage + drift cause chain |
| `alert_packet_click` | Tap AlertPacket | Alert context + related mutations |
| `rec_epoch_click` | Tap REC waveform band | Tombstone queue + residue window |
| `audit_chain_click` | Tap ticketId → intentId → mutationId | Full audit chain expansion |

### 4.2 Exploration packet shape

```json
{
  "schema": "castle.rhizoh.epistemic_exploration.v0",
  "interactionType": "category_spike_click",
  "targetCategory": "SC",
  "executionClass": "read_only",
  "causallyInert": true,
  "ticketLineage": [],
  "admissionHistory": [],
  "driftCauseChain": [],
  "recInfluenceWindow": { "epochId": "rec_core_morning", "pendingCount": 3 },
  "stateProposal": {
    "kind": "exploration_view",
    "summary": "sc_frequency_increased_in_window"
  }
}
```

`stateProposal` is a **view model** — never an execution directive.

---

## 5. Pipeline position

```text
cognitiveVisualizationBindingV0 (epistemic projection compiler)
  → UI renders density field / AlertPacket / REC waveform
  → user interaction
  → cognitiveActionLayerV0.exploreEpistemicInteractionV0(...)
  → EpistemicExplorationPacket (read_only)
  → (never) admissionCubeCommitV0
```

---

## 6. Architectural class

Rhizoh at this level is a **Perception Operating System**:

- Does not process events as commands
- Produces **how events are perceived**
- Shows **state production process**, not just state

| Threshold crossed | System class |
|-------------------|----------------|
| 1 | Event System (log → graph) |
| 2 | Graph System (graph → memory) |
| 3 | Memory System (memory → reasoning) |
| **Now** | **Perception OS** (reasoning → visibility) |
| **Next (CAL)** | **Interactive epistemic simulator** |

---

## 7. Changelog

| Date | Change |
|------|--------|
| 2026-06-19 | v1.0 — CAL-01 · interaction model · exploration packet |
