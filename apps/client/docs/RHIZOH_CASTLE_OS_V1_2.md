# Castle OS v1.2 — Multi-Agent Room Reality Arbiter

**SPECFLOW:** `CORE-ELIGIBLE` · **Extends:** [Castle OS v1.1](RHIZOH_CASTLE_OS_V1_1.md)

---

## What v1.1 was missing

v1.1 answers **when** to execute (preemption, defer, suspend/resume).  
v1.2 answers **whose reality is active** when multiple humans, Rhizoh instances, and media streams coexist.

> v1.0 → perception · v1.1 → time control · v1.2 → multi-consciousness separation

---

## New layer (between Kernel and Real-Time Arbitration)

```
Kernel → ActionPlanV1
           ↓
Room Arbitration Layer v1.2   ← identity + thread + conflict graph
           ↓
gatedActionPlan (grant | defer | yield)
           ↓
Real-Time Arbitration v1.1
           ↓
Execution Layer (thread-scoped memory writes)
```

---

## Room data model

```javascript
Room {
  roomId
  users[]              // { userId, role, affinityWeight }
  rhizohInstances[]    // { instanceId, boundUserId, role }
  mediaStreams[]       // per-owner position locks
  activeRealityOwnerId
  sharedAttentionField // ownerId → IdentityAttentionEvent[]
  conflictGraph        // parallel_intent edges
}
```

SSOT: `castlePerception/castleRoomRealityV1_2.js`

---

## Identity-Aware Attention Event

```javascript
AttentionEvent {
  source
  ownerId          // "whose spike is this?"
  rhizohInstanceId
  threadId
  intent / type
  salience
  timestamp
}
```

Ingest path: Fusion Bus `normalizeExperienceSignalV1` (protocol v2) → `buildIdentityAttentionEventV1_2` → thread assign → register.

---

## Conflict resolver

When candidates share the same priority:

1. **Owner affinity** — local user, then room host
2. **Conversation thread priority** — parallel threads, not flat global memory
3. **Recency bias** — most recent intent wins

SSOT: `castlePerception/castleRoomArbitrationV1_2.js` · `resolveRoomConflictV1_2`

| Disposition | Meaning |
|-------------|---------|
| `grant` | Ingress owner holds active reality — execute |
| `defer` | Another owner's reality is active — speak gated |
| `yield` | No winner / passive observation |

---

## Conversation threads

Parallel threads (sports co-watch, technical Q&A, audiobook summarize) each carry:

- `threadId`, `ownerId`, `topicLabel`, `priority`, `lastActivityMs`
- **Thread memory** — `writeThreadMemoryV1_2` (not global flat storage)

SSOT: `castlePerception/castleConversationThreadV1_2.js`

---

## Media position locking

Per-owner YouTube / TV / audiobook sync isolation:

```javascript
lockMediaPositionV1_2({ ownerId, source, mediaPositionMs, locked })
```

---

## Pipeline integration

```javascript
runCastleOsLoopV1_2({ source, text, ownerId, threadId, ... })
// FusionBus → Field → Spike → Kernel
// → arbitrateRoomRealityV1_2
// → arbitrateRealtimeV1
// → executeArbitratedPlanV1 (thread memory when memoryWrite + threadId)

processPresenceKernelIngressV1(...)  // delegates to runCastleOsLoopV1_2
```

Console:

```javascript
window.__castle.roomReality
window.__castle.conversationThreads
window.__rhizoh.lastOsLoop.roomArbitration
```

---

## Module map

| Module | Role |
|--------|------|
| `castleRoomRealityV1_2.js` | Room container, identity events, conflict graph, media locks |
| `castleConversationThreadV1_2.js` | Parallel threads + thread-scoped memory |
| `castleRoomArbitrationV1_2.js` | Multi-user conflict resolution + gated plan |
| `castleOsCoreLoopV1.js` | Wires v1.2 before v1.1 arbitration |

---

## Architectural identity shift

| Before | After v1.2 |
|--------|------------|
| Single attention field | Per-owner shared attention + conflict graph |
| Single execution authority | Room-level reality owner |
| Global memory | Thread-scoped memory anchors |
| "Talking AI" | Shared reality runtime — *whose consciousness is active?* |
