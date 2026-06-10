# Castle OS v1.3 — Reality Composition Engine

**SPECFLOW:** `CORE-ELIGIBLE` · **Extends:** [Castle OS v1.2](RHIZOH_CASTLE_OS_V1_2.md)

---

## What v1.2 was missing

v1.2 answers **whose reality is active** (ownership, room conflict).  
v1.3 answers **how much reality each thread gets** — blend, don't pick one winner.

> v1.0 → perception · v1.1 → time · v1.2 → identity · v1.3 → **reality blending**

---

## The shift

| Before v1.3 | After v1.3 |
|-------------|------------|
| `speak: true \| false` | `speakShare: 0.0–1.0` |
| Single winner thread | Parallel threads with `executionShare` |
| Static `ownerId` | Dynamic `contextualId` (device + mood + lens) |
| Rank threads | Threads **interfere** and degrade each other |

---

## New stack layer

```
Kernel → ActionPlan
           ↓
Room Arbitration v1.2        (ownership gate)
           ↓
Contextual Identity v1.3     (dynamic identity state)
           ↓
Attention Contention Graph     (interference matrix)
           ↓
Reality Composition Engine   (RealityFrame + composedPlan)
           ↓
Real-Time Arbitration v1.1
           ↓
Partial Execution v1.3       (blended side effects)
```

---

## Contextual Identity

Identity ≠ ownership. Same `ownerId`, different reality:

```javascript
ContextualIdentityState {
  ownerId
  contextualId          // owner::device::contextLens
  deviceId
  contextLens           // co_watch | technical | social | ambient | audiobook
  moodVector            // { focus, social, urgency }
  intentWeight
  momentum              // temporal smoothing
}
```

SSOT: `castleContextualIdentityV1_3.js`

---

## Attention Contention Graph

```javascript
ThreadNode {
  threadId
  salience
  decayRate
  interferenceWeight    // sum of cross-thread interference
  executionShare        // normalized % of shared attention
}
```

Threads with overlapping topics (e.g. `co_watch_sports` vs `audiobook`) **degrade** each other's effective salience. Shares normalize to 1.0 — partial coexistence, not elimination.

SSOT: `castleAttentionContentionV1_3.js`

---

## RealityFrame

```javascript
RealityFrame {
  threads: ThreadNode[]
  compositionWeights: number[]
  interferenceMatrix: number[][]
  threadExecutionSlices[]   // per-thread speak/memory/highlight shares
  outputBlend: "speech + memory + highlight" | "background_narrative" | "silent_observe"
  contextualIdentity
}
```

Example co-watch:

| Thread | executionShare | role |
|--------|------------------|------|
| video commentary | ~0.70 | dominant |
| Rhizoh insight | ~0.20 | partial speak |
| user memory | ~0.10 | background anchor |

SSOT: `castleRealityCompositionV1_3.js`

---

## Partial execution

```javascript
composedPlan {
  speakShare, memoryShare, highlightShare
  speak: speakShare >= 0.35
  backgroundNarrative: 0.1 <= speakShare < 0.35
  partialExecution: true
}
```

Effects:

- Full TTS when `speakShare >= 0.35`
- Background narrative TTS when `0.1–0.35`
- Thread-scoped memory writes per slice above threshold
- Room defer reduces ingress share but allows background narrative

SSOT: `executeComposedPlanV1_3` in `castleExecutionLayerV1.js`

---

## API

```javascript
runCastleOsLoopV1_3({ source, text, ownerId, deviceId, contextLens, ... })

window.__castle.contextualIdentity
window.__castle.lastOsLoop.realityComposition
window.__rhizoh.lastOsLoop.realityComposition.realityFrame
```

---

## Architectural identity

Rhizoh is no longer a **speaking assistant** choosing one response.

It is a **real-time narrator** composing multiple concurrent realities with measurable attention shares.

Next natural layers (not in v1.3):

- Multi-signal speech synthesis (true audio interleaving)
- Voice diarization → automatic `contextualId` from mic
- Network-synced contention graph across room nodes
