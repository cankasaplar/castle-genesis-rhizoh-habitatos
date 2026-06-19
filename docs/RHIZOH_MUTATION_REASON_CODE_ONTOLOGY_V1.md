# Rhizoh Mutation Reason Code Ontology v1

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY` — **first-class "why" data** for justified state transitions.

**Related:** [`RHIZOH_SECURITY_BOUNDARY_V1.md`](RHIZOH_SECURITY_BOUNDARY_V1.md) · [`RHIZOH_REALITY_TRANSITION_ENGINE_V1.md`](RHIZOH_REALITY_TRANSITION_ENGINE_V1.md) · [`schemas/rhizoh-mutation-record-v2.schema.json`](schemas/rhizoh-mutation-record-v2.schema.json)

**Code:** `apps/client/src/rhizoh/ticket/mutationReasonCodeOntologyV1.js`

---

## 0. SSOT sentence

> **Rhizoh is not a state machine. It is a justified state transition system — "why" is first-class data.**

---

## 1. Top-level categories (mandatory prefix)

| Prefix | Layer |
|--------|--------|
| `SC_*` | Security constraint violations |
| `REC_*` | Time / epoch violations |
| `QUOTA_*` | Resource exhaustion |
| `SIG_*` | Identity / signature mismatch |
| `INTENT_*` | Malformed or invalid transition intent |
| `SYS_*` | Internal system reconciliation issues |
| `ADMIT_*` | Admission engine rejections |

Enables: analysis grouping · drift detection · "which layer broke?" clarity.

---

## 2. Detailed reason codes

### SC — Security Constraints

| Code | Meaning |
|------|---------|
| `SC_01_FROZEN_CORE_VIOLATION` | Mutate path touches frozen v562–v570 |
| `SC_02_INVALID_MUTATION_SOURCE` | Illegal mutation source (e.g. reconcile → CubeState) |
| `SC_03_TICKET_EXECUTION_DIRECT` | SC-03: execution without Intent |
| `SC_04_SELF_PRIVILEGE_ESCALATION` | Ticket expanded own authority |
| `SC_05_CROSS_PRISM_UNAUTHORIZED_WRITE` | Prism boundary write |

### REC — Time / Epoch

| Code | Meaning |
|------|---------|
| `REC_WINDOW_CLOSED` | Epoch window closed |
| `REC_WINDOW_NOT_ACTIVE` | Wrong REC layer for class |
| `REC_TICKET_EXPIRED` | Ticket past `expiresAt` |
| `REC_TICKET_NOT_EPOCH_ALIGNED` | Ticket epoch mismatch |
| `REC_CONTINUITY_BREAK` | Orphan edge / broken continuity |

### QUOTA — Resource

| Code | Meaning |
|------|---------|
| `QUOTA_EXHAUSTED` | Usage cap hit |
| `QUOTA_LIMIT_REACHED` | Hard limit |
| `QUOTA_RATE_LIMITED` | Rate window |
| `QUOTA_TIER_BLOCKED` | Tier gate |
| `QUOTA_LIFETIME_CAP` | Lifetime cap |

### SIG — Identity / Trust

| Code | Meaning |
|------|---------|
| `SIG_MISMATCH` | Signature invalid |
| `SIG_MISSING` | Unsigned mutate |
| `SIG_FROZEN_DAG_INVALID` | DAG path not verified |
| `SIG_TEMPORAL_BINDING_FAILED` | Time ownership denied |
| `SIG_ACTOR_NOT_AUTHORIZED` | Actor not permitted |

### INTENT — Semantic

| Code | Meaning |
|------|---------|
| `INTENT_MALFORMED` | Missing required fields |
| `INTENT_UNKNOWN_TRANSITION` | Unknown `transitionType` |
| `INTENT_MISSING_EXECUTION_CLASS` | Class insufficient |
| `INTENT_INVALID_CUBE_BINDING` | Cube bind invalid |
| `INTENT_PRISM_UNDEFINED` | Prism not defined |

### SYS — System Internal

| Code | Meaning |
|------|---------|
| `SYS_RECONCILE_CONFLICT` | Reconcile conflict |
| `SYS_GRAPH_LOCKED` | Graph locked |
| `SYS_SCHEDULER_DEFERRED` | Deferred to REC |
| `SYS_ENGINE_CONTENTION` | Engine contention |
| `SYS_UNKNOWN_ERROR` | Fallback |

### ADMIT — Admission Engine

| Code | Meaning |
|------|---------|
| `ADMIT_REJECTED_POLICY` | Policy reject |
| `ADMIT_PRISM_DENIED` | Prism denied |
| `ADMIT_CAPABILITY_NOT_FOUND` | Capability missing |
| `ADMIT_CUBE_LOCKED` | Cube locked |
| `ADMIT_RATE_CONTROLLED` | Admission rate limit |

---

## 3. Status vs reason (critical)

| `status` | Meaning | Example codes |
|----------|---------|----------------|
| `rejected` | Permission check failed | `SC_02`, `SIG_MISMATCH`, `INTENT_MALFORMED` |
| `quota_denied` | Permitted but no resource | `QUOTA_EXHAUSTED`, `QUOTA_RATE_LIMITED` |
| `expired` | Time passed; irrelevant | `REC_TICKET_EXPIRED`, `REC_WINDOW_CLOSED` |
| `accepted` | Transition allowed | `reason` optional |

---

## 4. MutationRecord v2 wire shape

See [`schemas/rhizoh-mutation-record-v2.schema.json`](schemas/rhizoh-mutation-record-v2.schema.json).

```json
{
  "schemaVersion": 2,
  "mutationId": "mut_1",
  "ticketId": "tkt_ulid",
  "intentId": "intent_ulid",
  "status": "rejected",
  "reason": {
    "primary": "SC_02_INVALID_MUTATION_SOURCE",
    "category": "SC",
    "code": "SC_02",
    "message": "System reconcile attempted direct CubeState mutation"
  },
  "actor": {
    "actorId": "castle:u1",
    "type": "user"
  },
  "epoch": "rec_2026_06_19_0644",
  "trace": {
    "traceGraphLink": "edge_9921",
    "cubeId": "cube_44",
    "prism": "arena"
  },
  "metrics": {
    "latencyMs": 12,
    "validatorVersion": "v1",
    "reconcileVersion": "v1"
  }
}
```

---

## 5. Architectural outcomes

1. **SYSTEM_RECONCILE** produces reasons + proposals — not silent fails  
2. **Admission Engine** = sole CubeState truth writer (`AdmissionEngine.commit()`)  
3. **TraceGraph** = court record — why rejected / accepted / deferred  

---

## 6. Downstream pipeline (next)

```text
traceGraphIndexOptimizerV0
  → driftAnalyticsEngineV0   ← Temporal Curves · Forecast · Suggestions (DR-01)
  → learning feature export    (future, RESEARCH-ONLY)
```

See [`RHIZOH_DRIFT_ANALYTICS_ENGINE_V1.md`](RHIZOH_DRIFT_ANALYTICS_ENGINE_V1.md).

---

## 7. Changelog

| Date | Change |
|------|--------|
| 2026-06-19 | v1.0 — ontology + MutationRecord v2 + emitter integration |
