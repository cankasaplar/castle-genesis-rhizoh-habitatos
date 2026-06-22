# Rhizoh Productization Phase Gate v0.1

**Tag:** `RESEARCH-ONLY` · ops snapshot — not activation authority  
**Parent:** [`RHIZOH_DISTRIBUTED_REALITY_CONSTRUCTION_PAPER_V0.1.md`](RHIZOH_DISTRIBUTED_REALITY_CONSTRUCTION_PAPER_V0.1.md)

---

## Current ratio (honest)

| Layer | Approx. share | User-visible |
|-------|---------------|--------------|
| Execution engine (truth kernel, authority, replay) | ~70% | ~0% |
| Product surface (broadcast, world router, life scheduler, media events) | ~30% | what users need |

**Users ask:** “What does it do for my day?” — not “How does your reducer work?”

---

## What works today (engine)

- Event-sourced truth kernel (`truth_log_v0`)
- Single-writer rule (`effectiveCommitWriter: server` after ack)
- Client = simulator (`proposalAuthority`, `previewAuthority`, `simulationAuthority`)
- Drift detect + reconcile harness
- Gateway `MATCH_MOVE` → `MATCH_MOVE_ACK` (validate + commit)
- Deterministic replay (`produced === replayed`)

---

## What blocks “daily OS” / C2C product

| Priority | Gap | Symptom |
|----------|-----|---------|
| **P0** | Broadcast fan-out | `phasesMissingUntilLive: broadcast_to_all_clients` |
| **P0** | Live WS transport wiring | Client propose → gateway → all peers |
| **P1** | World router | Tower isolation, session mesh |
| **P1** | Presence roles | player vs observer vs AI node SSOT |
| **P2** | Media → event stream | YouTube = UI embed, not `truth_log` events |
| **P2** | Scheduler v2 | Game scheduler ≠ life OS (no calendar / external world) |

---

## Phase gate (do not reorder)

```text
Phase A — Network completion (IN PROGRESS)
  ✓ session-scoped broadcast room (matchBroadcastRoomV0)
  ✓ MATCH_STATE world projection fan-out
  ✓ client transport scaffold (matchBroadcastTransportV0)
  ◐ live WS e2e + guaranteed delivery

Phase B — World router
  tower isolation · identity routing · mesh consistency

Phase C — Scheduler v2
  real-world tasks · AI delegation · time management

Phase D — Media event system
  playback/seek/pause as truth events · watch_time signals
```

**Rule:** Feature expansion before Phase A completes = fork risk in production truth.

---

## FAQ (product)

| Question | Answer |
|----------|--------|
| Castle-to-Castle ready? | Core yes · network layer incomplete |
| YouTube real integration? | After media → event system (Phase D) |
| Scheduler for daily life? | No — game/simulation scheduler today |
| Safe for daily human use? | Not yet “daily OS”; engine maturity high |

---

*RESEARCH-ONLY — interpretation layer for founder / paper / outreach alignment.*
