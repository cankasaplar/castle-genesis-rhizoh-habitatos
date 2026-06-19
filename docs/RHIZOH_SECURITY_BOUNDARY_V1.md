# Rhizoh Security Boundary v1

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY` — **constitutional layer** for the ticket graph. This document is **law**, not UX copy. Frozen execution core (**v562–v570**) is unchanged.

**Status:** DRAFT v1.0 — must be satisfied before ticket runtime or state-transition PRs  
**Downstream:** [`RHIZOH_TICKET_NETWORK_SCHEMA_V1.md`](RHIZOH_TICKET_NETWORK_SCHEMA_V1.md) · [`RHIZOH_STATE_TRANSITIONS_V1.md`](RHIZOH_STATE_TRANSITIONS_V1.md)

**Upstream (existing law):** [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md) · [`SOVEREIGN_NETWORK_KERNEL_SPEC_V0.md`](SOVEREIGN_NETWORK_KERNEL_SPEC_V0.md) · [`LAYER_EXPANSION_PROTOCOL.md`](LAYER_EXPANSION_PROTOCOL.md) · [`RHIZOH_CLOSED_USER_ADMISSION_V0.1.md`](RHIZOH_CLOSED_USER_ADMISSION_V0.1.md) · `temporalIdentityBindingV0.js`

---

## 0. Document order (mandatory)

Ticket work MUST follow this stack:

```text
1. RHIZOH_SECURITY_BOUNDARY_V1     ← this file (who may change what)
2. RHIZOH_TICKET_NETWORK_SCHEMA_V1  ← packet + prism + journey dialect
3. RHIZOH_STATE_TRANSITIONS_V1      ← invite_join, arena_enter, …
```

State transitions written before security boundary are **provisional** and MUST be revised when boundary changes.

**SSOT sentence:**

> **Deny-by-default. Observation ≠ Execution. Every mutation has an owner. Every ticket dies.**

**Ontology spine (SC):**

> **TraceGraph is writable by observation. CubeState is writable only by admission. SYSTEM_RECONCILE may summarize reality, but may not become reality.**

---

## 1. Constitutional invariants (page one)

### Invariant 1 — Observation ≠ Execution

No observation MAY directly produce a state change.

| Source | May observe | May execute |
|--------|-------------|-------------|
| Human | Yes | Only via signed ticket or approved human merge path |
| Fox / external LLM / Cursor Agent | Yes | **No** — `suggest` only |
| Live feed / sensor | Yes | **No** — gated ingress only |
| REC reconciler | Yes (read graph) | **Only** via `system_reconcile` class in core window |

**Corollary:** Aggregated observations MUST NOT be inferred into execution decisions ([`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md) §1).

---

### Invariant 2 — SUGGEST → MUTATE promotion is forbidden without gate

A `suggest` ticket or message MUST NOT initiate mutation by itself.

Promotion to any **CubeState** mutate class requires **one of**:

1. **User signature** on a new or upgraded ticket packet, or  
2. **Frozen DAG verification** — code path in CI-validated import graph (v562–v570 subgraph or explicitly allowlisted L1 adapter), or  
3. **Admission Engine commit** after `proposedCubeDelta` (see SC-02)

`system_reconcile` produces proposals only — it is **not** a promotion path to CubeState mutate.

**Forbidden:**

```text
suggest_ticket ──auto──▶ mutate_l1          ❌
observation_record ──infer──▶ mutate_l1     ❌
arena_bot ──direct──▶ mutate_l1             ❌ (unless frozen-DAG-verified service account)
```

---

### Invariant 3 — Every mutation has an owner

Every `CubeState`, L1, L2, or graph mutation MUST emit an audit record:

```json
{
  "mutationId": "mut_ulid",
  "actorId": "castleId:userId | system:rec_reconciler | service:arena_scheduler",
  "ticketId": "tkt_ulid",
  "traceGraphLink": "edge_ulid",
  "epochId": "rec_core_morning_2026-06-19",
  "executionClass": "mutate_l1",
  "capabilityScope": "arena.go.match",
  "issuedAt": "2026-06-19T06:44:01Z"
}
```

