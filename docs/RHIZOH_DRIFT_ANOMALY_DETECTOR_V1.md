# Rhizoh Drift Anomaly Detector v1

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY` — perception layer; not execution.

**Prerequisites:** [`RHIZOH_TRACE_GRAPH_INDEX_OPTIMIZER_V1.md`](RHIZOH_TRACE_GRAPH_INDEX_OPTIMIZER_V1.md) · [`RHIZOH_SECURITY_BOUNDARY_V1.md`](RHIZOH_SECURITY_BOUNDARY_V1.md) (DR-01)

**Code:** `apps/client/src/rhizoh/ticket/driftAnomalyDetectorV0.js`

---

## 0. SSOT sentence

> **AlertPacket = suggestion-only event. Never mutation trigger. Never auto-reconcile input.**

---

## 1. Three-layer threshold (all required)

| Layer | Rule | Example |
|-------|------|---------|
| **Absolute spike** | Category count > N in window | `SC_*` count ≥ 5 |
| **Relative drift** | Share > baseline + σ | SC share > 0.15 above baseline |
| **Persistence** | Spike across 2 REC cycles | Elevated share in consecutive epochs |

Only when **all three** pass → `AlertPacket` emitted.

---

## 2. AlertPacket shape

```json
{
  "type": "DRIFT_ANOMALY",
  "severity": "medium",
  "category": "SC",
  "suggestion": "review_admission_policy_and_permission_boundaries",
  "confidence": 0.73,
  "executionClass": "suggest"
}
```

---

## 3. Pipeline position

```text
Live Index (read-only snapshot)
  → extractDriftSignalsV0
  → detectDriftAnomaliesV0
  → AlertPacket (suggest only)
  → nervous network Signal bucket
```

REC-cycle tombstone/compression runs **after** alert generation — alerts never trigger cleanup.

---

## 4. Changelog

| Date | Change |
|------|--------|
| 2026-06-19 | v1.0 — 3-layer anomaly + AlertPacket |
