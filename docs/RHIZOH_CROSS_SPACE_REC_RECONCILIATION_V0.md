# Rhizoh Cross-Space REC Reconciliation v0

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY` — unified epoch memory without space-blind bleed.

**Prerequisites:** [`RHIZOH_MULTI_ARENA_SCHEDULER_V0.md`](RHIZOH_MULTI_ARENA_SCHEDULER_V0.md) · [`RHIZOH_SPORTS_ADAPTER_V0.md`](RHIZOH_SPORTS_ADAPTER_V0.md) · [`RHIZOH_MUTATION_REASON_CODE_ONTOLOGY_V1.md`](RHIZOH_MUTATION_REASON_CODE_ONTOLOGY_V1.md)

**Code:** `apps/client/src/rhizoh/runtime/crossSpaceRecReconciliationV0.js`

---

## 0. SSOT sentence

> **PR #210 made realities selectable; Cross-Space REC makes realities interact without blind memory merge.**

Before v0:
- REC global epoch, weak space coupling
- Sports momentum → REC could leak into chess slice
- Memory fragmentation across domains

After v0:
- Space-tagged REC slices (`chess`, `sports`, `cux overlay`)
- Semantic interference matrix (observe, don't merge)
- Unified `globalEpochId` reconciled per scheduler tick

---

## 1. Problem

| Symptom | Cause |
|---------|-------|
| Sports drift mixes into chess REC | Space-blind category totals |
| "Realities alternate" but don't talk | No interference model |
| Memory fragmentation | No unified epoch reconciliation |

---

## 2. Model

```text
ingestSpaceDriftSignalV0({ spaceId, category, strength })
        ↓
spaceRecSlices[spaceId]   ← isolated per causal space
        ↓
reconcileCrossSpaceRecV0({ selection })
        ↓
globalEpochId + reconciledShares + interference[]
```

### Interference kinds

| Kind | Meaning |
|------|---------|
| `semantic_drift` | Cross-space drift observation |
| `rec_category_bleed` | Sports REC would wrongly merge into chess-primary epoch — **blocked** |
| `entropy_cross_couple` | Stochastic entropy observed across spaces |

**Rule:** Non-primary space `REC` totals are **never** merged into reconciled shares when chess is primary.

---

## 3. Integration

| Source | Hook |
|--------|------|
| `sportsEventAdapterV0.js` | `deriveSportsDriftSignalsV0` → `ingestSpaceDriftSignalV0` |
| `multiArenaSchedulerV0` tick | `MULTI_ARENA_TICK_EVENT` → `reconcileCrossSpaceRecV0` |
| `rhizohUglBootV0.js` | DevTools + uglReport snapshot |

---

## 4. DevTools

```javascript
window.__rhizoh.crossSpaceRec()
window.__rhizoh.reconcileCrossSpaceRec()
window.__rhizoh.ingestSpaceDriftSignal({
  spaceId: "sports.causal.space",
  category: "REC",
  strength: 0.7
})
```

Event: `rhizoh:cross-space-rec-v0`

---

## 5. Maturity checkpoint

| Level | Status |
|-------|--------|
| L1 Execution + ingestion | ✔ |
| L2 Multi-Arena Scheduler | ✔ PR #210 |
| L3a Cross-space REC | ✔ this module |
| L3b Resource contention guard | ❌ next |
| L3c Ledger / seal activation | ❌ phase gate |

---

## 6. Not in v0

- Durable sealed history (ledger height = 0 remains phase-gate track)
- Quota enforcement against WASM/CPU
- Chess ticket pipeline auto-tagging (manual / sports path only in v0)

**Next:** [`RHIZOH_CROSS_SPACE_CAUSAL_FUSION_V0.md`](RHIZOH_CROSS_SPACE_CAUSAL_FUSION_V0.md)
