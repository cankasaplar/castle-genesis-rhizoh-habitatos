# Rhizoh Studio Demo Seed v0

**SPECFLOW:** `RESEARCH-ONLY` — interpretation-only sample ingest; not life automation.

## Problem

Fresh sessions show `lifeOsStatus: DORMANT` until manual console ingest. Investors see empty memory graph despite working motors.

## Solution

`runStudioObservationDemoSeedV0()` — one-shot sample:

1. Calendar event (`Focus block`)
2. Media playhead event
3. Cross-space fusion tick
4. Returns updated `studioVisibility()` snapshot

**No mutation** · `feedbackToExecution: false` · same governance as console probes.

## UI

Studio Life Memory panel → **"Demo seed"** button when status is DORMANT or memory empty.

## Console

```javascript
await __rhizoh.studioDemoSeed()
__rhizoh.lifeOsStatus()   // ACHIEVED after seed
__rhizoh.studioVisibility()
```

*Observation ≠ Execution*
