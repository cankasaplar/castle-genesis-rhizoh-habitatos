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

Promotion to any mutate class requires **one of**:

1. **User signature** on a new or upgraded ticket packet, or  
2. **Frozen DAG verification** — code path in CI-validated import graph (v562–v570 subgraph or explicitly allowlisted L1 adapter), or  
3. **`system_reconcile`** — REC-scheduled reconciler identity only (see §3).

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

## 2. The five questions (answered)

| Question | Answer |
|----------|--------|
| **Who may change state?** | Actors with valid `executionClass` + identity binding + admission pass |
| **When may they change state?** | Matching `epochWindow` + quota + ticket not expired |
| **Which ticket may change state?** | Ticket whose `capabilityScope` covers the transition; class ≥ required class |
| **May a ticket spawn another ticket?** | Only **narrower or equal** scope, **lower or equal** class, via admission or frozen template |
| **May system change state without user?** | Yes — **`system_reconcile` only**, REC core window, reconciler identity |

---

## 3. `executionClass` (authoritative enum)

| Class | Who may hold | State effect | Planes |
|-------|--------------|--------------|--------|
| `read_only` | User, observer, expired ticket | None | Read CubeState, graph, projections |
| `suggest` | Autonomous agents, Fox, drift engines | None | Emit Signal / proposal only |
| `mutate_l1` | User-signed ticket; frozen-DAG L1 adapter | L1 epistemic state mutate | Sovereign L1 — atmosphere, studio intent, portal pointer, cube adapter delta |
| `mutate_l2` | User-signed ticket; frozen-DAG transport adapter | L2 transport mutate | Presence sync, broadcast fan-out, chunk delivery — **no new truth** |
| `system_reconcile` | `system:rec_reconciler` only | Graph + ticket lifecycle | REC core: merge, expire, quota, rewards, closeout |

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

### 3.4 `system_reconcile` rules (REC)

Runs **only** during REC core windows (`06:44` / `18:44` local; `19:44` configurable alias).

| Operation | Class | User trigger? |
|-----------|-------|----------------|
| `traceGraph` merge / dedupe | `system_reconcile` | No |
| Ticket expiration + archive | `system_reconcile` | No |
| Quota reconciliation | `system_reconcile` | No |
| Reward settlement | `system_reconcile` | No |
| Epoch closeout | `system_reconcile` | No |
| Journey `discoveries` finalize | `system_reconcile` | No (reads burst-layer facts) |

**Actor:** `actorId: "system:rec_reconciler"` — not impersonatable by user tickets.

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
- [ ] `system_reconcile` only in REC core + reconciler actor  
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

---

## 9. Changelog

| Date | Change |
|------|--------|
| 2026-06-19 | v1.0 — five constitutional invariants; executionClass expanded; lifecycle + escalation ban |
