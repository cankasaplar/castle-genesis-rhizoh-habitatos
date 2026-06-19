# Rhizoh Learning Feature Vector Export v1

**SPECFLOW:** `RESEARCH-ONLY` — substrate for downstream learning; not execution.

**Prerequisites:** [`RHIZOH_MUTATION_REASON_CODE_ONTOLOGY_V1.md`](RHIZOH_MUTATION_REASON_CODE_ONTOLOGY_V1.md) · [`RHIZOH_DRIFT_ANALYTICS_ENGINE_V1.md`](RHIZOH_DRIFT_ANALYTICS_ENGINE_V1.md)

**Code:** `apps/client/src/rhizoh/ticket/learningFeatureVectorExportV0.js`

---

## 0. SSOT sentence

> **Feature vectors describe observation substrate — they do not authorize mutation.**

Rhizoh transforms **events → semantic embedding → learning vector** (not classic event log + analytics).

```text
MutationRecord
  → live index (category counters)
  → drift / AlertPacket
  → exportLearningFeatureVectorV0
  → semantic_category_embedding_v0
```

---

## 1. Vector fields

| Field | Source |
|-------|--------|
| `reasonCategoryShares` | MutationRecord v2 `reason.category` distribution |
| `driftSeverity01` | Max drift signal `share01` |
| `epochTrend` | Per-epoch sample counts |
| `acceptanceRatio01` | `accepted / total` |
| `permissionStress01` | SC category share |
| `quotaStress01` | QUOTA category share |
| `recContinuityStress01` | REC category share |
| `forecastRiskCount` | Causal forecast risk count |
| `alertPacketCount` | 3-layer anomaly alert count |

---

## 2. Pipeline

```text
runTicketMemoryPipelineV0(...)
  → exportLearningFeatureVectorV0({ records, indexSnapshot, drift, analytics, alerts })
```

---

## 3. Boundaries

| Allowed | Forbidden |
|---------|-----------|
| Export to research / UI panels | Auto admission or CubeState write |
| Correlate with AlertPacket | Drift → mutate promotion |

---

## 4. Changelog

| Date | Change |
|------|--------|
| 2026-06-19 | v1.0 — feature vector export |