**Anonymous mutation is invalid.** Admission and replay MUST reject records missing any required field.

---

### Invariant 4 — Every ticket must die

Tickets MUST NOT live forever. Every `TicketPacket` MUST carry:

```json
"quota": {
  "usageLimit": 1,
  "usageCount": 0,
  "expiresAt": "2026-12-31T23:59:59Z"
}
```

| Rule | Enforcement |
|------|-------------|
| `expiresAt` required | Schema + admission reject if absent |
| Expired ticket | `read_only` restore of journey history only; no new mutate |
| Post-expiry graph edges | Marked `archived`; pruned in REC `system_reconcile` |
| No immortal tickets | Product policy exception requires ADR + schemaVersion bump |

**Corollary:** Spam and permission explosion are bounded by **time** as well as **capability**.

---

### Invariant 5 — No ticket may expand its own authority

A ticket MUST NOT mint tickets with **broader** `capabilityScope` or **higher** execution class than its issuer held.

**Examples (all forbidden):**

| Holder | Cannot spawn |
|--------|----------------|
| `arena_ticket` | `llm_gateway_ticket`, `corporate_ticket`, `admin_ticket` |
| `invite_ticket` | `mutate_l1` arena ticket without admission |
| `suggest` signal | any `mutate_*` packet |

**New authority ONLY through:**

1. **Admission Engine** (`closedUserAdmissionEngineV0`) — verdict `admit` + explicit new capability grant  
2. **Frozen DAG path** — system-defined issuance templates  
3. **Human orchestrator** — signed issuance outside automated ticket chain  

This is the **permission escalation ban**.

---

### Invariant SC-01 — SYSTEM_RECONCILE is Graph Accountant, not CubeState writer

`system_reconcile` MAY:

- Derive summaries from `TraceGraph`  
- Derive reward **proposals** (`rewardDelta`, `confidence`, `reason[]`)  
- Derive quota **summaries** (`remaining`, `nextEpochReset`)  
- Emit `proposedCubeDelta` objects  

`system_reconcile` SHALL NOT:

- Write `CubeState` fields directly (e.g. `cubeState.rank = 8`)  
- Commit quota counters into CubeState  
- Bypass Admission Engine for any L1 truth change  

**Example — reward settlement (allowed):**

```json
{
  "ticketId": "arena_442",
  "rewardDelta": 0.32,
  "confidence": 0.91,
  "reason": ["prediction_match", "novel_position"]
}
```

**Example — forbidden direct mutate:**

```json
{ "cubeState.rank": 8 }
```

**Replace with proposal:**

```json
{
  "proposedMutation": { "rankDelta": 1 }
}
```

Admission Engine commits or rejects the proposal.

---

### Invariant SC-03 — No execution from TicketPacket

No component MAY execute directly on `TicketPacket`. All execution MUST pass through `TicketTransitionIntent`.

```text
❌ ArenaTicket → ArenaScheduler
✅ ArenaTicket → ArenaEnterIntent → Validator → ArenaScheduler
```

**Required audit chain (never collapse):**

```text
ticketId  →  intentId  →  mutationId  →  (optional) admissionCommitId
```

| Link | Question answered |
|------|-------------------|
| `ticketId` | Which ticket authorized this? |
| `intentId` | Which intent derived from that ticket? |
| `mutationId` | Which commit came from that intent? |

Schedulers, arena engines, LLM gateways, and reconcilers MUST accept **Intent**, not raw TicketPacket.

**Code enforcement:** `ticket_packet_direct_execution` → validator `reject`.

---

### Invariant DR-01 — Drift is prediction, not execution

Drift signals and analytics outputs SHALL NOT trigger mutations.

| Allowed | Forbidden |
|---------|-----------|
| `suggest` class suggestions | `mutate_l1` / `mutate_l2` from drift layer |
| Forecast + `confidenceHint01` | Auto quota / admission / CubeState change |
| REC **proposals** via reconcile | Drift → direct reality write |

**Failure mode:** feedback loop collapse — system writes its own predicted future.

