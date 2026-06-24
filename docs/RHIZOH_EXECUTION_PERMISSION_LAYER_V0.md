# Rhizoh Execution Permission Layer v0

**SPECFLOW:** `RESEARCH-ONLY` — unifies governance + admission read model; **no new execution authority**.

## Gap closed

| Before | After v0 |
|--------|----------|
| Calendar ingest with no action trigger semantics | `calendarActionTriggerV0` → suggest-only intents |
| Media ingest with no observation feedback cycle | `mediaFeedbackObservationLoopV0` → memory + ledger projection |
| Fragmented permission vocabularies | `executionPermissionLayerV0` → single pre-flight snapshot |

## Law

- **Observation ≠ execution** — permission layer **labels** only; never calls WAL, CubeState, or player controls.
- Calendar **action trigger** = `executionClass: "suggest"` intent packet, gated by `evaluateExecutionPermissionV0`.
- Media **feedback loop** = one-way observation cycle (`ingest → shadow → memory → ledger`); `feedbackToExecution: false`.

## Module map

| Module | Role |
|--------|------|
| `executionPermissionLayerV0.js` | Governance + admission → `observationPermitted` / `mutationPermitted` |
| `calendarActionTriggerV0.js` | Calendar event → suggest-only action intent |
| `mediaFeedbackObservationLoopV0.js` | Media event → bounded observation feedback cycle |

## PR chain

| PR | Scope |
|----|-------|
| docs | This file + memory writeback + habitat climate |
| core | Three modules above + shadow bridge + climate engine |
| wire | Adapter hooks · boot · media tube · full report |

## DevTools smoke

```javascript
__rhizoh.executionPermission()
__rhizoh.calendarActionTrigger({ title: "Focus", eventType: "scheduled" })
__rhizoh.mediaFeedbackLoop({ eventType: "playhead", positionSec: 42 })
```

*interpretationOnly: true*
