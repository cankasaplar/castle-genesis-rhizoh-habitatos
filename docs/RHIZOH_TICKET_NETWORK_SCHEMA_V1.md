# Rhizoh Ticket Network Schema v1

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY` — **spec / UX unification layer**; frozen execution core (**v562–v570**) değiştirilmez. Ticket katmanı mevcut alt sistemlerin **kullanıcıya görünen tek dili**dir; yeni execution motoru değildir.

**Status:** DRAFT v1.1 — built on Security Boundary v1  
**Prerequisite (read first):** [`RHIZOH_SECURITY_BOUNDARY_V1.md`](RHIZOH_SECURITY_BOUNDARY_V1.md)  
**State catalog:** [`RHIZOH_STATE_TRANSITIONS_V1.md`](RHIZOH_STATE_TRANSITIONS_V1.md)  
**JSON Schema:** [`schemas/rhizoh-ticket-packet-v1.schema.json`](schemas/rhizoh-ticket-packet-v1.schema.json) · [`schemas/rhizoh-ticket-message-v1.schema.json`](schemas/rhizoh-ticket-message-v1.schema.json) · [`schemas/rhizoh-mutation-record-v1.schema.json`](schemas/rhizoh-mutation-record-v1.schema.json)

**Related:** [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md) · [`SOVEREIGN_NETWORK_KERNEL_SPEC_V0.md`](SOVEREIGN_NETWORK_KERNEL_SPEC_V0.md) · [`RHIZOH_CUBE_FIELD_V0.md`](RHIZOH_CUBE_FIELD_V0.md) · [`WORLDSTATE_V0_SPEC.md`](WORLDSTATE_V0_SPEC.md)

---

## 0. SSOT sentence

> **Ticket is not a new subsystem. Ticket is the portable face of CubeState + Permission Graph + Temporal Binding + WorldState continuity.**

**Architecture sentence:**

> **Rhizoh does not have a login. Rhizoh has a ticket graph — every meaningful message is a state transition edge, every edge anchors continuity in a CubeState.**

**UX sentence:**

> **Users do not carry keys. Users carry journeys.**

---

## 1. Problem: five internal names, one human experience

| Internal (engineering) | User-facing (ticket dialect) |
|------------------------|------------------------------|
| `CubeState` | **Node cube** — where you are cognitively |
| Sovereign permission row | **Capability** — what you may do |
| `temporalIdentityBindingV0` | **Continuity anchor** — which past you may execute |
| `WorldState` snapshot / replay | **Journey restore** — where you left off |
| `closedUserAdmissionEngineV0` | **Invite / gate verdict** — controlled graph expansion |
| Observation Fabric records | **Signals** — interpreted suggestions, not commands |

**Ticket unifies these** without replacing them. Security law lives in [`RHIZOH_SECURITY_BOUNDARY_V1.md`](RHIZOH_SECURITY_BOUNDARY_V1.md).

---

## 2. Ticket anatomy: Capability + Journey

```text
Ticket
 ├─ Capability   — bounded permission (what)
 └─ Journey      — continuity trace (where, what was discovered)
