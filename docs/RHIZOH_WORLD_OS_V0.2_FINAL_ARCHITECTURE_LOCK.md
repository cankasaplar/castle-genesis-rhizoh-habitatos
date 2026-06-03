# Rhizoh World OS v0.2 — Final Architecture Lock

**Status:** **LOCKED** · **SPECFLOW:** governance SSOT (no new runtime primitives from this doc)  
**Effective:** 2026-06-03  
**Supersedes:** ad-hoc expansion / layer design discussions post v0.1 expansion stack

---

## 0. Concept lock

Rhizoh is now a **three-part system**:

| Tier | Role | Immutable? |
|------|------|------------|
| **1. CORE** | Engine · SCR · ICL · WAL · Pet (inhabited validator) | **Yes** — frozen subgraph; no new ontology |
| **2. WORLD** | Living simulation — castle graph · co-presence · studio organism · multi-region SCR mesh | Evolves under expansion modules; **single world only** |
| **3. PRODUCT SURFACE** | rhizoh.com — UI · Studio · Drawer · Cesium · Pet overlay · Cap Wheel · social outputs | **Read-only projection** — never owns truth |

**Final sentence:** Rhizoh is no longer “a system being designed.” It is **world runtime + product surface separation — complete**.

---

## 1. Final system map

```
                ┌──────────────────────────┐
                │   RHIZOH CORE (ENGINE)   │
                │ SCR · ICL · WAL · PET    │
                └────────────┬─────────────┘
                             │
                             ▼
        ┌────────────────────────────────────┐
        │      WORLD SIMULATION LAYER        │
        │  Castle · CoPresence · Studio      │
        │  Multi-region SCR mesh             │
        └────────────┬───────────────────────┘
                             │
                             ▼
        ┌────────────────────────────────────┐
        │     PRODUCT SURFACE (rhizoh.com)   │
        │ UI · Studio · Drawer · Cesium      │
        │ Pet Marker · Cap Wheel · Social    │
        └────────────────────────────────────┘
```

**Stack order (runtime bootstrap):** SCR → WAL → ICL → Pet → Studio organism → Castle → Co-presence → (expansion layer optional post-deploy)

---

## 2. Logical repo structure (monorepo mapping)

Logical names below map to **existing** Castle monorepo paths — **no physical split required** for v0.2 lock.

| Logical | Actual path (SSOT) |
|---------|-------------------|
| **/rhizoh-core/engine** | `apps/client/src/rhizoh/runtime/` — T0 frame, presence, experience continuity |
| **/rhizoh-core/scr** | `rhizohT0UnifiedPresenceFrameV0.js`, SCR tick + coherence modules |
| **/rhizoh-core/icl** | `rhizohIdentityConsistencyLayerV0.js` |
| **/rhizoh-core/wal** | `rhizohWorldActionLogV0.js`, `rhizohWorldWalPersistenceV0.js` |
| **/rhizoh-core/pet** | `rhizohPetCitizenRuntimeV0.js`, `rhizohPetEvolutionV0.js` |
| **/rhizoh-world/castle** | `rhizohCastleProjectionLayerV0.js`, `rhizohCastleGraphV0.js`, `rhizohCastleCoherenceHardeningV0.js` |
| **/rhizoh-world/copresence** | `rhizohMultiInhabitantCoPresenceV0.js` |
| **/rhizoh-world/studio-organism** | `rhizohStudioProductionOrganismV0.js`, `rhizohStudioExecutionLoopV0.js`, `rhizohStudioLiveEditorV0.js` |
| **/rhizoh-world/multi-region** | `rhizohScrDistributedMeshV0.js`, `rhizohHotReloadRuntimeV0.js` |
| **/rhizoh-product/ui** | `apps/client/src/rhizoh/product/`, T0 shell chrome |
| **/rhizoh-product/studio-ui** | Studio routes · `/studio` — [`rhizohProductTopologyV0.js`](../apps/client/src/rhizoh/product/rhizohProductTopologyV0.js) |
| **/rhizoh-product/cap-wheel** | RSBL `cap_wheel` surface — [`rhizohSurfaceBindingLayerV0.js`](../apps/client/src/rhizoh/runtime/rhizohSurfaceBindingLayerV0.js) |
| **/rhizoh-product/drawer** | Command panel / aux stack — [`rhizohCommandPanelPrefsV0.js`](../apps/client/src/rhizoh/runtime/rhizohCommandPanelPrefsV0.js) |
| **/rhizoh-product/cesium** | `apps/client/src/castleFlight/cesiumWorldProjectionBind.js` |
| **/rhizoh-product/pet-overlay** | Pet spatial geo + citizenship pulse surfaces |
| **/rhizoh-product/social-outputs** | `apps/client/src/rhizoh/social/` — export/share only |
| **/rhizoh-deploy** | `ops/`, `scripts/`, [`.github/workflows/rhizoh-production.yml`](../.github/workflows/rhizoh-production.yml) |
| **/rhizoh-docs** | `docs/` — system-spec · runtime-spec · product-spec |

World artifacts post-build: `dist/{ui,scr,studio,castle,pet}` — see [`RHIZOH_PRODUCTION_AUTOMATION_LAYER_V0.md`](RHIZOH_PRODUCTION_AUTOMATION_LAYER_V0.md).

---

## 3. Product surface rules (golden rule)

> **Product layer NEVER owns truth.**

