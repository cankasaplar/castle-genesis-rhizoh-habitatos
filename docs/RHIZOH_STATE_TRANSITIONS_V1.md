# Rhizoh State Transitions v1

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY` — **named transition catalog**. Executable only through validators that enforce [`RHIZOH_SECURITY_BOUNDARY_V1.md`](RHIZOH_SECURITY_BOUNDARY_V1.md).

**Status:** DRAFT v1.0  
**Prerequisites:** Security Boundary v1 · [`RHIZOH_TICKET_NETWORK_SCHEMA_V1.md`](RHIZOH_TICKET_NETWORK_SCHEMA_V1.md)

---

## 0. Transition template

Every transition MUST declare:

| Field | Value |
|-------|--------|
| `transitionId` | Stable name (e.g. `invite_join`) |
| `requiredTicketKind` | Minimum ticket kind |
| `requiredExecutionClass` | Minimum class to complete |
| `requiredCapabilityScope` | Domain id |
| `allowedEpochLayers` | `rec_soft` \| `rec_burst` \| `rec_core_*` |
| `mutationRecord` | Required on completion (Invariant 3) |

**Generic pipeline:**

```text
Ticket present
  → Security Boundary class check
  → Admission (if graph / cohort extension)
  → Identity Binding
  → CubeState attach / delta
  → Graph edge create or update
  → Prism projection
  → Mutation record emit
```

---

## 1. `invite_join` — controlled graph expansion

**Ticket:** `invite` · `capabilityScope: graph.node.extend`  
**Classes:** issue = `suggest` · complete = `mutate_l1` (user-signed accept)

### Flow

```text
Invite Ticket (suggest)
    ↓
Admission Engine          ← closedUserAdmissionEngineV0
    ↓
Identity Binding          ← temporalIdentityBindingV0
    ↓
CubeState Attach          ← contextNodeCube bind for recipient
    ↓
Graph Edge Create         ← traceGraphLink
    ↓
Prism Projection          ← leaflet_semantic invite chain
```

### Steps

| Step | Layer | Class | Actor |
|------|-------|-------|-------|
| 1. Sender issues invite | Burst / Core | `suggest` | User (sender) |
| 2. Deliver nervous message | Soft | `suggest` | System transport |
| 3. Recipient reads invite | Soft | `read_only` | User (recipient) |
| 4. Recipient signs accept | Burst | `mutate_l1` | User (recipient) |
| 5. Admission evaluate | Burst | — | Admission Engine |
| 6. Graph node extend | Burst | `mutate_l1` | On `admit` only |
| 7. REC finalize journey | Core | `system_reconcile` (proposal) → Admission | Admission commits discoveries |

### Reject cases

| Reason | Code |
|--------|------|
| Orphan edge (no continuityAnchor) | `orphan_edge` |
| Escalation (invite spawns admin scope) | `authority_escalation` |
| Admission hold/reject | `admission_hold` / `admission_reject` |
| Expired invite | `ticket_expired` |

### Mutation record (on admit)

```json
{
  "mutationId": "mut_inv_001",
  "actorId": "castle_b:bob_uid",
  "ticketId": "tkt_inv_7k2m",
  "traceGraphLink": "edge_inv_001",
  "epochId": "rec_burst_2026-06-19T14:22:00+03:00",
  "executionClass": "mutate_l1",
  "capabilityScope": "graph.node.extend"
}
```

---

## 2. `arena_enter` — rule-world entry

**Ticket:** `arena` · `capabilityScope: arena.go.match` \| `arena.chess.match`  
**Classes:** enter = `mutate_l1` · match facts = `read_only` event · discovery = `read_only`

### Flow

```text
Arena Ticket
    ↓
Scheduler                 ← arena slot / epoch check
    ↓
Arena Node                ← rule-world instance
    ↓
UGL Event Stream          ← factual game events (read_only)
    ↓
TraceGraph                ← edge per match
    ↓
