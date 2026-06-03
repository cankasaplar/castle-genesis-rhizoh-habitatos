# Rhizoh World Expansion Layer v0.1

**Status:** ACTIVE · **SPECFLOW:** `RESEARCH-ONLY`  
**Parent lock:** [`RHIZOH_WORLD_OS_V0.2_FINAL_ARCHITECTURE_LOCK.md`](RHIZOH_WORLD_OS_V0.2_FINAL_ARCHITECTURE_LOCK.md) — **WORLD tier only**  
**Post-deploy evolution stack** — distribution · evolution · social graph · live editing · continuity without restart

---

## 0. Strategic state

| Already have | Missing (this layer) |
|--------------|----------------------|
| World engine · inhabitation · projection · memory · identity | Distribution · evolution · social graph · live editing · no-restart continuity |

**Priority order (lowest risk → highest scale):**

1. Pet Evolution
2. Studio Live Editor
3. Castle Graph
4. Hot Reload
5. Multi-Region SCR Mesh

---

## 1. Pet Evolution — `rhizohPetEvolutionV0.js`

RCAL-driven adaptive inhabitant · memory imprint · ICL-guided drift.

```javascript
window.__rhizoh.petEvolution
// memory_trace: visited_castles · interaction_weight · emotional_bias
// behavior: drift_rate · adaptation: "icl_guided" · cross_castle_aware
```

---

## 2. Studio Live Editor — `rhizohStudioLiveEditorV0.js`

Controlled perception interface — **suggestion only**, no direct world mutation.

```javascript
import { studioEditV0, STUDIO_EDIT_TARGET_V0 } from "./rhizohStudioLiveEditorV0.js";

studioEditV0({
  target: STUDIO_EDIT_TARGET_V0.CASTLE_PROJECTION,
  mode: "suggestion_only",
  payload: { surface_density: 0.6 }
});
// → window.__rhizoh.studioLiveEditor
```

Safety: `direct_mutation_forbidden === true` · `scr_suggestion_layer_only === true`

---

## 3. Castle Graph — `rhizohCastleGraphV0.js`

Shared projection graph — attention topology nodes on **single WAL + ICL**.

```javascript
window.__rhizoh.castleGraph = {
  mode: "shared_projection_graph",
  constraint: "single_world_only"
}
```

Interaction types: visual echo · studio broadcast · shared agent presence · synchronized drift

---

## 4. Hot Reload Runtime — `rhizohHotReloadRuntimeV0.js`

**World does not restart — it transitions.**

```javascript
window.__rhizoh.hotReloadRuntime = {
  mode: "continuous",
  preserve: ["scr", "wal", "icl", "pet", "studioOrganism"]
}

await executeWorldHotReloadV0({ moduleLabels: ["deploy_patch"] });
```

Lifecycle: update → snapshot T0 → patch modules → restore SCR tick → resume Pet + Studio

---

## 5. SCR Distributed Mesh — `rhizohScrDistributedMeshV0.js`

Multi-region T0 quorum — **only one T0 exists globally**.

```javascript
window.__rhizoh.scrDistributedMesh.syncMode = {
  type: "quorum_t0",
  tolerance_ms: 120,
  fallback: "last_stable_t0"
}
```

Rule: fastest node ≠ truth · ICL-verified T0 = truth

---

## Orchestrator

```javascript
import { primeWorldExpansionLayerV0, tickWorldExpansionLayerV0 } from "./rhizohWorldExpansionLayerV0.js";

await primeWorldExpansionLayerV0();
// → window.__rhizoh.worldExpansionLayer
```

CI:

```bash
npm run ops:world-expansion-v0
```

---

## Final architecture (v0.2 target)

```
Engine → SCR → ICL → WAL
         ↓
   Pet Evolution
         ↓
   Castle Graph Network
         ↓
   Studio Live Editor
         ↓
   Multi-Region SCR Mesh
         ↓
   Hot Reload Runtime
         ↓
        T0 World
```

---

## Result

Rhizoh evolves from **single world simulation system** → **living distributed reality OS**

Under v0.2 lock: expansion modules sit in **WORLD tier** only — no CORE thaw.

---

## Related

- [`RHIZOH_WORLD_OS_V0.2_FINAL_ARCHITECTURE_LOCK.md`](RHIZOH_WORLD_OS_V0.2_FINAL_ARCHITECTURE_LOCK.md)
- [`RHIZOH_DEPLOY_TEST_PHASE_V0.md`](RHIZOH_DEPLOY_TEST_PHASE_V0.md)
- [`RHIZOH_PRODUCTION_AUTOMATION_LAYER_V0.md`](RHIZOH_PRODUCTION_AUTOMATION_LAYER_V0.md)
- [`RHIZOH_PRODUCTION_DEPLOYMENT_RUNBOOK_V0.md`](RHIZOH_PRODUCTION_DEPLOYMENT_RUNBOOK_V0.md)
- [`RHIZOH_MULTI_INHABITANT_CO_PRESENCE_V0.md`](RHIZOH_MULTI_INHABITANT_CO_PRESENCE_V0.md)
