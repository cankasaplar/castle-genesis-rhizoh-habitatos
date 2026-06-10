# Castle OS v1.0 — Real-Time Cognitive Environment Runtime (FINALIZED)

**SPECFLOW:** `CORE-ELIGIBLE` · **Status:** core loop lock v1.0  
**Identity:** RTAOS — not chatbot, not voice assistant, not STT pipeline

---

## Architecture (4 deterministic layers + 1 execution zone)

```
(1) Fusion Bus          — immutable append-only ingestion
(2) Attention Field     — temporal weighted reality graph
(3) Spike Engine        — salience collapse function
(4) Co-Presence Kernel  — ActionPlan compiler (no side effects)
─────────────────────────────────────────────────────────────
    Execution Layer     — sole side-effect zone (voice/memory/UI)
```

**Guarantees:**
- Bus ≠ interpretation
- Field ≠ decision
- Kernel ≠ execution

---

## 1. Fusion Bus — NormalizedEventV1 (FROZEN)

```typescript
NormalizedEventV1 {
  id: string
  source: "mic" | "youtube" | "tv" | "camera" | "file" | "web" | "media"
  type: "noise" | "narrative" | "reference" | "intent" | "emergency"
  timestamp: number
  payload: { text?, mediaPositionMs?, vector?, preview? }
  confidence: number
  temporalSpan: "instant" | "short" | "long"
  rawRef: any
}
```

**Rules:** events never mutated · append-only · event = reality atom · equal-weight sources

API: `ingestFusionBusV1(source, payload)`  
SSOT: `castlePerception/castleMultiStreamFusionBusV1.js`

---

## 2. Attention Field — Temporal Weighted Reality Graph

```typescript
AttentionFieldGraph {
  nodes: RealityNode[]     // mass = f(salience, recency, sourceWeight)
  edges: ContextEdge[]
  globalMass: number
  decayFunction: "temporal+salience"   // exp(-λt) * salience
  resonanceZones: Cluster[]
  tickId: number
}
```

**Tick loop:**
```
ingestNewEvents → updateNodeMass → decayOldNodes → computeEdges → computeResonanceZones
```

SSOT: `castlePerception/castleAttentionFieldV1.js`

---

## 3. Spike Engine — Collapse Function

```typescript
Spike {
  type: "intent" | "emergency" | "analytical" | "reference" | "social_call"
  salienceScore: number
  sourceCluster: Cluster | null
}
```

**Collapse rule:** `cluster.mass > threshold && entropy < limit → emitSpike()`  
Fallback: high-mass intent/emergency nodes always collapse.

API: `evaluateSpikeCollapseV1({ graph, field })`  
SSOT: `castlePerception/castleSpikeEngineV1.js`

---

## 4. Co-Presence Kernel — ActionPlanV1 (deterministic)

```typescript
ActionPlanV1 {
  speak: boolean
  memoryWrite: boolean
  shadowWrite: boolean
  uiHighlight: boolean
  priority: number              // 0 | 20 | 50 | 70 | 100
  latencyBudgetMs: number
  deterministic: true
  tickId: number
}
```

**Modes:** `companion` · `co_presence` · `ambient_observer` · `emergency`

Kernel does NOT interpret — only `decideCoPresenceV1(spike, field) → ActionPlan`.

SSOT: `rhizoh/runtime/rhizohCoPresenceKernelV1.js`

---

## 5. Execution Layer — Side Effects Only

```javascript
executeActionPlanV1(plan) {
  if (plan.speak)         → TTS dispatch
  if (plan.memoryWrite)   → temporal anchor graph
  if (plan.shadowWrite)   → shadow turn scaffold
  if (plan.uiHighlight)   → UI highlight event
}
```

SSOT: `castlePerception/castleExecutionLayerV1.js`

---

## Full loop

```javascript
runCastleOsLoopV1({ source, text, ... })
// → bus → field.tick → spike.collapse → kernel.decide → execution.execute
```

SSOT: `castlePerception/castleOsCoreLoopV1.js`

---

## Console

```javascript
window.__castle.immutableEventLog
window.__castle.attentionFieldGraph
window.__castle.lastSpikeCollapse
window.__rhizoh.lastActionPlan
window.__castle.lastExecution
window.__rhizoh.lastOsLoop
```

---

## v1.0 complete · v1.1 Hard Realtime (implemented)

See **[RHIZOH_CASTLE_OS_V1_1.md](RHIZOH_CASTLE_OS_V1_1.md)** — preemption queue, starvation flush, media time-lock, temporal coherence, suspend/resume graph.

---

*Castle OS v1.0 — multi-reality collapsed into one attention graph, decision as ActionPlan, effects only in execution layer.*