CubeState Update          ← adapter delta (measurement only)
```

### Steps

| Step | Layer | Class | Actor |
|------|-------|-------|-------|
| 1. Present arena ticket | Burst | `mutate_l1` | User |
| 2. Scheduler admit | Burst | — | Arena scheduler service |
| 3. Bind arena node | Burst | `mutate_l1` | Frozen-DAG arena adapter |
| 4. Stream UGL events | Burst | `read_only` | Arena engine |
| 5. Discovery unlock hint | Burst | `read_only` | Discovery engine |
| 6. REC reconcile match | Core | `system_reconcile` (proposal only) | REC → Admission for CubeState |

### Post-match discovery (example)

```json
{
  "messageKind": "discovery",
  "source": { "sourceKind": "go_arena", "sourceRef": "match_881" },
  "node": "cube_143",
  "unlocks": ["ghost_ticket"],
  "executionClass": "read_only",
  "traceGraphLink": "edge_match_881"
}
```

**Note:** `unlocks` is a **hint** for admission on a **future** ticket issuance — not automatic `ghost_ticket` spawn (Invariant 5).

### Storm case

Autonomous bot emitting `mutate_l1` → all rejected; bot limited to `suggest` Signals.

---

## 3. `ghost_attach` — simulation layer bind

**Ticket:** `ghost` · `capabilityScope: ghost.sim.attach`  
**Classes:** attach = `read_only` or `mutate_l1` (counterfactual branch only)

### Flow

```text
Ghost Ticket (often earned via discovery hint)
    ↓
Admission Engine          ← if new sim branch writes graph
    ↓
Identity Binding
    ↓
CubeState Attach          ← ghost_sim prism inputs
    ↓
Graph Edge Create
    ↓
Prism Projection          ← ghost_sim layer
```

### Rules

- Ghost layer is **simulation / counterfactual** — MUST NOT write execution core  
- `ghost_ticket` MUST NOT spawn `arena_ticket` or `llm_gateway_ticket` (Invariant 5)  
- Promotion from discovery hint requires **new signed ticket** via admission template  

---

## 4. `flight_depart` — castle flight / event timeline

**Ticket:** `event` · `capabilityScope: castle.flight.enter`  
**Classes:** depart = `mutate_l1` · in-flight events = `read_only` \| `mutate_l2` (presence broadcast)

### Flow

```text
Castle Flight Ticket
    ↓
Scheduler                 ← event slot + REC burst window
    ↓
Event Node                ← departureNode in journey
    ↓
UGL Event Stream
    ↓
TraceGraph
    ↓
CubeState Update
    ↓
Prism Projection          ← cesium_global + media_timeline
```

### Journey update

On depart, append `visitedNodes`; `media_timeline` prism may attach stream refs as **pointers**, not truth merge.

---

## 5. `corporate_admission` — institution enclave

**Ticket:** `corporate` · `capabilityScope: corporate.enclave.enter`  
**Classes:** request = `suggest` · admit = `mutate_l1` · model route = `read_only`

### Flow

```text
Corporate Ticket
    ↓
Admission Engine          ← institution policy + stress gate
    ↓
Identity Binding
    ↓
CubeState Attach
    ↓
Graph Edge Create
    ↓
Prism Projection          ← corporate_enclave
    ↓
LLM Gateway route         ← tenant model (read_only routing)
```

### Rules

- Corporate enclave data MUST stay in `corporate_enclave` prism membrane  
- `corporate_ticket` routes LLM via `llm_gateway` **read_only** — gateway does not grant new scope  
- New corporate capabilities require institution admission template, not user ticket spawn  

---

## 6. Transition × executionClass matrix

| Transition | Issue | Complete | REC reconcile |
|------------|-------|----------|---------------|
| `invite_join` | `suggest` | `mutate_l1` | `system_reconcile` |
| `arena_enter` | — | `mutate_l1` | `system_reconcile` |
| `ghost_attach` | `read_only` hint | `mutate_l1` optional | `system_reconcile` |
| `flight_depart` | — | `mutate_l1` + `mutate_l2` presence | `system_reconcile` |
| `corporate_admission` | `suggest` | `mutate_l1` | `system_reconcile` |

---

## 7. Changelog

| Date | Change |
|------|--------|
| 2026-06-19 | v1.0 — five named transitions on Security Boundary v1 |
