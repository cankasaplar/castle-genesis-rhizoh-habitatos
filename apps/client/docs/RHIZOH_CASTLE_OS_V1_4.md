# Castle OS v1.4 — Reality Dynamics Engine

**SPECFLOW:** `CORE-ELIGIBLE` · **Extends:** [Castle OS v1.3](RHIZOH_CASTLE_OS_V1_3.md)

---

## What v1.3 was missing

v1.3 **composes** multiple realities with linear-ish shares.  
v1.4 **deforms** the field — threads transform each other; attention has inertia.

> v1.3 = multi-thread renderer · v1.4 = cognition physics simulator

---

## The shift

| v1.3 | v1.4 |
|------|------|
| Linear blend | Nonlinear softmax deformation |
| Symmetric interference | Directional interaction (A→B ≠ B→A) |
| Instant context switch | Lagged context + history gradient |
| Static frame | Evolving deformation graph |

---

## New stack layer

```
v1.3 Reality Composition  → linear shares + RealityFrame
           ↓
Thread Interaction Field  → suppresses / enhances / reframes / delays
           ↓
Attention Inertia         → history gradient + cognitive momentum
           ↓
Reality Dynamics Engine   → nonlinear deformation + state graph
           ↓
v1.1 Real-Time Arbitration → execution gate
           ↓
v1.3 Partial Execution
```

---

## Thread Interaction Field

Directed physics — not "how much lower?" but "how transformed?":

```javascript
ThreadInteraction {
  fromThreadId, toThreadId
  suppresses   // e.g. co_watch rhythm-crushes audiobook
  enhances     // technical Q boosts general thread
  reframes     // chat semantically reshapes sports thread
  delays       // lagged response band
}
```

Example: `co_watch_sports → audiobook` = `{ suppresses: 0.42, delays: 0.22 }`

SSOT: `castleThreadInteractionFieldV1_4.js`

---

## Attention Inertia

Identity = state + **history gradient**:

```javascript
AttentionInertiaState {
  currentLens, laggedLens
  historyGradient[]     // weighted past context vectors
  inertiaFactor         // exp decay ~2.8s half-life
  contextShiftPending   // "mind still at the match"
  deferredContextShiftMs
  cognitiveMomentum
}
```

User asks a question while still cognitively in co-watch → sports thread keeps elevated share briefly.

SSOT: `castleAttentionInertiaV1_4.js`

---

## Nonlinear deformation

Shares pass through log-space interaction + inertia, then **softmax** (non-commutative):

```
A influences B → B's logit shifts
B suppresses C → C deformed differently than A+C linear blend
```

Output includes:

- `linearShare` vs `deformedShare` per thread
- `deformationGraph` — state deformation audit trail
- `deformedCompositionWeights`

SSOT: `castleRealityDynamicsV1_4.js` · `applyRealityDynamicsV1_4()`

---

## API

```javascript
runCastleOsLoopV1_4({ source, text, ownerId, ... })

window.__castle.attentionInertia
window.__rhizoh.lastOsLoop.realityDynamics.deformationGraph
window.__rhizoh.lastOsLoop.realityDynamics.deformedPlan
```

---

## Architectural identity

| Layer | Identity |
|-------|----------|
| v1.1 | OS scheduler |
| v1.2 | Multi-agent arbiter |
| v1.3 | Reality compositor |
| **v1.4** | **Cognition physics simulator** |

Rhizoh no longer **calculates** reality — it **lives and deforms** it over time.

Next: audio interleaving bound to `deformedShare`, diarization feeding inertia history.
