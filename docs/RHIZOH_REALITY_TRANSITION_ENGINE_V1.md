# Rhizoh Reality Transition Engine v1

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY` — epistemic OS layer above frozen core.

**Prerequisites:** [`RHIZOH_SECURITY_BOUNDARY_V1.md`](RHIZOH_SECURITY_BOUNDARY_V1.md) · [`RHIZOH_TICKET_NETWORK_SCHEMA_V1.md`](RHIZOH_TICKET_NETWORK_SCHEMA_V1.md) · [`RHIZOH_STATE_TRANSITIONS_V1.md`](RHIZOH_STATE_TRANSITIONS_V1.md)

**JSON Schema:** [`schemas/rhizoh-ticket-transition-intent-v1.schema.json`](schemas/rhizoh-ticket-transition-intent-v1.schema.json)

---

## 0. SSOT sentence

> **Ticket is not permission alone. Ticket is a four-carrier: context · continuity · capability · temporal. Reality changes only through Intent.**

**Engine chain:**

```text
Identity
  ↓
Ticket              (four-carrier packet — never executes alone)
  ↓
TransitionIntent    (single execution surface — SC-03)
  ↓
Validator
  ↓
Admission
  ↓
CubeState
  ↓
Prism Projection
```

**Restore unit:** not user session — **Continuation Graph**.

---

## 1. Ticket as four-carrier

| Carrier | Field anchor |
|---------|----------------|
| **Context** | `contextNodeCube`, `prismProjection` |
| **Continuity** | `journey`, `continuityAnchor`, `traceGraphLink` |
| **Capability** | `capabilityScope`, `executionClass`, `quota` |
| **Temporal** | `epochWindow`, `quota.expiresAt`, `intentEpoch` |

---

## 2. SC-03 — No execution from TicketPacket

**Invariant SC-03:** No component MAY execute directly on `TicketPacket`.

All execution MUST occur through `TicketTransitionIntent`.

```text
❌ ArenaTicket → ArenaScheduler

✅ ArenaTicket → ArenaEnterIntent → Validator → ArenaScheduler
```

**Audit chain (three links, never collapsed):**

| Question | Record field |
|----------|----------------|
| This mutation came from which ticket? | `ticketId` |
| Which intent derived from that ticket? | `intentId` |
| Which commit came from that intent? | `mutationId` |

---

## 3. TicketTransitionIntent v1

```json
{
  "schemaVersion": 1,
  "intentId": "intent_ulid",
  "transitionType": "arena_enter",
  "ticketId": "tkt_ulid",
  "sourceCube": "cube_001",
  "targetCube": "cube_arena_12",
  "executionClass": "mutate_l1",
  "intentEpoch": "rec_2026_06_19_0644",
  "epochWindow": "rec_burst",
  "traceGraphLink": "edge_ulid",
  "continuityAnchor": "anchor_ref"
}
```

`intentId` and `intentEpoch` are **required** for any non-`read_only` intent.

---

## 4. Ticket lifetime ≠ user session

| Entity | May outlive browser session? |
|--------|------------------------------|
| User session | No |
| **Ticket** | Yes (until `expiresAt`) |
| **Intent** | Yes (deferred queue) |
| **Admission** | May run at next REC |

User may leave. Ghost may sleep. **Continuation Graph** persists.

---

## 5. Ticket Tombstone Layer

**Problem:** Ticket cardinality — `10k users × 40 ticket kinds → 400k active edges`.

**Solution:** Expired/consumed tickets are not deleted; they are **tombstoned** — removed from active graph, retained in historical layer (Spiral "Collapsed Spirals" analogue).

```text
ACTIVE ticket edge
  → expires | consumed | REC closeout
  → TOMBSTONE (historical only)
  → active graph pruned
```

| State | Active graph | Historical |
|-------|--------------|------------|
| ACTIVE | Yes | No |
| TOMBSTONE | No | Yes |

---

## 6. REC Deferred Intent Queue

Intents that cannot run in current epoch window wait for next REC core.

```text
Intent submitted (epoch closed)
  → Validator: defer
  → REC Deferred Queue
  → next 06:44 / 18:44
  → Validator (replay)
  → Admission
  → CubeState commit
```

**Ticket lifetime ≠ session.** Intent may **wait**.

---

## 7. Implementation map

| Module | Path |
|--------|------|
| Intent v1 | `ticketTransitionIntentV1.js` |
| Validator (SC-03) | `ticketSecurityValidatorV0.js` |
| Tombstone | `ticketTombstoneLayerV0.js` |
| Deferred queue | `recDeferredIntentQueueV0.js` |
| Facade | `ticketKernelFacadeV0.js` |
| TraceGraph index | `traceGraphIndexOptimizerV0.js` |
| Drift analytics | `driftAnalyticsEngineV0.js` |
| Memory pipeline | `ticketMemoryPipelineV0.js` |
| Reconcile proposal | `ticketReconcileProposalV0.js` |
| Admission commit | `admissionCubeCommitV0.js` |
| Drift → Signal wire | `ticketDriftSignalWireV0.js` |

---

## 8. Changelog

| Date | Change |
|------|--------|
| 2026-06-19 | v1.0 — Reality Transition Engine; SC-03; tombstone; deferred queue |
