# Rhizoh Network Completion Roadmap v1

**Tag:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY`  
**Parent:** [`RHIZOH_PRODUCTIZATION_PHASE_GATE_V0.1.md`](academic/RHIZOH_PRODUCTIZATION_PHASE_GATE_V0.1.md) · [`RHIZOH_DISTRIBUTED_REALITY_CONSTRUCTION_PAPER_V0.1.md`](academic/RHIZOH_DISTRIBUTED_REALITY_CONSTRUCTION_PAPER_V0.1.md)

---

## SSOT sentence

> Rhizoh is a **single-player distributed truth simulation engine** today.  
> It becomes a **multi-user world platform** only after **network completion** (broadcast → world router → session sync UX).

Do not expand sport plugins, media timelines, or community layers before Phase A closes.

---

## Current state (honest)

| Layer | Status |
|-------|--------|
| Truth kernel + replay | ✓ harness-verified |
| Single-writer commit | ✓ gateway ack path |
| Shadow / preview / drift | ✓ |
| Session broadcast room (gateway) | ✓ scaffold |
| Client broadcast transport | ✓ scaffold |
| **Live e2e multi-tab sync** | ◐ in progress |
| World router | ✗ spec only |
| Matchmaking product UX | ✗ shadow rehearsal |

---

## Phase A — Broadcast (P0)

**Goal:** Two clients in the same session observe the same `MATCH_STATE` after a committed move.

| Task | Module | Done when |
|------|--------|-----------|
| Session room join | `matchBroadcastRoomV0.js` | `MATCH_SESSION_JOIN` → roster |
| Authoritative fan-out | `matchMoveAuthorityV0.js` | `MATCH_MOVE_ACK` + `MATCH_STATE` to room |
| Client transport | `matchmakingBroadcastTransportV0.js` | `quickStart()` e2e |
| Gateway WS registry | `matchmakingGatewayWsV0.js` | no manual `ws` in console |
| World projection apply | `matchmakingWorldProjectionV0.js` | remote state → reducer |

**Exit criteria:**

1. Tab A proposes move → Tab B receives `MATCH_STATE` within gateway RTT
2. Both tabs: `replay().moveCount` identical after ack
3. Paper v0.2 adds fan-out latency metric

---

## Phase B — World router (P1)

**Goal:** Sessions map to isolated world/tower segments; no cross-session truth leakage.

| Task | Description |
|------|-------------|
| Tower isolation contract | sessionId → towerId binding |
| Identity routing | connectionId / sessionId SSOT |
| Presence roles | player / observer / ai_node enforcement |
| Mesh consistency | same reducer, scoped event visibility |

---

## Phase C — Session sync UX (P1.5)

**Goal:** Users can share and join sessions without DevTools.

| Task | Description |
|------|-------------|
| Session share link | `sessionId` + role in URL/hash |
| Lobby surface | matchmaking UI (not shadow console) |
| Spectator mode | observer role + read-only projection |
| Reconnect | resume from truth log offset |

---

## Explicitly deferred (Phase D+)

| Feature | Why deferred |
|---------|--------------|
| Go / Basketball plugins | No unified sport ontology; broadcast first |
| WorldSports layer | Requires event ontology standardization |
| YouTube / media events | UI embed ≠ truth_log events |
| Life scheduler | Game scheduler ≠ daily OS |
| Event-sourced community | P2–P3; strong research direction |

---

## Engineering order (do not reorder)

```text
1. Broadcast e2e (two tabs, same MATCH_STATE)
2. World router (tower isolation)
3. Session sync UX (share/join/spectate)
4. Sport plugin abstraction (Go, basketball skeleton)
5. Media → truth events
6. Community graph
```

---

## Paper alignment

| Paper version | Network milestone |
|---------------|-------------------|
| v0.1 preprint | Harness-only; broadcast gap documented |
| v0.2 | Fan-out latency + two-client trace appendix |
| v0.3 | World router formal model |

---

*RESEARCH-ONLY — roadmap does not activate data-plane or extend frozen core.*
