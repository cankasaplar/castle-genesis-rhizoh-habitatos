# Castle OS v1.5 — Reality Stability Layer

**SPECFLOW:** `CORE-ELIGIBLE` · **Extends:** [Castle OS v1.4](RHIZOH_CASTLE_OS_V1_4.md)

---

## What v1.4 was missing

v1.4 **deforms** reality with interaction physics — but everything drifts continuously.  
v1.5 adds **stability governance** — trackable, phase-based, learnable cognition interface.

> v1.4 = physics simulator · v1.5 = **usable cognition interface**

---

## New capabilities

| Gap in v1.4 | v1.5 answer |
|-------------|-------------|
| Static rule table | **Adaptive interaction weights** (observation ledger) |
| Scalar inertia | **Vector inertia** + asymmetric resistance matrix |
| Continuous drift | **Phase model** (stable / transitional / volatile / locked) |
| No freeze semantics | **Context freeze / resume** snapshots |

---

## Stack

```
v1.4 Reality Dynamics
        ↓
Adaptive Interaction (learned edge weights)
        ↓
Inertia Vector Field (direction + resistanceMatrix)
        ↓
Reality Phase Engine
        ↓
Stability Governor → stabilizedPlan / stabilizedFrame
        ↓
Execution
```

---

## Reality phases

| Phase | Behavior |
|-------|----------|
| `stable` | Damp deformation (35% scale), allow learning |
| `transitional` | Partial deformation during context shift |
| `volatile` | Full deformation, low inertia cap |
| `locked` | Freeze-frame shares (~4s hold), no learning |

---

## Vector inertia

```javascript
inertiaVector = {
  magnitude,
  direction,           // lens transition vector
  transitionResistance, // match→social hard, social→match easier
  resistanceMatrix      // full asymmetric table
}
```

User intent > 0.75 reduces transition resistance (intent override).

---

## Adaptive interaction

Rule table priors are scaled by learned multipliers per directed edge.  
High volatility + user intent can **invert suppresses** (audiobook-dominant scenario).

---

## API

```javascript
runCastleOsLoopV1_5({ source, text, userInitiated, ... })

window.__rhizoh.lastOsLoop.realityStability.phase
window.__rhizoh.lastOsLoop.realityStability.stabilizedPlan
window.__rhizoh.resumeRealityContext(ownerId)
```

---

## Architectural evolution

| Version | Role |
|---------|------|
| v1.4 | Interaction physics |
| **v1.5** | **Stability + learning dynamics** |

Rhizoh reality is now **deformed but governable** — watchable, not endlessly sliding.
