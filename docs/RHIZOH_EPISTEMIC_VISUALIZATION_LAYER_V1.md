# Rhizoh Epistemic Visualization Layer v1

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY` — UI is not control surface; it is perception projection.

**Prerequisites:** [`RHIZOH_TICKET_NETWORK_SCHEMA_V1.md`](RHIZOH_TICKET_NETWORK_SCHEMA_V1.md) · [`RHIZOH_DRIFT_ANOMALY_DETECTOR_V1.md`](RHIZOH_DRIFT_ANOMALY_DETECTOR_V1.md) · [`RHIZOH_LEARNING_FEATURE_VECTOR_EXPORT_V1.md`](RHIZOH_LEARNING_FEATURE_VECTOR_EXPORT_V1.md)

---

## 0. SSOT sentence

> **UI is the epistemic visualization layer — not an execution shortcut.**

Three planes must remain visually and logically separated:

| Plane | Role | UI panel |
|-------|------|----------|
| **Truth** | CubeState | Admission approval (human gate only) |
| **Memory** | TraceGraph | REC cycle · tombstone · residue view |
| **Interpretation** | Drift + Reconcile | Suggest-only signals · AlertPacket |

---

## 1. Nervous network wire (planned)

```text
AlertPacket / drift suggestions
  → Signal bucket (suggest only)
  → Epistemic visualization panels
  → (never) direct CubeState write
```

| Panel | Data source | May mutate? |
|-------|-------------|-------------|
| Drift signals | `driftAnalyticsEngineV0` | No |
| Alert anomalies | `driftAnomalyDetectorV0` | No |
| Feature vectors | `learningFeatureVectorExportV0` | No |
| REC cycle | `runRecCycleCleanupV0` | Batch only (reconcile) |
| Admission | `admissionCubeCommitV0` | Yes — human/admission gate |

---

## 2. DR-01 + DR-02 in UI

- Panels MUST NOT render suggestions as actionable mutate buttons without admission gate.
- AlertPacket text MUST display category/delta language only (DR-02).

---

## 3. Changelog

| Date | Change |
|------|--------|
| 2026-06-19 | v1.0 — epistemic visualization layer spec (UI wire scaffold) |
