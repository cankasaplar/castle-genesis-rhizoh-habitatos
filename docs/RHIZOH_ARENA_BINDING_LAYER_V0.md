# Rhizoh Arena Binding Layer v0

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY`

**Prerequisites:** [`RHIZOH_SPATIAL_ALLOCATION_LAYER_V0.md`](RHIZOH_SPATIAL_ALLOCATION_LAYER_V0.md)

**Code:** `apps/client/src/rhizoh/runtime/arenaBindingLayerV0.js`

---

## 0. SSOT sentence

> **Meaning exists in cubes; Arena Binding assigns who continues across chess / sports / media / authority — `entity_id` kernel, not world coordinates yet.**

Closes the ontological gap: *information + structure without cross-arena identity*.

---

## 1. Pipeline position

```
Spatial Allocation (logical grid)
        ↓
Arena Binding Layer v0   ← this module
        ↓
Spatial Slot Resolver (world_position) — next
        ↓
Prism Cube Commit
```

---

## 2. Shared identity kernel

```javascript
entityId = foldWalSegmentHash(genesis, {
  sealRef, partitionKey, mergedEpochId, clientSeed
})
```

| Arena | v0 coverage | Event grammar |
|-------|-------------|---------------|
| authority_epistemic | `bound_epistemic` | `arena.authority.seal.v1` |
| chess | `inference_only` | `arena.chess.move.v1` |
| sports | `event_ingest` | `arena.sports.delta.v1` |
| media | `ui_stub` | `arena.media.frame.v1` |

Chess / sports / media register into kernel via `registerArenaEntityContinuityV0` — prep only.

---

## 3. Cube binding output

```javascript
arenaBinding: {
  status: "bound",
  arenaId: "arena.authority_epistemic",
  entityId,
  eventGrammar: "arena.authority.seal.v1",
  crossArenaContinuity: { chess: null, sports: null, media: null }
}
```

`worldPosition` remains `null` — Spatial Slot Resolver is next.

---

## 4. DevTools

```javascript
const m = await window.__rhizoh.epochMergeAndAssimilate()
m.arenaBinding.boundCubes[0].entityId
m.arenaBinding.boundCubes[0].arenaBinding.status  // "bound"
m.arenaBinding.arenaRegistry.chess.consensus      // false

window.__rhizoh.bindArenasToCubes({ spatialAllocation })
window.__rhizoh.registerArenaEntity({ entityId, arenaType: "chess", localId: "match_1" })
window.__rhizoh.arenaEntityId({ sealRef, partitionKey })
```

Boot: `boot.arena_binding · armed identity_kernel`

---

## 5. Deferred

- `world_position` (Spatial Slot Resolver)
- Prism Cube Commit (spatial object)
- Chess historical consensus
- Media ledgerization
- Worker physics validation

---

## 6. Maturity

| Level | Status |
|-------|--------|
| L4c Spatial allocation | ✔ #229 |
| L5a **Arena binding v0** | ✔ this module |
| L5b Spatial slot resolver | ❌ next |
| L5c Prism cube commit | ❌ |
