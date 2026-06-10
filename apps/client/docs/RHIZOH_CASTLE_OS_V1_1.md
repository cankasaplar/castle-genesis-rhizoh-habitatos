# Castle OS v1.1 — Hard Realtime + Preemption Kernel

**SPECFLOW:** `CORE-ELIGIBLE` · **Extends:** [Castle OS v1.0](RHIZOH_CASTLE_OS_V1.md)

---

## What v1.0 was missing

v1.0 selects the **right thing** at the **right reasoning time**.  
v1.1 adds **right moment execution** — interrupt-aware, preemptive, resumable.

> interrupt ≠ drop · interrupt = suspend + resume graph

---

## New layer (between Kernel and Execution)

```
Kernel → ActionPlanV1
           ↓
Real-Time Arbitration Layer v1.1
           ↓
gatedActionPlan | deferredAction | preemptAction
           ↓
Execution Layer (side effects only)
```

SSOT: `castlePerception/castleRealtimeArbitrationV1.js`

---

## Priority matrix

| Signal class | Base priority |
|--------------|---------------|
| Emergency voice | 100 |
| Direct address ("Rhizoh") | 90 |
| Live interaction (question) | 70 |
| Media content | 45 |
| Background noise | 15 |

---

## Arbitration dispositions

| Disposition | Meaning |
|-------------|---------|
| `execute` | Safe to run now |
| `defer` | Queued — lower priority vs running execution |
| `preempt` | Suspend current → run higher priority |
| `gate` | No side effects / blocked |

**Starvation prevention:** deferred plans gain +5 priority every 2s (max +25), flushed when idle.

**Media time-lock:** low-priority speak deferred during active co-watch (youtube/tv/media mass).

---

## Supporting modules

| Module | Role |
|--------|------|
| `castleExecutionStateV1.js` | RUNNING / SUSPENDED / IDLE + resume graph |
| `castleTemporalCoherenceV1.js` | "What were we doing?" activity keeper |
| `castleRealtimeArbitrationV1.js` | Scheduler + preemption queue + conflict resolver |

---

## API

```javascript
runCastleOsLoopV1_1({ source, text, ... })
// → arbitration + executeArbitratedPlan

window.__rhizoh.releaseSpeakExecution()  // TTS done → idle, enables resume/deferred flush
window.__castle.executionState
window.__castle.temporalCoherence
window.__castle.arbitration // via lastOsLoop.arbitration
```

---

## Identity shift

| v1.0 | v1.1 |
|------|------|
| Attention OS | Interrupt-aware cognition |
| Tick-based decision | Preemptive scheduling |
| Correct analysis | Correct analysis **at the right instant** |

---

*Castle OS v1.1 — the world can interrupt; Rhizoh suspends, responds, resumes.*
