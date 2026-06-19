# Rhizoh Drift Analytics Engine v1

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY` — **perception / forecasting layer**; not execution.

**Prerequisites:** [`RHIZOH_TRACE_GRAPH_INDEX_OPTIMIZER_V1.md`](RHIZOH_TRACE_GRAPH_INDEX_OPTIMIZER_V1.md) · [`RHIZOH_MUTATION_REASON_CODE_ONTOLOGY_V1.md`](RHIZOH_MUTATION_REASON_CODE_ONTOLOGY_V1.md) · [`RHIZOH_SECURITY_BOUNDARY_V1.md`](RHIZOH_SECURITY_BOUNDARY_V1.md) (DR-01)

**Code:** `apps/client/src/rhizoh/ticket/driftAnalyticsEngineV0.js`

---

## 0. SSOT sentence

> **Drift is prediction, not execution. The system observes its own behavior — it does not write its own future.**

Rhizoh is a **self-observing causal memory system** (observational cognition runtime).

---

## 1. Four-layer living system

| Layer | Components |
|-------|------------|
| **Epistemic** | Validator, Reason Ontology |
| **Memory** | TraceGraph, Index Builder |
| **Compression** | Causal Compressor, Tombstone residue |
| **Perception** | Drift Extractor, **Drift Analytics Engine** |

---

## 2. Invariant DR-01 (constitutional)

> **Drift signals SHALL NOT trigger mutations. Drift signals SHALL ONLY trigger suggestions.**

| Allowed | Forbidden |
|---------|-----------|
| `suggest` tickets / signals | `mutate_l1` / `mutate_l2` from drift |
| Forecast + confidence hint | Auto quota change, auto admission |
| REC reconcile **proposals** | Drift → CubeState write |

**Failure mode if violated:** feedback loop collapse — system writes its own predicted future.

---

## 3. Three subsystems

```text
traceGraphIndexOptimizerV0 (drift signals)
              ↓
┌─────────────────────────────────────────┐
│ 1. Temporal Drift Curves                │
│    SC / QUOTA / REC / SIG time series   │
├─────────────────────────────────────────┤
│ 2. Causal Forecasting                   │
│    which invariant at risk (SC-01…DR-01)│
├─────────────────────────────────────────┤
│ 3. Suggestion Generator                 │
│    { suggestion, confidence, class }    │
└─────────────────────────────────────────┘
```

### 3.1 Temporal Drift Curves

Per-epoch buckets with category shares — input to forecasting.

### 3.2 Causal Forecasting

Rising slope + high share → invariant breach **risk** (not verdict).

| Risk target | Signal |
|-------------|--------|
| SC-03 | `permission_drift` + SC_03 dominance |
| SC-02 | `permission_drift` + SC_02 |
| Quota topology | `resource_stress` |
| REC continuity | `temporal_drift` |
| DR-01 guard | any forecast with `mutate` class → reject at generator |

### 3.3 Suggestion Generator

```json
{
  "suggestionId": "sug_1",
  "suggestion": "review_quota_window_for_burst_layer",
  "confidence": 0.78,
  "executionClass": "suggest",
  "invariantAtRisk": "QUOTA_EXHAUSTED",
  "basedOn": "resource_stress"
}
```

---

## 4. Pipeline

```text
optimizeTraceGraphIndexV0(...)
  → runDriftAnalyticsV0({ drift, records })
  → wireDriftSuggestionsToNervousNetworkV0 (Signal bucket)
  → deriveReconcileProposalV0 (REC, optional)
  → commitProposedCubeDeltaV0 (Admission only)
```

---

## 5. Changelog

| Date | Change |
|------|--------|
| 2026-06-19 | v1.0 — DR-01 + temporal curves + forecast + suggestions |