**Code enforcement:** `driftAnalyticsEngineV0` — `assertDriftSuggestionDr01V0()`; all outputs `executionClass: suggest`.

See [`RHIZOH_DRIFT_ANALYTICS_ENGINE_V1.md`](RHIZOH_DRIFT_ANALYTICS_ENGINE_V1.md).

---

### Invariant DR-02 — Suggestion isolation

AlertPacket and drift suggestions SHALL NOT reference specific CubeState mutations, users, or cube targets.

| Allowed | Forbidden |
|---------|-----------|
| Category + delta language (`sc_frequency_increased`) | `user X should be blocked` |
| `deltaHint` with share/count deltas | `cube rank should decrease` |
| Invariant category references (`SC`, `QUOTA`) | `proposedMutation`, `targetUserId`, `targetCubeId` |

**Failure mode:** interpretation layer prescribes execution — soft authority creep into admission.

**Code enforcement:** `driftSuggestionGuardsV0` — `assertDriftSuggestionDr02V0()`; `buildAlertPacketV0()` guarded.

See [`RHIZOH_DRIFT_ANOMALY_DETECTOR_V1.md`](RHIZOH_DRIFT_ANOMALY_DETECTOR_V1.md).

---

### Epistemic OS channel law (EOS)

> **Drift is a perception stream, not a control channel.**

> **Admission is the only control channel in Rhizoh.**

> **No suggestion can contain actionable authority.**

| Channel | Role |
|---------|------|
| Drift / AlertPacket | Commentary (yorum) |
| Admission | Reality (gerçeklik) |
| TraceGraph | Past (geçmiş) |
| CubeState | Present (şimdi) |
| REC | Temporal accounting |

See [`RHIZOH_COGNITIVE_VISUALIZATION_BINDING_V1.md`](RHIZOH_COGNITIVE_VISUALIZATION_BINDING_V1.md).

---

### Invariant CAL-01 — Cognitive action is causally inert

> **Suggestion space is causally inert.**

CAL interactions SHALL NOT mutate CubeState, admission, trace truth, or tombstone state.

| Allowed | Forbidden |
|---------|-----------|
| `read_only` exploration packets | Mutation from UI interaction |
| Lineage / cause-chain fetch | Auto admission from CAL click |
| `exploration_view` state proposals | DR-02 violating action prescriptions |

**Code enforcement:** `cognitiveActionLayerV0` — `assertCognitiveActionCaInertV0()`.

See [`RHIZOH_COGNITIVE_ACTION_LAYER_V1.md`](RHIZOH_COGNITIVE_ACTION_LAYER_V1.md).

---

Every `CubeState` commit MUST originate from **one of**:

1. **User-signed ticket** (`mutate_l1` / `mutate_l2` with valid signature)  
2. **Frozen DAG verified ticket** (CI-allowlisted adapter path)  
3. **Admission Engine commit** (after `proposedCubeDelta` or transition verdict `admit`)  

No other path may write CubeState — including `system_reconcile`.

**Pipeline (locked):**

```text
Ticket Events
      ↓
TraceGraph
      ↓
SYSTEM_RECONCILE        ← Graph Accountant (summaries + proposals only)
      ↓
Summary Layer
      ↓
ProposedCubeDelta
      ↓
Admission Engine        ← State Authority
      ↓
CubeState Commit
      ↓
Prism Projection
```

| Layer | Role |
|-------|------|
| **TraceGraph** | System memory — observation writes edges |
| **CubeState** | Current reality — admission writes only |
| **SYSTEM_RECONCILE** | Accountant — reads graph, proposes; never becomes reality |

---

## 2. The five questions (answered)

| Question | Answer |
|----------|--------|
| **Who may change state?** | Actors with valid `executionClass` + identity binding + admission pass |
| **When may they change state?** | Matching `epochWindow` + quota + ticket not expired |
| **Which ticket may change state?** | Ticket whose `capabilityScope` covers the transition; class ≥ required class |
| **May a ticket spawn another ticket?** | Only **narrower or equal** scope, **lower or equal** class, via admission or frozen template |
| **May system change state without user?** | **No direct CubeState write.** REC proposes; Admission Engine commits |

