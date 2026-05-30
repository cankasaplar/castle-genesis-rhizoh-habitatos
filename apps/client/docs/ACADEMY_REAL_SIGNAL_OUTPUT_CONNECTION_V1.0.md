# Academy · Real Signal · Real Output · Real Connection — Status v1.0

**Tag:** `CORE-ELIGIBLE` (truth doc) · **Not executable**  
**Purpose:** Honest as-built vs not-yet boundary so product, Academy, and RCML are not conflated.

Related: [`RHIZOH_CANONICAL_MODEL_LAYER_MAP_V1.0.md`](./RHIZOH_CANONICAL_MODEL_LAYER_MAP_V1.0.md) · [`RCML_FREEZE_CONTRACT_V1.0.md`](./RCML_FREEZE_CONTRACT_V1.0.md) · [`docs/OBSERVATION_FABRIC_V1.md`](../../../docs/OBSERVATION_FABRIC_V1.md)

---

## 1. Academy layer — actual signal status

### What exists today

| Piece | Evidence |
|-------|----------|
| Route | `/academy/observe` → same surface as `/genesis/hub` (`GenesisObservabilityHubPage`) — [`CastleShellRouter.jsx`](../src/shell/CastleShellRouter.jsx) |
| Read-only world / ops perception | Hub panels: continuity stream, replay, temporal maps, gateway health, interpretation ops (read framing) |
| Living world link | Canonical entry “Observe” → `/academy/observe` (`rhizohLivingWorldEntryOrchestratorV0`) |
| UI | Active Genesis observability product shell |

### What is **not** there (critical gaps)

| Gap | Meaning |
|-----|---------|
| External signal ingestion | No first-class pipeline from arbitrary external APIs → Academy as **curriculum truth** |
| Credentialed roles | No product split student / observer / creator with enforced gates on this surface |
| Output artifact system | No lesson / report / module objects as durable learning products from this flow |
| Verification loop | No learn → verify → **authoritative** state update loop (observation may inform interpretation; execution stays gated per ops constitution) |

### Verdict (frozen wording)

> **Academy = READY UI + PARTIAL MODEL**  
> **Academy ≠ “gerçek learning system”** (no external truth contract, no role-gated pedagogy pipeline, no shippable learning artifacts on this path alone).

---

## 2. REAL SIGNAL — external reality binding

### What exists today (RCML + client)

| Piece | Nature |
|-------|--------|
| Entropy economy | Internal felt budget / recharge (local persistence) |
| Drift calibration | Internal caps on felt drift |
| Mutation feedback | Session-local felt ledger + seals |
| Coherence / persona | Deterministic copy + anchors — **not** oracle truth |

These are **self-contained epistemic / felt signals** for continuity UX, not claims on the outside world.

### What is **not** there

| Gap | Meaning |
|-----|---------|
| External API ingestion | No general “real world” ingest as signal-of-record for Academy |
| Event connectors | No web2/web3 / arbitrary real-time feed **contract** as first-class signal layer |
| Trusted oracle layer | No third-party attested truth path wired to user-visible “facts” |
| Human-in-the-loop verification bridge | No closed loop from external claim → verified artifact → safe state promotion |

### Verdict

> **Şu an:** self-contained epistemic / continuity world  
> **Henüz:** external reality binding system değil

---

## 3. REAL OUTPUT — production learning products

### What exists today

| Piece | Nature |
|-------|--------|
| UI / narrative / HEL | Experience and copy layers |
| Continuity memory | Session + cross-session **felt** persistence (RCML adjacent) |

### What is **not** there

| Gap | Meaning |
|-----|---------|
| Exportable artifacts | No PDF / lesson / report / module export as product deliverable |
| Shareable academy units | No linkable, versioned learning unit as durable artifact |
| Persistent authored objects | No user-produced “things” with lifecycle outside local felt state |
| Versioned learning products | No v1/v2 academy content product line with migration |

### Verdict

> **Şu an:** experience system  
> **Henüz:** production output system değil

---

## 4. REAL CONNECTION — synchronous shared world

### What exists today

| Piece | Nature |
|-------|--------|
| Cross-session coherence | Async felt similarity (anchors, blend) |
| Identity drift binding | `self_*` vs session bucket |
| World instance | Per-tab / seed identity bucket |
| RCML agreement layer (flag) | **Perception / agreement copy only** — `sharedState: false` by design |

### What is **not** there

| Gap | Meaning |
|-----|---------|
| Multi-user synchronous layer | No same-moment shared session primitive for Academy |
| Real-time shared academy sessions | No cohort room with authoritative shared lesson state here |
| Peer-to-peer world influence | No P2P influence on shared execution state |
| Same-moment shared world state | No single authoritative mesh state for all users in one instant |

### Verdict

> **Şu an:** asynchronous shared **perception** (and local felt continuity) — not “same state multiplayer”  
> **Henüz:** synchronous shared world (would require explicit architecture + constitution / phase gates)

---

## Change policy

Update this file when:

- `/academy/observe` mount or primary surface changes
- A **declared** external ingest, role model, artifact export, or sync layer ships (then move items from “not there” to “exists” with module pointers)

---

*v1.0 — product truth boundary. Does not replace code; describes it.*
