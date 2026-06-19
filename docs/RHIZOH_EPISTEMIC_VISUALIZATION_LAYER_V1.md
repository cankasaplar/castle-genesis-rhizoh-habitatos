# Rhizoh Epistemic Visualization Layer v1

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY` — **Cognitive Transparency Interface**; not execution.

**Prerequisites:** [`RHIZOH_COGNITIVE_VISUALIZATION_BINDING_V1.md`](RHIZOH_COGNITIVE_VISUALIZATION_BINDING_V1.md) · [`RHIZOH_DRIFT_ANOMALY_DETECTOR_V1.md`](RHIZOH_DRIFT_ANOMALY_DETECTOR_V1.md) · [`RHIZOH_LEARNING_FEATURE_VECTOR_EXPORT_V1.md`](RHIZOH_LEARNING_FEATURE_VECTOR_EXPORT_V1.md)

---

## 0. SSOT sentences (locked)

> **Drift is a perception stream, not a control channel.**

> **Admission is the only control channel in Rhizoh.**

> **UI is the epistemic visualization layer — not an execution shortcut.**

The user sees not only outcomes but **why the system thought what it thought**.

---

## 1. Three planes (Cognitive Transparency Interface)

| Plane | Epistemic role | UI panel | May mutate? |
|-------|----------------|----------|-------------|
| **Interpretation** | Drift = commentary | Suggest-only · Drift Space | No |
| **Truth** | Admission = reality | Authority Gate | Yes (gated) |
| **Memory** | TraceGraph = past | REC Cycle · Temporal Anatomy | Batch only |

| Concept | Time |
|---------|------|
| Drift | Now (perception) |
| CubeState | Now (truth snapshot) |
| TraceGraph | Past (immutable) |
| REC | Epoch accounting |

---

## 2. Alert flow — hybrid

| Mode | Use | Content |
|------|-----|---------|
| **PUSH** | Drift / AlertPacket | `suggest` only · rate-limited |
| **PULL** | Admission context | Proposals · pending commits |

System *shouts* (drift) but does not *speak authority* (no mutation on PUSH).

**Binding:** [`RHIZOH_COGNITIVE_VISUALIZATION_BINDING_V1.md`](RHIZOH_COGNITIVE_VISUALIZATION_BINDING_V1.md) · `cognitiveVisualizationBindingV0.js`

---

## 3. DR-01 + DR-02 in UI

- No single panel merging Drift actions + Admission mutate buttons (UI-01).
- AlertPacket text = category + delta only (DR-02).
- Epistemic feature artifacts ≠ policy signals.

---

## 4. Changelog

| Date | Change |
|------|--------|
| 2026-06-19 | v1.1 — Cognitive Transparency Interface · hybrid alert flow · binding link |
| 2026-06-19 | v1.0 — epistemic visualization layer scaffold |