```

### 2.1 Capability

| Field | Role |
|-------|------|
| `ticketKind` | Routing + UX label |
| `capabilityScope` | Single domain authority id |
| `prismProjection` | Reality layers this ticket refracts into |
| `executionClass` | See Security Boundary §3 |
| `quota` | Usage limit + **mandatory** `expiresAt` |
| `epochWindow` | REC gate |

### 2.2 Journey

| Field | Role |
|-------|------|
| `departureNode` | Graph node where journey started |
| `visitedNodes` | Append-only path |
| `discoveries` | Unlocked hints (not automatic new tickets) |
| `continuityAnchor` | `temporalIdentityBindingV0` ref |
| `contextNodeCube` | Active `CubeState` id |

---

## 3. Graph invariants (structural)

These complement Security Boundary constitutional invariants:

1. **Every Ticket is a Graph Edge** — `traceGraphLink` required.  
2. **Every Graph Edge is a Continuity Anchor** — `continuityAnchor` + `contextNodeCube`.  
3. **Every Continuity Anchor binds to CubeState** — restore path: ticket → journey → `CubeState` → prisms.

---

## 4. TicketPacket wire shape

```json
{
  "schemaVersion": 1,
  "ticketId": "tkt_ulid",
  "ticketKind": "invite",
  "prismProjection": ["leaflet_semantic"],
  "capabilityScope": "graph.node.extend",
  "contextNodeCube": "cube_uuid",
  "epochWindow": "rec_burst",
  "quota": {
    "usageLimit": 1,
    "usageCount": 0,
    "expiresAt": "2026-06-20T06:44:00+03:00"
  },
  "traceGraphLink": "edge_ulid",
  "executionClass": "suggest",
  "journey": {
    "departureNode": "node_sender",
    "visitedNodes": [],
    "discoveries": [],
    "continuityAnchor": "anchor_ref"
  },
  "issuerRef": "castleId:userId",
  "issuedAt": "2026-06-19T12:00:00Z",
  "signature": ""
}
```

### 4.1 `ticketKind` enum (v1)

| Kind | Primary prism | Typical `executionClass` |
|------|---------------|--------------------------|
| `llm_gateway` | `dev_sandbox` / `corporate_enclave` | `read_only` |
| `dev` | `dev_sandbox` | `mutate_l1` |
| `media` | `media_timeline` | `read_only` \| `mutate_l1` |
| `corporate` | `corporate_enclave` | `suggest` → `mutate_l1` |
| `arena` | `arena_rules` | `mutate_l1` |
| `ghost` | `ghost_sim` | `read_only` |
| `event` | `event_timeline` | `mutate_l1` |
| `invite` | `leaflet_semantic` | `suggest` → `mutate_l1` |
| `discovery` | multi | `read_only` |

### 4.2 `prismProjection` enum (v1)

| Prism | Layer |
|-------|-------|
| `cesium_global` | 3D topology — institutions, arena clusters |
| `leaflet_semantic` | Local nodes, invite chains, discovery paths |
| `arena_rules` | Chess / Go micro-world |
| `media_timeline` | Time-based perception |
| `ghost_sim` | Simulation / counterfactual |
| `dev_sandbox` | Developer boundary |
| `corporate_enclave` | Institution membrane |
| `event_timeline` | Epoch-scoped history |

**Prism rule:** one graph edge → many projection views; not duplicate authority.

### 4.3 `executionClass`

**Authoritative definition:** [`RHIZOH_SECURITY_BOUNDARY_V1.md`](RHIZOH_SECURITY_BOUNDARY_V1.md) §3.

| Class | Summary |
|-------|---------|
| `read_only` | Explore; no mutate |
| `suggest` | Propose only; no auto-promotion |
| `mutate_l1` | L1 epistemic state (user-signed or frozen-DAG) |
| `mutate_l2` | L2 transport (presence, broadcast) |
| `system_reconcile` | REC reconciler only — merge, expire, quota, rewards |

---

## 5. Rhizoh Epoch Clock (REC)

| Layer | Schedule | Allowed classes |
|-------|----------|-----------------|
| **Core** | 06:44 / 18:44 (19:44 configurable) | `system_reconcile` |
| **Soft** | Always-on | `read_only`, `suggest` |
| **Burst** | Event-triggered | `mutate_l1`, `mutate_l2` |

`epochWindow`: `rec_core_morning` \| `rec_core_evening` \| `rec_soft` \| `rec_burst`

---

## 6. Nervous network buckets

Not Inbox/Outbox — **Signals · Invites · Discoveries · Events**.

| Bucket | Typical class |
|--------|---------------|
| Signal | `suggest` |
| Invite | `suggest` → `mutate_l1` on accept |
| Discovery | `read_only` |
| Event | `read_only` factual |

Messages without `traceGraphLink` are ephemeral UI toasts only.

---

## 7. Map = relationship graph

| Surface | Shows |
|---------|-------|
| **Cesium** | Global topology (`cesium_global`) |
| **Leaflet** | Local semantic graph (`leaflet_semantic`) |

User traverses **ticket graph**; map is projection. Cube Field binding required per [`RHIZOH_CUBE_FIELD_V0.md`](RHIZOH_CUBE_FIELD_V0.md).

---

## 8. LLM Gateway ticket

Routes by `capabilityScope`, not UI picker:

| Flavor | Route | Class |
|--------|-------|-------|
| Research | Claude-class | `read_only` |
| Code | GPT-class | `read_only` |
| Visual | Image model | `read_only` |
| Corporate | Tenant endpoint | `read_only` |

Gateway selects model; it does not grant new authority (Invariant 5).

---

## 9. Return journey

```text
1. Present ticketId
2. Verify traceGraphLink + temporalIdentityBinding
3. Load contextNodeCube → CubeState
4. Replay discoveries + open invites
5. Reattach arena / epoch history
6. Project to active prisms
```

Expired ticket: journey `read_only` restore only.

---

## 10. Binding map (spec → code)

| Ticket concept | Repo anchor |
|----------------|-------------|
| `contextNodeCube` | `spiralReservoirCubeStateAdapterV0` |
| Permission face | `sovereign-network-permission-v0.schema.json` |
| Event transport | `sovereign-network-event-envelope-v0.schema.json` |
| Continuity anchor | `temporalIdentityBindingV0.js` |
| Admission | `closedUserAdmissionEngineV0.js` |
| Security law | `RHIZOH_SECURITY_BOUNDARY_V1.md` |
| Transitions | `RHIZOH_STATE_TRANSITIONS_V1.md` |

---

## 11. Versioning

| schemaVersion | Date | Summary |
|---------------|------|---------|
| 1 | 2026-06-19 | Initial packet + message |
| 1.1 | 2026-06-19 | Security Boundary split; executionClass expanded; transitions extracted |

---

## 12. Changelog

| Date | Change |
|------|--------|
| 2026-06-19 | v1.0 draft |
| 2026-06-19 | v1.1 — Security Boundary prerequisite; scenarios → STATE_TRANSITIONS_V1 |
