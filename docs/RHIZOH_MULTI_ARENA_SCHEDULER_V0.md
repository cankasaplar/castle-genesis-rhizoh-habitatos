# Rhizoh Multi-Arena Scheduler v0

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY` — runtime execution arbitration.

**Prerequisites:** [`RHIZOH_DOMAIN_FABRIC_V0.md`](RHIZOH_DOMAIN_FABRIC_V0.md) · [`RHIZOH_ARENA_ROUTER_V0.md`](RHIZOH_ARENA_ROUTER_V0.md) · [`RHIZOH_SPORTS_ADAPTER_V0.md`](RHIZOH_SPORTS_ADAPTER_V0.md)

**Code:** `apps/client/src/rhizoh/runtime/multiArenaSchedulerV0.js`

---

## 0. SSOT sentence

> **Multi-space runtime exists in code, but not in execution governance — Multi-Arena Scheduler closes the arbitration gap.**

> **Scheduler yoksa multi-space system yoktur, sadece multi-module system vardır.**

```text
EVENT
  ↓
Multi-Arena Scheduler (this module)
  ↓
ArenaFrame selection
  ↓
Execution routing (arena router)
  ↓
Space-specific reality
```

Without this layer, **chess always wins** (implicit default routing).

---

## 1. Problem

| Layer | Before scheduler |
|-------|------------------|
| Domain Fabric | ✔ modules registered |
| Arena Router | ✔ cross-domain route |
| UGL Match Scheduler | ✔ chess PLAY vs LEARN only |
| **Runtime arbitration** | ❌ missing |
| **Reality selection** | ❌ chess hegemon |

Symptoms:
- Sports receives events but not execution windows
- CUX remains traversal-only (no selection)
- Na3/Na6 loop = arbitration absence artifact (not chess algorithm bug)

---

## 2. ArenaFrame contract

```javascript
ArenaFrame {
  spaceId,           // chess.causal.space | sports.causal.space | cux.perception.overlay
  gameType,
  priority,          // chess 100 · sports 60 · CUX 10
  executionMode,     // baseline_always | burst_window | overlay_only | suspended
  executionWindow,   // { kind: "always" } | { kind: "burst", durationMs }
  resourceQuota,     // 0–1 slice (orchestration hint only)
  recAffinity        // deterministic_rec | stochastic_rec | perception_overlay
}
```

**Invariant:** scheduler **orchestrates only** — mutates no domain state.

---

## 3. Arbitration rules (v0)

| Space | Mode | Granted when |
|-------|------|--------------|
| `chess.causal.space` | baseline_always | always |
| `sports.causal.space` | burst_window | sports event ingest extends 8s window |
| `cux.perception.overlay` | overlay_only | always (perception, not execution) |

**Primary space selection (this tick):**

1. Chess arena workspace open → **chess** (`chess_arena_workspace_open`)
2. Else sports burst active → **sports** (`sports_burst_window`)
3. Else → **chess** (`chess_baseline_default`)

Chess baseline stream never fully suspended; sports gets **scheduling windows**, not permanent takeover.

---

## 4. Integration map

| Consumer | Hook |
|----------|------|
| `rhizohArenaRouterV0.js` | `executionGranted` + `scheduler` on each route |
| `sportsEventAdapterV0.js` | `notifySportsArenaActivityV0()` + `runMultiArenaTickV0()` on ingest |
| `rhizohUglBootV0.js` | DevTools + `uglReport().multiArenaScheduler` |

---

## 5. DevTools

```javascript
window.__rhizoh.multiArenaScheduler()      // snapshot
window.__rhizoh.multiArenaSchedulerReport()
window.__rhizoh.multiArenaTick()
window.__rhizoh.notifySportsArenaActivity({ reason: "score_delta" })
```

Event: `rhizoh:multi-arena-tick-v0`

---

## 6. Not in v0 (next)

- Cross-space REC reconciliation
- Resource contention guard (quota enforcement against chess engine queue)
- Data-plane seal / ledger activation (phase gate — separate track)
- Production CUX mount without localStorage gate

---

## 7. Maturity checkpoint

| State | Label |
|-------|-------|
| Before | Epistemically complete, runtime-unified (single reality) |
| After v0 | Multi-space **governance** scaffold — arbitration traceable per tick |
