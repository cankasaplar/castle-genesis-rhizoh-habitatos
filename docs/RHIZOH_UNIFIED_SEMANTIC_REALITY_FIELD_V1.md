# Rhizoh Unified Semantic Reality Field v1

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY`

**Prerequisites:** [`RHIZOH_EPOCH_MERGE_EVENT_V1.md`](RHIZOH_EPOCH_MERGE_EVENT_V1.md)

**Code:** `apps/client/src/rhizoh/runtime/unifiedSemanticRealityFieldV1.js`

---

## 0. SSOT sentence

> **Phase 4 projects the multi-partition DAG into an interpretable semantic field — synthesis, not arbitration.**

The field carries `trustClass: interpretation_only` — it never grants execution authority.

---

## 1. Evolution arc

| Phase | Model | Question |
|-------|-------|----------|
| 1 | single ledger | what was sealed? |
| 2 | dual ledger sync | where do ledgers agree? |
| 3 | multi-epoch partial graph | which unified reality was produced? |
| **4** | **unified semantic reality field** | **what semantic field does the graph project?** |

---

## 2. Projection pipeline

```
crossEpochReplay (Phase 3 DAG)
        ↓
projectUnifiedSemanticRealityFieldV1()
        ↓
semanticNodes[] + fieldCoherence + projectionHead
```

Automatic after `epochMergeAndAssimilate()` — returned as `merge.semanticField`.

---

## 3. Semantic node classes

| Partition status | `semanticClass` |
|------------------|-----------------|
| `aligned` | `same_partition_authority` |
| `cross_epoch_coherent` | `cross_epoch_witness_bridge` |
| `partial_presence` | `partial_semantic_presence` |
| `seal_conflict_preserved` | `conflict_preserved_semantic` |

Each node: `fieldWeight` (0..1), `trustClass`, `sourceChain`, `derivationDepth: 1`.

---

## 4. Field metrics

| Field | Meaning |
|-------|---------|
| `fieldCoherence` | blend(partitionCoherence × 0.6, mean fieldWeight × 0.4) |
| `partitionCoherence` | inherited from Phase 3 replay |
| `crossEpochIntegrity` | inherited from Phase 3 replay |
| `projectionHead` | deterministic field fingerprint |

---

## 5. DevTools

```javascript
// Full pipeline (merge + replay + field)
const pipeline = await window.__rhizoh.runSemanticRealityPipeline()
pipeline.semanticField.fieldCoherence
pipeline.semanticField.semanticNodes

// Manual projection
window.__rhizoh.projectSemanticRealityField({ crossEpochReplay, mergeEvent })
window.__rhizoh.semanticRealityField()
```

Boot: `boot.semantic_reality_field · armed phase_4 projection`

---

## 6. Maturity

| Level | Status |
|-------|--------|
| L3l Epoch merge | ✔ #225 |
| L3m Cross-epoch graph metrics | ✔ #226 |
| L4a **Unified semantic reality field** | ✔ this module (skeleton) |
| L4b Semantic field persistence / worker slot | ❌ data-plane READY |
