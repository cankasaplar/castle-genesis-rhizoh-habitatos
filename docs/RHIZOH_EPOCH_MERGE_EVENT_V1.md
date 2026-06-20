# Rhizoh Epoch Merge Event v1

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY`

**Prerequisites:** [`RHIZOH_AUTHORITY_EPOCH_BOUNDARY_V1.md`](RHIZOH_AUTHORITY_EPOCH_BOUNDARY_V1.md)

**Code:** `apps/client/src/rhizoh/runtime/authorityEpochMergeEventV1.js` · `apps/client/src/rhizoh/runtime/crossEpochDeterministicReplayV1.js` · `apps/gateway/src/authorityEpochMergeStoreV1.js`

---

## 0. SSOT sentence

> **Epoch is a causal namespace, not a truth hierarchy — merge assimilates branches; no history is deleted.**

`soft_drift` at epoch first-contact = expected signal, not block condition.

---

## 1. Problem class: two equal histories

| Layer | Timeline |
|-------|----------|
| Client epoch | Session / boot causal branch |
| Gateway epoch | Shared witness archive branch |

Without merge primitive: alignment sees mismatch; system cannot answer *which unified reality was produced*.

---

## 2. Primitive: `epoch_merge_event`

```javascript
{
  schema: "castle.rhizoh.epoch_merge_event.v1",
  sourceEpoch: "client_epoch_h87b",
  targetEpoch: "gateway_epoch_hd29c",
  mergeStrategy: "causal_assimilation",  // NOT override
  payload: {
    clientLedgerHead,
    gatewayLedgerHead,
    divergenceSignals,
    missingEntries,
    overlappingSeals
  },
  resolution: {
    mode: "append_only_reconciliation",
    rule: "preserve_both_histories"
  },
  output: {
    mergedEpochId: "merged_h…",
    canonicalPointer: "gateway_witness_extended",
    clientPointer: "client_rebased_chain"
  }
}
```

### Rejected model (override)

Gateway epoch wins → client reset → linearized history = **central ledger**, not distributed assimilation.

### Accepted model (assimilation)

```
        ┌── client epoch ──┐
merge ──┤                   ├── merged epoch
        └── gateway epoch ─┘
```

---

## 3. API surface

### Client

```javascript
await window.__rhizoh.epochMergeAndAssimilate()
window.__rhizoh.buildEpochMergePayload()
window.__rhizoh.crossEpochReplay({ clientReplay, gatewayReplay, mergeEvent })
window.__rhizoh.epochMergeSnapshot()
```

### Gateway

```
POST /rhizoh/authority/epoch/merge
```

---

## 4. Cross-epoch deterministic replay

`crossEpochDeterministicReplayV1` — required for post-merge consistency.

| Question | Answer |
|----------|--------|
| Before merge | "Which reality is correct?" |
| After merge | "Which unified reality was produced?" |

Partitions keyed `${epochId}:${height}` — conflicts **preserved**, not overridden.

### Graph metrics (Phase 3 — continuous, not binary)

| Field | Meaning |
|-------|---------|
| `partitionCoherence` | `0..1` — graph-level coherence (namespace fragmentation penalized) |
| `crossEpochIntegrity` | `0..1` — seal agreement at height across epochs (−0.09 namespace split) |
| `samePartitionAligned` | Binary count — same `${epochId}:${height}` both sides |
| `crossEpochCoherentPartitions` | Partial partitions bridged by matching seal at height |
| `alignedPartitions` | **Deprecated** — use `partitionCoherence` |

Prod example (same seal, different epochs):

```
crossEpochIntegrity: 0.91
partitionCoherence: 0.83
samePartitionAligned: 0
status: cross_epoch_coherent (not "misaligned")
```

`graphModel: multi_partition_dag` · `realityPhase: phase_3_multi_epoch_partial_graph`

---

## 5. Soft drift semantics

| Signal | Meaning |
|--------|---------|
| `missing_entry` + same epoch | Incomplete witness propagation (#224) |
| `session_resync` | Epoch boundary — first contact |
| Post-merge `soft_drift` | Two timelines assimilating — merge primitive applies |

---

## 6. Maturity

| Level | Status |
|-------|--------|
| L3j Epoch boundary | ✔ #223 |
| L3k Gateway entry guarantee | ✔ #224 |
| L3l **Epoch merge event** | ✔ this module |
| L3m Cross-epoch deterministic replay | ✔ skeleton |
| L4a Unified semantic reality field | ✔ [`RHIZOH_UNIFIED_SEMANTIC_REALITY_FIELD_V1.md`](RHIZOH_UNIFIED_SEMANTIC_REALITY_FIELD_V1.md) |
| L3n Full distributed consensus shadow | ❌ data-plane READY |
