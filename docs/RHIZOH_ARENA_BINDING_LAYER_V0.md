# Rhizoh Arena Binding Layer v0

**SPECFLOW:** `RESEARCH-ONLY` · **Issue:** #230

Prism cubes become **arena-aware persistent entities**. Chess, sports, and media share one identity ontology — `ArenaEvent` (unified) instead of separate silos.

## Before / After

| Before #230 | After #230 |
|-------------|------------|
| Cube → semantic unit | Cube → entity carrier |
| Arena → nonexistent | Arena → identity convergence layer |
| Entity → fragmented | Entity → `ArenaEntityKernel` + aliases |
| Event → domain-specific | Event → cross-domain signal |

## ArenaEntityKernel

```ts
interface ArenaEntityKernel {
  entityId: string;
  persistentHash: string;
  epochOrigin: string;
  aliases: { chess?: string; sports?: string; media?: string };
  semanticClass: string;
  status: "created" | "bound" | "drifting" | "quarantined";
  lastSeenAt: number;
}
```

## ArenaEventV0

```ts
interface ArenaEventV0 {
  eventId: string;
  arenaType: "chess" | "sports" | "media";
  entity: ArenaEntityKernel;
  payload: { move?: string; scoreDelta?: unknown; frameTimestamp?: number; mediaRef?: string };
  epochId: string;
  sealRef: string;
  timestamp: number;
}
```

## Binding engine

- `bindArenaEntityV0(event)` — registry keyed by `persistentHash`; merges `aliases` across arenas; sets `status: bound` on cross-arena link.
- `resolveCrossArenaIdentityV0(entityId)` — resolve by `entityId` or any alias.
- `bindArenasToPlacedCubesV0(spatialAllocation, ctx)` — boot pipeline step after spatial allocation.

## Critical invariant

**No arena event without entity binding.** Chess/sports/media ingest stubs all route through `bindArenaEntityV0`.

## Integration stubs

| Arena | Function | Status |
|-------|----------|--------|
| Chess | `ingestChessMoveArenaEventV0(move, entityId)` | Active stub |
| Sports | `ingestSportsArenaEventV0(eventData, entityId)` | Active stub |
| Media | `ingestMediaFrameArenaEventV0(frame)` | Locked — `MEDIA_LEDGERIZATION_LOCKED_PHASE_1` |

## Spatial bridge (placeholder)

`buildSpatialBindingV0` — initial `worldPosition: null`; filled by [`RHIZOH_SPATIAL_SLOT_RESOLVER_V0.md`](RHIZOH_SPATIAL_SLOT_RESOLVER_V0.md).

## Boot signals

After merge + assimilate:

- `arena.binding.entity_resolved`
- `arena.cross_identity.linked`
- `entity.status = bound`
- `cross_arena_aliases = active`

## DevTools

```javascript
const m = await window.__rhizoh.epochMergeAndAssimilate();
m.arenaBinding.boundCubes[0].entityKernel;
m.arenaBinding.signals;
window.__rhizoh.arenaBindingSignals();
window.__rhizoh.bindArenaEntity({ ... });
window.__rhizoh.resolveArenaIdentity("arena_entity_...");
```

## Pipeline position

```
… → spatialSlotResolver → prismCubeCommit → (next: Cesium world commit)
```

## Module

`apps/client/src/rhizoh/runtime/arenaBindingLayerV0.js`
