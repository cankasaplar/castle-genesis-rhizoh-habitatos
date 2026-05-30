# Rhizoh Cross-Layer Awareness Graph (CLAG) v0

**SPECFLOW:** `RESEARCH-ONLY` — **ARCHITECTURE FROZEN** (stabilization pass). Product surface → [`RHIZOH_RUNTIME_STABILITY_LAYER_V0.md`](RHIZOH_RUNTIME_STABILITY_LAYER_V0.md) only.

## System definition (v0)

Not “graph + state + logging.” Current shape:

**Partitioned epistemic system with constrained operational manifold**

| Space | Registry | Role |
|-------|----------|------|
| Epistemic | `fullNodeRegistry` | Truth / design-time — simulation, latent, audit |
| Operational | `activeNodeRegistry` | Execution manifold — 2 sovereign nodes only |
| Calibration | `calibrationAnchorReference` | Meta-reference (Sarıyer geo stabilizer) — never active |

Pipeline (observation path):

`input → epistemic graph → filtered projection → sovereign execution view → post-hoc influence analysis`

**Not** classic `input → model → output` on the full graph.

`graphContamination` is a **measured runtime state**, not a post-debug surprise.

## Power balance

| Layer | Domain | Constraint |
|-------|--------|------------|
| Sovereign (2 nodes) | Metehan Ankara · Beşiktaş Serencebey | Hard execution boundary |
| Epistemic (full graph) | Sarıyer, Kadıköy, latent | Audit-only in runtime |
| Meta influence | narrative · academy · depth | Damped via projection-safe reduction |

Principle: **everything visible, not everything executable.**

## Purpose

Single map for:

| Layer | CLAG node | Typical edges |
|-------|-----------|---------------|
| Conversation | `conversation` | phase FSM → shapes memory |
| Narrative | `narrative` | story snapshot → shapes dialogue |
| Studio | `studio` | decisions → narrative impact |
| Spiral | `spiral` | mesh/agreement → real_life mapping |
| Real life | `real_life` | geographic anchor → grounds scene |
| Academy | `academy` | L11 focus → studio path |
| Depth | `depth` | mode/depth → influences conversation |
| Influence | `influence` | measured shaper → propagates depth |
| Social | `social` | optional pulse node |

## Full schema vs active runtime (node registry)

| Registry | Contents |
|----------|----------|
| **fullNodeRegistry** | Design-time: active sovereign + simulation (Sarıyer) + latent anchors |
| **activeNodeRegistry** | Execution-time sovereign only: **Metehan Ankara** + **Beşiktaş Serencebey** |

- Sarıyer (`anchor_sariyer_stability`) = **simulation_calibration** — never in `activeNodeRegistry`
- `graph.nodes` / `graph.edges` = **active runtime view only** (influence MUST use this)
- `fullNodes` / `fullEdges` = audit slice including blocked simulation nodes
- `graphContamination.detected` = simulation anchor attempted on runtime path

Module: `rhizohClagNodeRegistryV0.js`

## Graph traversal policy (explicit routing)

**Module:** `rhizohClagTraversalPolicyV0.js`

| Rule | Value |
|------|--------|
| Strategy | `priority_outbound_v0` |
| Profiles | `llm_turn` · `living_world_frame` · `studio_decision` |
| Seed order | Profile-specific node-kind list (not implicit BFS) |
| Edge priority | `shapes_memory` > `influences` > `maps_to` > `propagates` |
| Limits | max 4 hops · min edge weight 0.2 |

**Canonical chains (SSOT):**

- `studio_decision_narrative_impact` — studio → narrative → conversation
- `spiral_real_life_mapping` — spiral → real_life → narrative
- `measured_influence_depth` — influence → depth → conversation
- `conversation_memory_shaping` — conversation → narrative
- `academy_studio_propagation` · `depth_modes_conversation` · `geo_scene_grounding`

Each graph build attaches `traversalPlan`: `primaryRoute`, `layerRoutingOrder`, `traversalSteps`, `canonicalRoutes.matched|rejected`.

Console: `window.__CASTLE_RHIZOH_CLAG__.traversalPlan`

## Projection-safe influence (soft contamination guard)

Meta layers (narrative, academy) can score high while sovereign set is constrained. When `graphContamination.detected` or simulation spatial echo is present, `applyProjectionSafeInfluenceReductionV0` dampens meta-layer shaper scores before the influence bundle is emitted — **projection-safe reduction**, not a second graph.

Bundle fields: `projection_safe_influence`, `conversation_shaper.projectionSafe`.

Inference ≠ execution: meta-layer signal is **attenuated** on the observation path; sovereign state is not overwritten unless explicit cognition flags are on (default off).

## Tradeoff: over-partitioning

Strong separation improves stability and kills hallucinated influence, but can **reduce emergent coupling** — some cross-layer “side effects” are innovation sources.

Mitigation (not implemented v0): **controlled leakage layer** — safe cross-node resonance without contamination.

## Bounded Emergence Allocator (BEA) v0

**RESEARCH-ONLY** — answers: *how much emergence is allowed this tick?*

Module: `rhizohClagBoundedEmergenceAllocatorV0.js` · attached as `graph.boundedEmergence`.