| Product MAY | Product MUST NOT |
|-------------|------------------|
| Read SCR live state | Write SCR |
| Read WAL snapshots / replay | Create world state |
| Read ICL state | Originate Pet motion |
| Render castle projection | Modify castle truth |
| Submit studio **suggestions** (`suggestion_only`) | Direct world mutation |

Enforcement references:

- Studio live editor: `direct_mutation_forbidden` — [`rhizohStudioLiveEditorV0.js`](../apps/client/src/rhizoh/runtime/rhizohStudioLiveEditorV0.js)
- World surface policy: map ≠ world — [`rhizohWorldSurfacePolicyV0.js`](../apps/client/src/rhizoh/runtime/rhizohWorldSurfacePolicyV0.js)
- Epistemic firewall: `npm run formal:epistemic-firewall-grep`

---

## 4. rhizoh.com role (final)

**rhizoh.com is not a world editor — it is a world window.**

| Displays | NOT |
|----------|-----|
| Studio UI (observer + suggestion only) | Engine |
| Pet inhabited indicator | Backend state owner |
| Castle projections | WAL writer from UI |
| Co-presence graph | SCR authority |
| SCR live state | |
| WAL replay viewer | |

Product routes: [`CASTLE_SYSTEM_TOPOLOGY_V1.md`](CASTLE_SYSTEM_TOPOLOGY_V1.md) · [`rhizohProductTopologyV0.js`](../apps/client/src/rhizoh/product/rhizohProductTopologyV0.js)

---

## 5. Deploy flow (fixed)

```
GitHub → CI Gates
        ↓
     Render (CORE — rhizoh-core)
        ↓
   Firebase (Studio UI)
        ↓
   Edge (rhizoh.com)
        ↓
   60s World Observation Window
        ↓
   ICL + SCR + Pet validation
        ↓
   LIVE WORLD ACTIVE
```

Commands: [`RHIZOH_DEPLOY_TEST_PHASE_V0.md`](RHIZOH_DEPLOY_TEST_PHASE_V0.md) · `npm run ops:deploy-test-phase-v0`

---

## 6. User system model (product decision)

Onboarding is **world entry**, not system explanation.

| Step | Experience |
|------|------------|
| 1 | User enters rhizoh.com |
| 2 | Joins SCR presence |
| 3 | Sees Pet inhabitation |
| 4 | Sees Castle projection |
| 5 | Studio appears as **observation surface** |
| 6 | Co-presence activates |

Entry helpers: [`rhizohWorldSurfacePolicyV0.js`](../apps/client/src/rhizoh/runtime/rhizohWorldSurfacePolicyV0.js) · [`FRIEND_ZERO_FRICTION_ONBOARDING_V0.1.md`](../apps/client/docs/FRIEND_ZERO_FRICTION_ONBOARDING_V0.1.md) (research / private outreach)

---

## 7. Social / external outputs (future-safe)

| ALLOWED | FORBIDDEN |
|---------|-----------|
| Export snapshot | External world mutation |
| Castle share links | Cross-world state writing |
| Studio scene share | |
| Pet trace share | |
| WAL replay share | |

---

## 8. Architectural guarantees (v0.2)

| Guarantee | Status |
|-----------|--------|
| Single world | ✔ locked (`single_world_only`, ICL `same_world`) |
| Persistent world | ✔ WAL + ICL continuity |
| Inhabited world | ✔ Pet validator |
| Shared world | ✔ Castle graph + co-presence |
| Observable world | ✔ SCR + live monitor |
| Deployable world | ✔ automation layer + runbook |

---

## 9. Final lock statement

From this point forward:

| Forbidden | Allowed |
|-----------|---------|
| New system design | Deploy |
| New core layer | Test |
| New ontology | Productization |
| | Stabilization |

World expansion modules ([`RHIZOH_WORLD_EXPANSION_LAYER_V0.1.md`](RHIZOH_WORLD_EXPANSION_LAYER_V0.1.md)) are **WORLD tier only** — no CORE thaw.

---

## 10. window.__rhizoh SSOT (post-lock)

| Key | Tier |
|-----|------|
| `presenceFrame`, `experienceContinuity` | CORE / SCR |
| `worldIdentityConsistency` | CORE / ICL |
| `worldActionLog` | CORE / WAL |
| `petCitizen`, `petEvolution` | CORE / WORLD |
| `castleProjection`, `castleGraph`, `coPresence` | WORLD |
| `studioProductionOrganism`, `studioLiveEditor` | WORLD |
| `scrDistributedMesh`, `hotReloadRuntime` | WORLD |
| `worldBootStatus`, `deployStatus`, `liveMonitor` | DEPLOY |
| Product chrome / topology | PRODUCT (read-only) |

---

## Related

- [`RHIZOH_DEPLOY_TEST_PHASE_V0.md`](RHIZOH_DEPLOY_TEST_PHASE_V0.md) — **next operational phase**
- [`RHIZOH_PRODUCTION_AUTOMATION_LAYER_V0.md`](RHIZOH_PRODUCTION_AUTOMATION_LAYER_V0.md)
- [`RHIZOH_PRODUCTION_DEPLOYMENT_RUNBOOK_V0.md`](RHIZOH_PRODUCTION_DEPLOYMENT_RUNBOOK_V0.md)
- [`RHIZOH_WORLD_EXPANSION_LAYER_V0.1.md`](RHIZOH_WORLD_EXPANSION_LAYER_V0.1.md)
- [`RHIZOH_V1_ARCHITECTURAL_STATE_V1.0.md`](RHIZOH_V1_ARCHITECTURAL_STATE_V1.0.md) — prior control-plane snapshot (causal isolation)
