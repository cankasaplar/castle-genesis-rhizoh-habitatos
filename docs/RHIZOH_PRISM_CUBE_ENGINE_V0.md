# Rhizoh Prism Cube Engine v0

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY`

**Prerequisites:** [`RHIZOH_UNIFIED_SEMANTIC_REALITY_FIELD_V1.md`](RHIZOH_UNIFIED_SEMANTIC_REALITY_FIELD_V1.md)

**Code:** `apps/client/src/rhizoh/runtime/prismCubeEngineV0.js`

---

## 0. SSOT sentence

> **Prism Cube v0 compresses stabilized semantic field into bounded execution units — substrate prep, not spatial instantiation.**

System today **stabilizes** semantic reality; Prism v0 **partitions** it for future execution.

---

## 1. What Prism Cube solves (v0 scope)

| Capability | v0 | Deferred |
|------------|-----|----------|
| **Temporal boundary** | `epochId` → cube boundary | — |
| **Semantic compression** | node → compact payload | — |
| **Adjacency topology** | cross-epoch / coherence edges | — |
| **Action surface** | — | ❌ v0 |
| **Spatial slot** | — | ❌ v0 |

**Cube = execution substrate** (target), not analytics container.

---

## 2. Pipeline

```
semanticField (Phase 4)
        ↓
generatePrismCubesFromSemanticFieldV0()
        ↓
cubes[] + adjacencyGraph + topologyHead
```

Auto-attached to `epochMergeAndAssimilate()` → `merge.prismCubes`

---

## 3. Cube shape

```javascript
{
  cubeId,                    // hash(partitionKey + epoch + height)
  partitionKey,              // identity
  epochBoundary: { epochId, mergedEpochId },
  temporalBoundary: { height, epochId },
  payload: { sealRef, semanticClass, fieldWeight, compressed: true },
  actionSurface: null,       // deferred
  spatialSlot: null,         // deferred
  executionSubstrate: true
}
```

---

## 4. Adjacency link types

| `linkType` | When |
|------------|------|
| `cross_epoch_bridge` | same height, different epoch, same seal |
| `temporal_chain` | same epoch, different height |
| `semantic_coherence` | same sealRef across cubes |

---

## 5. Explicitly excluded (v0)

- spatialization / geometry generation
- arena binding (chess / sports / media)
- media ledgerization
- worker consensus

---

## 6. DevTools

```javascript
const m = await window.__rhizoh.epochMergeAndAssimilate()
m.prismCubes.cubeCount
m.prismCubes.adjacencyGraph.edges

window.__rhizoh.generatePrismCubes({ semanticField })
window.__rhizoh.prismCubeEngine()
```

Boot: `boot.prism_cube_engine · armed bounded_units compression`

---

## 7. Evolution

| Phase | Model |
|-------|-------|
| 4 | semantic field (stabilize) |
| **4.1** | **prism cubes (compress + bound)** |
| 4.2 | action surface + spatial slot |
| 5 | arena binding + media ledgerization |
| 5.1 | worker physics validation |
