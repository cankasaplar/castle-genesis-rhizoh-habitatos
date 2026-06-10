# Castle OS v1.9 — Cloud-Synced Lifecycle + Trace UI Layer

**SPECFLOW:** `CORE-ELIGIBLE` · **Extends:** [Castle OS v1.8](RHIZOH_CASTLE_OS_V1_8.md)

---

## Identity shift

| Before | Now |
|--------|-----|
| Personal Reality Co-Processor | **Distributed Cognitive Physics System with Observable Learning State** |

v1.8: physics lifecycle **local + traceable**  
v1.9: physics lifecycle **portable + synchronized + UI-visible**

**Critical rule:** cloud is **never** truth source — only **state reconciliation layer**.

---

## Stack

```
FusionBus → Attention → Spike → Co-Governor (v1.6)
  → Stability Memory (v1.7)
  → Physics Lifecycle (v1.8)
  → Cloud Sync Layer (v1.9)
  → Execution + Learning Trace Strip UI
```

---

## 1. Cloud Lifecycle Core

`castlePhysicsLifecycleCloudV1_9.js`

```javascript
PhysicsLifecycleEnvelopeV1_9 {
  userId, deviceId,
  physicsProfile: StabilityPhysicsProfileV1_8,
  learningTrace: LearningTraceV1_8[],
  version: "1.9",
  checksum, timestamp
}
```

**Sync flow:**

```
local update → merge resolver → cloud write (debounced) → device pull → reconcile physics state
```

Facade (backward compat): `castleStabilityCloudSyncV1_9.js`

---

## 2. Physics Merge Engine

`castlePhysicsMergeV1_9.js` — **cognitive reconciliation** (not overwrite)

```javascript
mergePhysicsProfiles(a, b) → {
  stabilityCurve: weightedEMA(a, b),
  modalityBias: conflictAwareBlend(a, b),
  driftMemory: unionWithDecay(a, b),
  confidence: min(a.confidence, b.confidence)
}
```

Used by v1.8 import path and v1.9 cloud reconcile.

---

## 3. Learning Trace Strip UI

`castleLearningTraceStripV1_9.js` + `StabilityLearningTraceStripGateV0`

**Question answered:** *"Why did the system behave this way?"* — last 3 visible events.

```javascript
LearningTraceItem {
  timestamp, trigger, delta, reason, traceId
}
```

Triggers: `mic_interrupt` · `co_watch_override` · `user_phase_change` · `drift_event`

**UI behaviors:**
- hover → full trace expansion
- click → replay decision path (`castle.learning_trace.replay.v1.9`)
- timeline scrub → physics rewind preview (observational only)

Enable: `VITE_RHIZOH_STABILITY_LEARNING_TRACE=1`

---

## 4. Traceability contract

Every adaptation remains:
- **traceable** — `traceId` + trigger + delta
- **replayable** — decision path window
- **explainable** — human-readable reason copy

No hidden adaptation.

---

## 5. Cross-device effect

Same physics identity across laptop / phone / co_watch / podcast — different **projections**, one reconciled profile.

---

## 6. API

```javascript
window.__rhizoh.registerStabilityCloudSyncAdapter({ push, pull })
window.__rhizoh.pushPhysicsCloudSync("user_local")   // debounced by default
window.__rhizoh.pullPhysicsCloudSync("user_local")
window.__rhizoh.lastOsLoop.learningTraceStrip
window.__rhizoh.lastOsLoop.traceStrip
window.__rhizoh.getStabilityLearningTrace("user_local")
```

Immediate push (tests / manual flush): `{ immediate: true }`

---

## 7. v2.0 preview (not implemented)

**Collective Room Physics** — multi-user shared physics graph, room-level learning traces, shared attention economy.

**Deploy bridge:** [RHIZOH_CASTLE_OS_V1_9_BRIDGE_V1.md](RHIZOH_CASTLE_OS_V1_9_BRIDGE_V1.md) — Firebase schema, conflict resolution, trace gating, v2 entry criteria.