---

## 3. `executionClass` (authoritative enum)

| Class | Who may hold | State effect | Planes |
|-------|--------------|--------------|--------|
| `read_only` | User, observer, expired ticket | None | Read CubeState, graph, projections |
| `suggest` | Autonomous agents, Fox, drift engines | None | Emit Signal / proposal only |
| `mutate_l1` | User-signed ticket; frozen-DAG L1 adapter | L1 epistemic state mutate | Sovereign L1 — atmosphere, studio intent, portal pointer, cube adapter delta |
| `mutate_l2` | User-signed ticket; frozen-DAG transport adapter | L2 transport mutate | Presence sync, broadcast fan-out, chunk delivery — **no new truth** |
| `system_reconcile` | `system:rec_reconciler` only | **TraceGraph + ticket lifecycle summaries; proposals only** | REC core: merge, expire, quota **summary**, reward **proposal**, closeout — **no CubeState commit** |

### 3.1 Class comparison (partial order)

```text
read_only  <  suggest  <  mutate_l1  ≈  mutate_l2  <  system_reconcile (domain-specific)
```

- `mutate_l1` and `mutate_l2` are **incomparable** in authority — different planes. A ticket MUST NOT hold both unless explicitly dual-scoped and admission-approved.
- `system_reconcile` is **not** a superset of user mutate — it may only run **allowlisted reconciler operations** (§3.3).

### 3.2 `mutate_l1` rules

- MUST pass `temporalIdentityBindingV0` execution gate  
- MUST NOT write v562–v570 `phase*.js` execution paths  
- MUST emit mutation record (Invariant 3)  
- Typical: arena match state, invite accept graph extension, cube adapter delta  

### 3.3 `mutate_l2` rules

- Transport plane only per [`SOVEREIGN_NETWORK_KERNEL_SPEC_V0.md`](SOVEREIGN_NETWORK_KERNEL_SPEC_V0.md) §1  
- MUST NOT create L0 identity or reinterpret L1 meaning  
- Typical: broadcast topic emit, presence projection sync  

### 3.4 `system_reconcile` rules (REC) — Graph Accountant

Runs **only** during REC core windows (`06:44` / `18:44` local; `19:44` configurable alias).

| Operation | Output type | CubeState write? |
|-----------|-------------|------------------|
| `traceGraph` merge / dedupe | Graph edge update | No |
| Ticket expiration + archive | Lifecycle summary | No |
| Quota reconciliation | `{ remaining, nextEpochReset }` summary | **No** — does not write `quota` field |
| Reward settlement | `proposedMutation` / `rewardDelta` | **No** — Admission commits |
| Epoch closeout | Summary + archived edges | No |
| Journey `discoveries` finalize | Proposal list for admission | No |

**Actor:** `actorId: "system:rec_reconciler"` — not impersonatable by user tickets.

**SC-01 enforcement:** any reconcile path that targets `CubeState` directly → validator `reject` (`system_reconcile_cube_write_forbidden`).

---

## 4. Authority rules

### 4.1 Deny-by-default

No `capabilityScope`, no mutate. No admission pass, no graph extension. No valid `epochWindow`, no burst mutate.

### 4.2 Identity binding

Before any `mutate_l1` or `mutate_l2`:

```text
ticket.contextNodeCube
  → journey.continuityAnchor
  → temporalIdentityBindingV0.executionPermitted
  → admission verdict (if graph extension)
```

Failure at any step → `reject` (`no_execution_right`).

### 4.3 Permission escalation paths (only three)

| Path | Emitter | Result |
|------|---------|--------|
| **Admission grant** | `closedUserAdmissionEngineV0` | New ticket template with explicit scope |
| **Frozen DAG template** | System service in CI allowlist | Pre-scoped child ticket |
| **Human signed issuance** | Orchestrator | New ticket; must not bypass admission for closed cohort |

### 4.4 Ticket spawning matrix

Parent ticket MAY spawn child ONLY IF:

