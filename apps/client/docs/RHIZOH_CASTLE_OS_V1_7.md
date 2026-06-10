# Castle OS v1.7 — Stability Memory Learning Loop

**SPECFLOW:** `CORE-ELIGIBLE` · **Extends:** [Castle OS v1.6](RHIZOH_CASTLE_OS_V1_6.md)

---

## Architectural break

| Version | Stability model |
|---------|-----------------|
| v1.6 | Negotiation **per session** |
| v1.7 | Negotiation becomes **learned personality physics** |

> Stability is no longer a property of the system.  
> It is a property of the **interaction** — and that interaction **accumulates memory**.

Identity: **Adaptive cognitive physics system with learned human coupling**

Not global AI behavior → **per-session cognitive physics** that learns across sessions.

---

## Stack

```
v1.5 Stability Governor (system inference)
        ↓
v1.6 Co-Governor (negotiation field)
        ↓
v1.7 Stability Memory Graph (learn + apply priors)
        ↓
Execution
```

---

## UserPhysicsProfile

```javascript
{
  stabilityPreferenceCurve,      // morning / afternoon / evening / night
  interruptionToleranceMap,      // per modality override tolerance
  modalityBiasGraph,             // co_watch / social / focus / video / general
  contextSwitchLatencyProfile,   // meanMs, overrideRate, sampleCount
  driftEvents                    // when user overrides system phase
}
```

---

## Three learning axes

| Axis | What it learns |
|------|----------------|
| **Stability Memory Graph** | Personal physics curve per user |
| **Context Drift Learning** | When / why user overrides system inference |
| **Modality Preference Field** | Match / chat / video / audiobook stability curves |

---

## Context drift

Recorded when:
- user sends stability feedback AND
- system phase ≠ resolved phase AND
- negotiation magnitude ≥ threshold

Feeds `interruptionToleranceMap` and `contextSwitchLatencyProfile.overrideRate`.

---

## API

```javascript
window.__rhizoh.getUserPhysicsProfile("user_local")
window.__rhizoh.lastOsLoop.stabilityMemory
window.__rhizoh.lastOsLoop.stabilityMemory.contextDrift
```

Passive ticks apply learned priors even without explicit user command — system anticipates user's stability curve.

---

## Product truth

Solves **AI situational coherence** over **AI consistency**:

Each session carries its own physics contract, informed by accumulated human coupling — not a single global assistant personality.
