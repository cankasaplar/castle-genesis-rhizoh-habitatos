# Rhizoh Sediment Weight Kernel v1 (outline)

**Tag:** `RESEARCH-ONLY`  
**Priority:** P2 — after matchmaking produces repeatable sessions  
**Parent:** [`RHIZOH_BEHAVIOR_SEDIMENT_V0.md`](RHIZOH_BEHAVIOR_SEDIMENT_V0.md) · [`RHIZOH_MATCHMAKING_CORE_SPEC_V1.md`](RHIZOH_MATCHMAKING_CORE_SPEC_V1.md)

---

## 0. Problem statement

Current pipeline:

```text
observe → behaviorSediment.refresh() → attentionSediment.refresh() → askWhy()
```

**Gap:** `refresh()` aggregates but does not **reinforce cross-session weight**.  
Result: `significanceScore: 0` even when `dwellMs: 180000` exists.

Matchmaking fixes the **session source**. This kernel fixes **persistence weight**.

---

## 1. Weight function (proposed)

```
weight = f(
  dwellTime,
  repetition,
  recency,
  emotionalTag,      // optional habitat tag
  opponentDensity    // beacon / match density
)
```

| Input | Source |
|-------|--------|
| `dwellTime` | Plane E behavior sediment |
| `repetition` | cross-session entity visits |
| `recency` | exponential decay τ = 30d |
| `opponentDensity` | matchmaking beacon registry |

---

## 2. Cross-session reinforcement

```text
same entity seen again in new session
  → weight += reinforcementDelta
  → significanceScore increases monotonically (capped)
```

**Not learning** — bounded habitat bias; `isLearning: false` preserved.

---

## 3. Meaning hydration loop (target)

```text
attention → sediment → meaning ledger read
         → weight kernel update
         → sediment snapshot (weighted)
         → significance resolve
```

Blocked until:
1. Matchmaking produces session boundaries
2. Behavior sediment has session-scoped dwell

---

## 4. CODEX binding (future)

```text
match_finished_event
  → weight kernel ingest (opponentDensity, duration)
  → optional meaning ledger co-occurrence propose (bridge validation)
```

---

## 5. Status

**Outline only** — implement after Matchmaking Core v1 gateway handler lands.

See [`RHIZOH_MATCHMAKING_CORE_SPEC_V1.md`](RHIZOH_MATCHMAKING_CORE_SPEC_V1.md) §11.
