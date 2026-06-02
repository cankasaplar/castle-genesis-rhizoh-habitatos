# Castle Layers — Single Evolution Pipeline v1

**Tag:** `CORE-ELIGIBLE` · **Status:** SSOT (behavior graph + deploy unit)  
**Code:** [`castleLayerBehaviorGraphV1.js`](../apps/client/src/castle/layers/castleLayerBehaviorGraphV1.js) · [`castleLayerRuntimeResolverV1.js`](../apps/client/src/castle/layers/castleLayerRuntimeResolverV1.js) · [`castleLayerRegistryV1.js`](../apps/client/src/castle/layers/castleLayerRegistryV1.js)  
**Parent:** [`CASTLE_SYSTEM_TOPOLOGY_V1.md`](CASTLE_SYSTEM_TOPOLOGY_V1.md)

## Binding rule (immutable)

> **CASTLE LAYERS = runtime truth.** Code is the interpreter; behavior changes ship as **layer graph snapshots**, not ad-hoc UI/voice patches per deploy track.

| ❌ Closed | ✔ Open |
|---------|--------|
| T0 / spatial / app-shell drift patches | Layer override on global graph |
| Feature-local prod fixes | `castle.layers.v1.x` snapshot deploy |
| Branch-specific voice behavior | Same semantic contract for all users |

## Stack model (L0–L4)

| Layer | Id | Owns |
|-------|-----|------|
| **L0 Perception** | `L0_perception` | STT · temporal smoothing · script/locale guard |
| **L1 Cognitive** | `L1_cognitive` | Intent routing · command vs dialogue · confidence gate |
| **L2 Voice domain** | `L2_voice_domain` | `t0_shell` / `spatial_shell` / `ingress` scope · UI binding |
| **L3 Social kernel** | `L3_social_kernel` | Familiarity · attention · relationship kernel |
| **L4 Execution** | `L4_execution` | Commands · UI actions · LLM dispatch |

Current graph version: **`castle.layers.v1.1`**

## Decision explainability (v1.1)

**Code:** [`castleLayerDecisionTraceV1.js`](../apps/client/src/castle/layers/castleLayerDecisionTraceV1.js) · [`castleLayerVoiceExecutionGateV1.js`](../apps/client/src/castle/layers/castleLayerVoiceExecutionGateV1.js)

Two enforcement levels:

| Level | Mechanism |
|-------|-----------|
| **Observation** | Voice logs inject `castleLayer` context via resolver |
| **Execution** | `evaluateCastleLayerVoiceExecutionV1` before `STT_DISPATCH`; scope mismatch → `STT_DISPATCH_SCOPE_REJECT` |

Each reject / dispatch records:

- `decisionPath` — L0→L4 rule chain with pass/fail
- `primaryRejectLayer` / `primaryRejectReason` — first failing step
- `scopeMismatchChain` — expected vs got ui domain
- `eligibilityBreakdown` — hasText · scopeMatch · sanity · router · commitment · dedup

HUD (`RhizohCastleLayersDebugV0`) shows last trace under **DECISION TRACE**. Window snapshot: `window.__CASTLE_LAYERS_DECISION_TRACE__`.

## Voice event contract (mandatory)

Every voice log / dispatch path resolves:

```
eventTag → layer (L0–L4)
         → uiDomain (active shell)
         → scopeMatch (cross-domain guard)
         → executionEligible (dispatch yes/no)
```

Cross-domain rule: `uiDomain !== activeUiDomain` → **shadow-only** (no UI mutation).  
Implementation: [`castleLayerRuntimeResolverV1.js`](../apps/client/src/castle/layers/castleLayerRuntimeResolverV1.js) · [`rhizohVoiceUiDomainV0.js`](../apps/client/src/rhizoh/runtime/rhizohVoiceUiDomainV0.js).

## Deploy model

| Old | New |
|-----|-----|
| feature / patch / UI-fix deploy | **Castle Layer snapshot deploy** |
| env drift per branch | [`rhizoh-spatial-main-prod-profile.mjs`](../scripts/rhizoh-spatial-main-prod-profile.mjs) bakes env; graph version in bundle |

Pipeline:

1. Layer patch (graph + registry)
2. Simulation / unit tests (`castleLayerRuntimeResolverV1.test.js`)
3. Shadow (observation-only rollout — `shadowOnly` events)
4. Global hosting deploy

## Versioning

- `castle.layers.v1.0` — initial resolver + L0–L4 map + scope guard
- `castle.layers.v1.1` — execution gate + decision trace graph + HUD extension
- `castle.layers.v1.2+` — threshold / router rule changes (requires impact statement)

Each version snapshot includes: STT config refs · voice router rules · UI domain map · gating thresholds · registry layer ids.

## Castle Layer Impact Statement (required for every change)

1. **Which layer changes?** (L0–L4 id)
2. **Which layers are affected downstream?** (cascade map)
3. **Which scope can break?** (`t0_shell` | `spatial_shell` | `ingress` | cohort)

## Observability HUD

Layer id: `castle_layers_pipeline_hud` · component: `RhizohCastleLayersDebugV0`  
Env gate: `VITE_CASTLE_LAYERS_DEBUG=1` (prod profile default for cohort).  
Shows graph version + active `uiDomain` + gateway / Cesium / voice rows.

## Naming clarity

| Name | Meaning |
|------|---------|
| CI **`spatial-main`** | Deploy **main branch** — default product = `AppRhizoh528T0` |
| **`spatial_shell`** | UI mount — only when `VITE_RHIZOH_SPATIAL_SHELL=1` |
| **`t0_shell`** | Default rhizoh.com monolith mount |

Deploy track name ≠ UI mount name. Scope routing uses **mount ids**, not CI track labels.

## Next increments (v1.2+)

- JSON export of full behavior graph for offline simulation
- CI gate: bundle must contain `castle.layers.v1.x` string + resolver self-test
