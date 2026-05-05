# RSK Studio User Manual v1 (Sovereign Operator Edition)

This document is for **operators** (humans and agents) who drive the Rhizoh Studio Kernel (RSK) through the public store API and Kernel Console. It describes **how the system behaves**, not marketing language.

**Code anchor:** primary exports live in `apps/client/src/studio/store/studioStore.ts`. Kernel Console UI: `apps/client/src/studio/ui/KernelConsolePanel.tsx`.

---

## 0. System definition (operator reality)

RSK Studio is not a traditional “mutable world editor.” It is a **causal reality compiler**: you do not edit truth in place; you **append causes**. Derived “now” is always a **projection** (a deterministic fold) over the causal graph for a branch.

The operator does **not** manage authoritative entity state as a spreadsheet. The operator manages:

- **Causes** — immutable `CausalNode` records on a branch
- **Branches** — timelines (including shadow forks)
- **Mind runtime** — per-instance cognitive pulse and tick semantics
- **Entity appearance in the world** — `EntityProjection` from the graph, plus optional cache for UI speed (cache is never an input to validation)

---

## 1. Operator model

### Actor kinds (`IdentityState.actor.kind`)

| Kind | Role |
|------|------|
| `human` | Authenticated or local human operator |
| `agent` | Automated actor |
| `system` | Kernel-internal actor |
| `delegate` | Scoped delegated authority |

### Every mutating path (conceptual)

`actor + permissions → KernelGuard (authorize / validate / sanitize) → slice or runtime → causal append (when applicable) → projection refresh (when applicable)`

If guard denies the action, **no** new causal material is written for that attempt.

---

## 2. Soul and world bootstrap

### Soul

A **Soul** is the continuity carrier for an owner: registry row + continuity hash + optional links to minds and entities.

- **API:** `registerSoul(soul)` — guarded `registry.soul.register`
- **Required fields include:** `uid`, `ownerId`, `resonance`, `history` (see `Soul` in `apps/client/src/studio/types/rskOntology.ts`)
- **Display name / origin:** use `metadata.name`, `metadata.origin` (strings); there is no separate top-level `name` argument on `Soul`

Continuity hash can be supplied or computed from links and history during registration.

### Bootstrap

On first authenticated session, `patchIdentityFromAuth` can call `bootstrapKernelRootIfNeeded(ownerId)`, which creates a default mind definition, a root soul, a seed mind instance, and a soul–mind binding when the registry is still empty for that owner. Treat this as **guided world ignition**, not a hidden rewrite of past causal history.

---

## 3. Mind operation

### Definitions and instances

1. **`registerMindDefinition`** — mind “species” (DNA, engine metadata, capabilities).
2. **`spawnMindInstance`** — concrete instance (`MindInstance`) bound to a definition (and optionally a soul).

Legacy alias `registerMind` may still exist; prefer `registerMindDefinition`.

### Runtime and tick

- **`ensureMindRuntimeForInstance(instanceId)`** — allocates default runtime bucket if missing.
- **`tickMind(instanceId, context?, explicitSeed?)`** — guarded `registry.mind.tick`; advances mind runtime, appends a **mind** causal node on the active branch, bumps `worldPhysics.globalTick`, and may refresh entity projection cache when the tick payload declares affected entities.

Mind ticks are **discrete** cognitive pulses, not LLM transcripts by themselves.

---

## 4. Causal reality rule (golden rule)

**Nothing “updates state” in the authority sense.** Anything that looks like world change is either:

1. **A new `CausalNode`** (append-only, immutable identity), or  
2. **A derived recompute** (`projectEntity`, caches) from the graph.

Nodes are **replayable**: same graph + same branch + same projection rules → same derived physics for an entity.

Closure invariant: projection fold applies **causal closure to genesis** for eligible nodes (see `KERNEL_PROJECTION_RULE_CAUSAL_CLOSURE` and `validateCausalClosureToGenesis` in `projectionReducer.ts`).

---

## 5. Physical world (entities)

### Entity registry vs entity projection

- **`registerEntity`** — guarded `registry.entity.register`; writes the entity row **and** emits an **entity genesis** causal atom. Projection cache is updated for that entity on the active branch.
- **Truth for position:** `Entity(t, branch) = reduce(relevant CausalNodes)` — see `projectEntity` / `projectEntityFromCausalGraph`.

### Movement (intent → gate → node → projection)

