# Rhizoh Castle Projection Layer v0

**Status:** ACTIVE · **SPECFLOW:** `RESEARCH-ONLY`  
**Modül:** `rhizohCastleProjectionLayerV0.js`

---

## Rol

Castle ≠ yeni dünya · Castle = **ICL-bound shared projection node** (WAL shared, single world).

```text
WORLD (single) → WAL → ICL → CASTLE (projection cluster)
```

---

## ICL gate

`publishCastleProjectionV0()` blocked when `identity_break` or chain break. Bootstrap allowed when no ICL report yet.

---

## SSOT

```javascript
window.__rhizoh.castleProjection
// castle_node_id, world_identity_id, icl_enforced, single_world, shared_wal
```

Bkz. [`RHIZOH_MULTI_INHABITANT_CO_PRESENCE_V0.md`](RHIZOH_MULTI_INHABITANT_CO_PRESENCE_V0.md) · [`RHIZOH_IDENTITY_CONSISTENCY_LAYER_V0.md`](RHIZOH_IDENTITY_CONSISTENCY_LAYER_V0.md)
