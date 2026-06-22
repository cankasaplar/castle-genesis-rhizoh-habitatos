# Rhizoh Production Observation Layer v1

**Tag:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY`  
**Status:** Spec lock — Demo Mode → Production Observation Layer  
**Parent:** [`RHIZOH_MATCH_BROADCAST_LAYER_V0.md`](RHIZOH_MATCH_BROADCAST_LAYER_V0.md) · [`RHIZOH_BROADCAST_LAYER_CLOSURE_SPEC_V1.md`](RHIZOH_BROADCAST_LAYER_CLOSURE_SPEC_V1.md) · [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md)

---

## SSOT sentence

> **The system works — but it does not yet prove itself under observation.**

Broadcast Layer is **not the product**. It is the **observable proof machine** that closes the gap between engine reality (~80%) and perceived reality (~30–40%).

**Narrative lock (external):**

> *This is not a game prototype — it is a two-client real-time state proof system.*

Chess is an **evidence carrier**, not the value proposition.

---

## Three realities (why demos feel “empty”)

| Layer | What it is | Today |
|-------|------------|-------|
| **1. Engine reality** | Session · commit · WS · projection | ~80% — logs prove it |
| **2. Experience reality** | Two browsers feel in sync | ~50% — sometimes unclear |
| **3. Narrative reality** | “What is this?” for outsiders | ~30% — read as game demo |

**Blocker:** not missing features — **missing observable proof**.

| Strategy frame | Role |
|----------------|------|
| Founder Circle | **Observation cohort** — not early monetization |
| Paper v0.1 | **Legitimacy layer** — not marketing |
| Broadcast Layer | **Proof system** — not product |

---

## Pivot: Single Observable Truth Demo Layer

```text
BEFORE                          AFTER (target)
────────                        ──────────────
“system works”                  “system proves itself under observation”
console logs                    UI-visible metrics
developer trust                 outsider trust
demo feel                       proof feel
```

### Proof Mode (UI requirement)

When two browsers are in a session, the surface **must** show (not only log):

| Field | Question answered |
|-------|-------------------|
| FEN | Same position? |
| `eventSeq` | Same event index? |
| `commitSeq` / `serverSeq` | Same authoritative commit? |
| `projectionVersion` | Same projection generation? |

### Broadcast visibility (UI requirement)

| Field | Question answered |
|-------|-------------------|
| `commitSeq` | Which commit was broadcast? |
| `broadcastSeq` | Which broadcast round? |
| `delivered` / `recipientCount` | How many sockets received? |
| `ackCount` | How many clients confirmed apply? |

Without this, a correct engine still **feels untrustworthy**.

---

## Three-step transformation plan

### Step 1 — Instrumentation Lock

**Goal:** measurable truth, not felt truth.

| Field | Source (v1 mapping) |
|-------|---------------------|
| `commitSeq` | gateway `serverSeq` on `MATCH_MOVE_ACK` |
| `eventSeq` | truth log append index (`truthLog.length`) |
| `projectionVersion` | `commitSeq` alias until dedicated counter |
| `broadcastSeq` | per-commit fan-out round (gateway) |

**Rule:** every state change is a **countable event**.

**Output:** system **produces proof**, not vibes.

### Step 2 — Fan-out Truth Layer

**Goal:** 1 event → N clients → same result.

| Capability | Requirement |
|------------|-------------|
| Recipient list | from `MATCH_SESSION_PRESENCE` |
| Delivery count | gateway `fanOutMatchSessionV0.delivered` |
| ACK aggregation | client `MATCH_STATE_APPLIED` (new, P0.5) |
| Retry | min 1 retry when `ackCount < recipientCount` |

**Rule:** not “sent” — **“everyone received and applied”**.

**Output:** multi-observer truth system (not “multiplayer game”).

### Step 3 — Observation Surface

**Goal:** reality on UI, not in DevTools.

| Surface | Purpose |
|---------|---------|
| Live state inspector | `RHIZOH_OBSERVATION_STATE_V1` |
| Event timeline | truth log tail (read-only) |
| Projection diff | local vs committed FEN |
| Sync health | green / amber / red |

**Rule:** logs are **features**, not debug.

**Output:** observable product — Founder Circle / robotics / investor can **watch**.

---

## Six core metrics (no prod without these)

| # | Metric | Definition | PASS (P0) |
|---|--------|------------|-----------|
| 1 | **commitSeq integrity** | commits unique, monotonic per session | no gaps, no dup |
| 2 | **broadcastSeq coverage** | each commit has a broadcast round | `broadcastSeq === commitSeq` |
| 3 | **ackRate** | `ackCount / recipientCount` | ≥ 1.0 for 2-client demo |
| 4 | **projectionConsistencyScore** | post-commit hash match across clients | A.fen === B.fen |
| 5 | **snapshotReconciliationLag** | events behind on late join | SNAPSHOT+TAIL lag ≤ 1 RTT |
| 6 | **driftRate** | client-server divergence events / commits | logged, reconciled |

**Rule:** if these six are not measurable → system may run but **cannot be proven**.

---

## UI State Contract — `RHIZOH_OBSERVATION_STATE_V1`

**Schema:** [`schemas/rhizoh-observation-state-v1.schema.json`](schemas/rhizoh-observation-state-v1.schema.json)  
**Runtime:** `apps/client/src/rhizoh/runtime/rhizohObservationStateV1.js`  
**UI:** `apps/client/src/components/RhizohObservationProofPanelV0.jsx` (`?proof=1`)

```json
{
  "schema": "castle.rhizoh.observation_state.v1",
  "sessionId": "c2c_host_guest_abc",
  "truth": {
    "commitSeq": 42,
    "eventSeq": 932,
    "projectionVersion": 42,
    "fen": "…"
  },
  "broadcast": {
    "broadcastSeq": 42,
    "recipientCount": 2,
    "delivered": 2,
    "ackCount": 2,
    "ackRate": 1
  },
  "sync": {
    "projectionConsistency": true,
    "driftDetected": false,
    "lastSyncMs": 1718822400000
  },
  "reality": {
    "clientsInSync": 2,
    "sharedStateHash": "sha256:…",
    "instrumentationTier": "broadcast_partial"
  },
  "narrative": {
    "mode": "proof",
    "label": "Two-client state proof — not a game demo"
  },
  "interpretationOnly": true
}
```

### UI rule (hard)

If the UI cannot show **“2 browsers see the same state”** with the six metrics → **not production observation**.

---

## Instrumentation tiers (honest labeling)

| Tier | Meaning |
|------|---------|
| `truth_only` | client truth kernel only — no broadcast metrics |
| `broadcast_partial` | `delivered` known · `ackCount` local/partial |
| `broadcast_full` | gateway ACK aggregation + retry policy |

Current deploy ≈ **`broadcast_partial`**. Do not claim `broadcast_full` until closure spec PASS.

---

## READY boundary (data-plane)

**IN scope for READY:**

- WS transport
- Room fan-out + metrics
- Session join + presence
- Snapshot + tail recovery
- Projection consistency proof

**OUT of scope (stack on top):**

- World Router · Scheduler v2 · Media Events · Go · Basketball · Olympics · Community

---

## Console API

```javascript
window.__rhizoh.observationState.snapshot()
window.__rhizoh.observationState.subscribe(fn)  // proof panel uses this
```

Proof overlay: `https://rhizoh.com/?proof=1` or `?proof=1` on match URL.

---

## Acceptance (observation layer DONE)

1. Tab A + Tab B: proof panel shows `projectionConsistency: true` after commit
2. `ackRate === 1` for 2-client session (when tier `broadcast_full`)
3. Video recorded with proof panel visible — not console-only
4. Founder Circle invite links to `/academy` narrative, not “play chess”

---

## Related

- [`RHIZOH_BROADCAST_LAYER_CLOSURE_SPEC_V1.md`](RHIZOH_BROADCAST_LAYER_CLOSURE_SPEC_V1.md) — engineering closure
- [`RHIZOH_REALITY_BINDING_DEMO_RUNBOOK_V0.md`](RHIZOH_REALITY_BINDING_DEMO_RUNBOOK_V0.md) — video script
- [`RHIZOH_FOUNDER_CIRCLE_V0.md`](RHIZOH_FOUNDER_CIRCLE_V0.md) — observation cohort
- [`RHIZOH_NETWORK_COMPLETION_ROADMAP_V1.md`](RHIZOH_NETWORK_COMPLETION_ROADMAP_V1.md)

*RESEARCH-ONLY — observation influences interpretation, never execution.*