- **API:** `applyEntityMoveIntent({ entityUid, dpos })` — guarded `physics.entity.move.apply`
- **Pipeline:** `KernelGuardRun` → `validateMoveIntent` (bounds, genesis, **spatial** broad-phase, narrow separation) → either:
  - **`outcome: "moved"`** — `tool` node with `entity.physical` delta (absolute validated position), writer `entity:<uid>`, or  
  - **`outcome: "collision_stop"`** — `tool.collision` node with `collision.resolution` delta (resolution **artifact**; STOP keeps positions unchanged but records co-presence in projection metadata).

Result type: `ApplyEntityMoveIntentResult` in `entityMoveSlice.ts`.

---

## 6. Spatial system (locality engine)

Spatial indexing is **derived** from projected positions for validation (not a second source of truth).

- **Bucket id:** deterministic grid key `b:gx:gy:gz` — `getSpatialBucketId`, `getNeighborBucketIds`, `buildSpatialRegistryFromPositions`, `collectCandidateEntityUids` (`spatialRegistry.ts`).

Operators think: **“who could interact because they are nearby in bucket space?”** The engine still runs **narrow** checks (for example separation distance) on that candidate set.

---

## 7. Collision (world interaction, not “error”)

A blocked move is **not** only a validation failure: when narrow-phase co-presence violates separation, the kernel can emit a **`tool.collision`** node (`buildCollisionResolutionCausalNode`) with:

- **Targets:** initiator and target entity uids (`affectsEntityIds`)
- **Payload:** `collisionTargetId`, `impactVector`, `resolutionType` (v1 implements **STOP** semantics on physics; SLIDE / BOUNCE are typed for forward evolution)
- **Console:** Kernel Console linear causal list shows a compact **fracture line** for collision resolution (`KernelConsolePanel`).

---

## 8. Shadow system (alternate branch)

**Shadow** explores counterfactual timelines under a forked `branchId`, with deterministic replay and diff surfaces for merge/discard policy (policy hooks evolve over time).

- **API:** `runShadow(...)` — `apps/client/src/studio/runtime/shadowEngine.ts`
- **Runtime:** `setActiveBranchId`, simulation mode and `patchSimulation` / diff structures interact with how the console surfaces fractures.

Operational pattern: **fork → simulate → inspect diff → merge or discard** (merge semantics remain product-specific; the graph stores the material).

---

## 9. Phase 4 — Causal economy (integrator v1)

**State:** `StudioKernelState.causalEconomy` — cumulative `computeWeight` / `entropyImpact`, optional `maxComputeWeight` / `maxEntropyImpact`.

**Enforcement:** When caps are set (via `patchCausalEconomy`), live appends that stamp causal nodes **reject** if the next charge would exceed a cap:

- `tickMind` — mind nodes
- `registerEntity` — genesis `entity` node
- `applyEntityMoveIntent` — `tool` move or `tool.collision` resolution
- `runShadow` — pre-checks an upper-bound charge from requested ticks + fork lineage, then bills the **actual** simulated node count after the run; updates `lastShadowCharge` on success.

**Materialization:** New nodes carry `payload.economy: { computeWeight, entropyImpact }` from deterministic per-type weights (`causalEconomy.ts`). Unset caps = no enforcement (default).

**Law sketch:** heavy shadowing becomes measurable and **blockable** under operator policy without changing append-only semantics.

---

## 10. Phase 4 — Society layer (roadmap)

Not yet a first-class reducer in the kernel. Intended direction:

- Minds do not only consume their own causal past; above a **resonance** threshold they incorporate **patterns** from peer minds’ public causal bands.
- **Causal resonance** — Mind A’s emitted node biases Mind B’s intent distribution (policy-defined, deterministic where possible).

---

## 11. Kernel Console (operator surface)

The console exposes, among other things:

- Mind vitals strip (mood / focus / energy / entropy samples)
- Registry slices (souls, definitions, instances, links, tools, policies)
- **Causal graph** views: linear recent nodes, DAG edges, fracture/shadow summaries when present
- Simulation mode and shadow messaging

Use it to **read** the compiler output; privileged writes still go through the same kernel APIs.

---

## 12. Operational truth (editing)

In RSK semantics:

- You do **not** retro-edit causal nodes.
- You do **not** patch projection as authority.
- You only **append new reasons** (nodes) permitted by identity, guard, and ontology.

---

## Current vs future one-liner

| Today (v1 manual scope) | After Phase 4 |
|-------------------------|----------------|
| Deterministic causal reality engine with spatialized interaction | Self-interacting causal society engine with cost and resonance policies |

---

## Revision

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-05-04 | Initial Sovereign Operator Edition aligned to studio store exports |
| 1.1 | 2026-05-04 | Causal economy integrator v1 (caps + stamping + shadow billing) |