| Field | Meaning |
|-------|---------|
| `resonanceBudget01` | Total allowed bounded mixing (default 0.15; halved if contamination) |
| `emergenceBudgetRemaining` | Budget minus spent resonance |
| `controlledResonance` | Allowlisted resonance edges (sovereign cross, meta→sovereign, traversal echo) |
| `regime` | `nominal` \| `contaminated_capped` |
| `executionApplied` | Always `false` (observational allocator) |

Principle: **uncontrolled contamination ❌ · bounded resonance ✔**

Graph is not closed or unlimited — it is **directed and budgeted**.

```bash
# Optional cap (0..1)
# VITE_RHIZOH_BEA_RESONANCE_BUDGET=0.15
```

Console: `window.__CASTLE_RHIZOH_CLAG__.boundedEmergence`

## Temporal BEA v0 (time-aware emergence budgeting)

Module: `rhizohClagTemporalBeaV0.js` — wraps static BEA per session.

| Phase | Meaning |
|-------|---------|
| `accumulate` | Pool refills; low spend |
| `conserve` | Contamination or high pool — protect stability |
| `release` | Stable nominal streak + pool threshold → **controlled surprise** (resonance boost, observability only) |

Fields: `temporal.strategicFlow`, `temporal.tickHistory`, `controlledSurpriseInjected`, `emergencePoolRemaining01`.

Mitigates **over-regulation → under-emergence collapse** without unbounded chaos.

```js
window.__CASTLE_RHIZOH_CLAG__.boundedEmergence.temporal.strategicFlow
```

## Phase Coupling Graph v0

Module: `rhizohClagPhaseCouplingGraphV0.js` — binds **phase scheduler ↔ node activation**.

| Phase | Dominant coupling |
|-------|-------------------|
| `accumulate` (inhale) | depth · low cross-sovereign |
| `conserve` (hold) | influence watch · variance suppression |
| `release` (exhale) | narrative + sovereign spike |

Fields: `phaseCouplingGraph.phaseTransition`, `nodeAffinities`, `phaseCouplingEdges`, `dominantNodesThisPhase`, `schedulerSurface` (calibration-sensitive).

```js
window.__CASTLE_RHIZOH_CLAG__.phaseCouplingGraph
```

## Inter-Phase Memory Persistence (IPMP) v0

Module: `rhizohClagInterPhaseMemoryV0.js` — **explicit** cross-phase meaning (no longer implicit).

| Carrier kind | Carries |
|--------------|---------|
| `narrative_thread` | Open threads |
| `sovereign_echo` | Active sovereign labels |
| `route_echo` | Primary traversal chain |
| `contamination_regime` | Simulation exclusion memory → conserve |
| `surprise_residue` | Release pulse → next accumulate |
| `spatial_echo` | Place / sovereign spatial label |

Fields: `semanticCarriers`, `explicitMeaningTransfer`, `phaseMemoryLedger`, `persistenceSummary`.

```js
window.__CASTLE_RHIZOH_CLAG__.interPhaseMemory.explicitMeaningTransfer
// carriedIntoThisPhase, bornThisTick, transition — implicitBefore: false
```

## Semantic Forgetting Regulator (SFR) v0

Module: `rhizohClagSemanticForgettingRegulatorV0.js` — IPMP carries; SFR **resolves**.

| Action | When |
|--------|------|
| **Forget** | Weak strength · surprise absorbed in accumulate · contamination cleared · phase arc done |
| **Compress** | Multiple sovereign echoes → `dual_sovereign_field` · thread bundle |
| **Retain** | Still meaningful carriers |

```js
window.__CASTLE_RHIZOH_CLAG__.semanticForgetting
// forgottenCarriers, compressedCarriers, retainedCarriers, naturalResolution
```

Principle: **carry forward with natural resolution** — not infinite memory growth.

## Observability vs cognition

| | Observability (CLAG default) | Cognition |
|--|---------------------------|-----------|
| Logs | `[CASTLE_clag]` | depth, story engine, LLM |
| Mutates execution | **No** | **Yes** |
| Memory shaping | Hints only | `VITE_RHIZOH_CLAG_MEMORY_SHAPING=1` (experimental, off) |

## Console

```js
window.__CASTLE_RHIZOH_CLAG__
// layerVisibility, nodes, edges, memoryShapingHints
```

## Code

| Module | Role |
|--------|------|
| `rhizohCrossLayerAwarenessGraphV0.js` | Graph store, ingest, hints |
| `rhizohClagTraversalPolicyV0.js` | Traversal policy + canonical chains |
| `rhizohClagNodeRegistryV0.js` | full vs active registry · contamination filter |
| `rhizohClagProjectionSafeInfluenceV0.js` | Meta-layer damp · soft contamination guard |
| `rhizohClagTurnBridgeV0.js` | `runRhizohClagForLlmTurnV0` · `runRhizohClagForLivingWorldFrameV0` |

## Wiring

- **Living world (prod entry):** `AppRhizoh528.jsx` → `runRhizohClagForLivingWorldFrameV0` on `entryModel` change
- **LLM turns:** call `runRhizohClagForLlmTurnV0` from the chat/send path before `fetch(/rhizoh/llm)` (Castle Flight / legacy chat when merged)

## Env

```bash
# Optional read-side memory hints into story engine (off by default)
# VITE_RHIZOH_CLAG_MEMORY_SHAPING=0
```
