# Rhizoh Trace Graph Index Optimizer v1

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY` — **epistemic nerve indexing**; not admission logic; not execution.

**Prerequisites:** [`RHIZOH_MUTATION_REASON_CODE_ONTOLOGY_V1.md`](RHIZOH_MUTATION_REASON_CODE_ONTOLOGY_V1.md) · [`RHIZOH_REALITY_TRANSITION_ENGINE_V1.md`](RHIZOH_REALITY_TRANSITION_ENGINE_V1.md)

**Code:** `apps/client/src/rhizoh/ticket/traceGraphIndexOptimizerV0.js`

---

## 0. SSOT sentence

> **Reason Code = nerve ending. TraceGraph = cortex. SYSTEM_RECONCILE = metabolism. Index Optimizer = structural memory compression.**

**Three provable layers:**

| Layer | Carries |
|-------|---------|
| **Event** | What happened (`mutationId`, `trace`) |
| **Decision** | Outcome (`status`: accepted / rejected / …) |
| **Causal justification** | Why (`reason.primary`, category) |

Rhizoh is an **Explainable State Machine** → **Causal Learning Organism** (observation only).

---

## 1. Architectural boundary (do not cross)

| Risk | Guard |
|------|-------|
| Reason ontology mixes with admission | Optimizer is **read-only** on mutation ledger; never calls `AdmissionEngine.commit()` |
| Learning layer policy collapse | Drift signals are **`suggest` class observations** — no auto-mutate, no self-justification loop |

---

## 2. Three subsystems (one module, three roles)

```text
MutationRecord v2
      ↓
┌─────────────────────────────────────┐
│ 1. Index Builder (structural)       │
│    reasonCode → shard               │
│    actor → bucket                   │
│    epoch → partition                │
├─────────────────────────────────────┤
│ 2. Causal Compressor (temporal)     │
│    expired / rejected / quota_denied│
│    → causal residue (not deleted)   │
├─────────────────────────────────────┤
│ 3. Drift Signal Extractor (semantic)│
│    SC_02 ↑ → permission drift       │
│    QUOTA_* ↑ → resource stress      │
└─────────────────────────────────────┘
      ↓
Drift / Analytics / Learning (future)
```

---

## 3. Index Builder

| Index | Key | Value |
|-------|-----|-------|
| Reason shard | `reason.primary` | `mutationId[]` |
| Actor bucket | `actor.actorId` | `mutationId[]` |
| Epoch partition | `epoch` | `mutationId[]` |
| Status lane | `status` | `mutationId[]` |

---

## 4. Causal Compressor

Records with `status ∈ { expired, rejected, quota_denied }` may be compressed into **causal residue**:

```json
{
  "schema": "castle.rhizoh.causal_residue.v0",
  "residueId": "res_1",
  "reasonCategory": "SC",
  "reasonPrimary": "SC_02_INVALID_MUTATION_SOURCE",
  "status": "rejected",
  "epoch": "rec_2026_06_19_0644",
  "actorType": "user",
  "traceGraphLink": "edge_9921",
  "mutationCount": 3,
  "sampleMutationIds": ["mut_1", "mut_2"],
  "compressedAt": "2026-06-19T19:00:00Z"
}
```

Active graph edges pruned; history retained as residue (tombstone analogue for trace).

---

## 5. Drift Signal Extractor

| Signal | Trigger (default) | Meaning |
|--------|-------------------|---------|
| `permission_drift` | `SC_*` share > 35% of window | Permission boundary stress |
| `resource_stress` | `QUOTA_*` count ≥ 3 in window | Resource exhaustion pattern |
| `temporal_drift` | `REC_*` share > 30% | Epoch / continuity stress |
| `identity_drift` | `SIG_*` share > 25% | Trust / binding stress |

Signals include `confidenceHint01` (observation only — not frozen trust).

---

## 6. Pipeline

```text
ingestMutationRecordForIndexV0(record)
  → buildIndexFromMutationRecordV0
  → (optional) compressEligibleRecordsV0
  → extractDriftSignalsV0

optimizeTraceGraphIndexV0({ records, compress, windowSize })
  → batch entry point for REC reconcile
```

---

## 7. Downstream

```text
traceGraphIndexOptimizerV0
  → driftAnalyticsEngineV0
  → learning feature vector export (future, RESEARCH-ONLY)
```

See [`RHIZOH_DRIFT_ANALYTICS_ENGINE_V1.md`](RHIZOH_DRIFT_ANALYTICS_ENGINE_V1.md).

---

## 8. Changelog

| Date | Change |
|------|--------|
| 2026-06-19 | v1.0 — index builder + causal compressor + drift extractor |