- `child.capabilityScope ⊆ parent.capabilityScope` (subset or equal)  
- `child.executionClass ≤ parent.executionClass` (in class lattice)  
- `child.quota.expiresAt ≤ parent.quota.expiresAt` (child dies first or with parent)  
- Admission approves if child introduces **new graph node** or **new counterparty**  

---

## 5. Ticket lifecycle

```text
ISSUE ──▶ ACTIVE ──▶ CONSUMED | EXPIRED ──▶ ARCHIVED
              │                    │
              └── HOLD (admission) ──┘
```

| State | `read_only` | `suggest` | `mutate_*` | `system_reconcile` |
|-------|-------------|-----------|------------|-------------------|
| ACTIVE | Yes | Yes (if not expired) | Yes (if quota + epoch) | N/A |
| HOLD | Yes | Yes | **No** | N/A |
| EXPIRED | Journey restore only | No | No | Archive edge |
| ARCHIVED | History only | No | No | Prune candidate |

**REC closeout** transitions `ACTIVE → EXPIRED` when `expiresAt` passed; decrements graph hot set.

---

## 6. REC interaction with execution classes

| REC layer | Schedule | Allowed classes |
|-----------|----------|-----------------|
| **Core** | 06:44 / 18:44 | `system_reconcile`; finalize pending `mutate_l1` facts |
| **Soft** | Always-on | `read_only`; `suggest` delivery |
| **Burst** | Event-triggered | `mutate_l1` / `mutate_l2` with live admission |

**Spam = invalid transition:** mutate outside allowed layer + class → admission `reject`.

---

## 7. PR checklist (ticket-touching changes)

- [ ] Invariant 1: no observation → direct mutate  
- [ ] Invariant 2: no suggest auto-promotion  
- [ ] Invariant 3: mutation record with actorId, ticketId, traceGraphLink, epochId  
- [ ] Invariant 4: expiresAt present; expiry path tested  
- [ ] Invariant 5: no self-authority expansion; admission on new scope  
- [ ] `mutate_l1` does not touch frozen v562–v570 subgraph  
- [ ] Invariant SC-01: `system_reconcile` never writes CubeState directly  
- [ ] Invariant DR-01: drift/analytics outputs are suggest-only  
- [ ] Invariant DR-02: suggestions reference categories/deltas only  
- [ ] Invariant CAL-01: cognitive exploration is causally inert  
- [ ] No import from ticket module into frozen phase chain  

---

## 8. Binding map (enforcement today)

| Boundary concern | Repo anchor |
|------------------|-------------|
| Observation isolation | `OBSERVATION_FABRIC_V1.md` |
| L0/L1/L2 planes | `SOVEREIGN_NETWORK_KERNEL_SPEC_V0.md` |
| Time ownership | `temporalIdentityBindingV0.js` |
| Admission | `closedUserAdmissionEngineV0.js` |
| Event envelope + epochId | `sovereign-network-event-envelope-v0.schema.json` |
| CubeState adapter (read path) | `spiralReservoirCubeStateAdapterV0.js` |
| Transition intent | `apps/client/src/rhizoh/ticket/ticketTransitionIntentV0.js` |
| Security validator | `apps/client/src/rhizoh/ticket/ticketSecurityValidatorV0.js` |
| Mutation record emitter | `apps/client/src/rhizoh/ticket/mutationRecordEmitterV0.js` |
| Transition intent v1 | `apps/client/src/rhizoh/ticket/ticketTransitionIntentV1.js` |
| Tombstone layer | `apps/client/src/rhizoh/ticket/ticketTombstoneLayerV0.js` |
| Drift analytics engine | `apps/client/src/rhizoh/ticket/driftAnalyticsEngineV0.js` |
| Drift suggestion guards | `apps/client/src/rhizoh/ticket/driftSuggestionGuardsV0.js` |

---

## 9. Changelog

| Date | Change |
|------|--------|
| 2026-06-19 | v1.0 — five constitutional invariants; executionClass expanded; lifecycle + escalation ban |
| 2026-06-19 | v1.1 — SC-01/SC-02: SYSTEM_RECONCILE = Graph Accountant; CubeState admission-only |
| 2026-06-19 | v1.2 — SC-03: execution via Intent only; tombstone + deferred queue refs |
