# Rhizoh Ticket Network Schema v1

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY` — **spec / UX unification layer**; frozen execution core (**v562–v570**) değiştirilmez. Ticket katmanı mevcut alt sistemlerin **kullanıcıya görünen tek dili**dir; yeni execution motoru değildir.

**Status:** DRAFT v1.0 — interpretation + contract freeze candidate  
**JSON Schema:** [`schemas/rhizoh-ticket-packet-v1.schema.json`](schemas/rhizoh-ticket-packet-v1.schema.json) · [`schemas/rhizoh-ticket-message-v1.schema.json`](schemas/rhizoh-ticket-message-v1.schema.json)

**Related:** [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md) · [`SOVEREIGN_NETWORK_KERNEL_SPEC_V0.md`](SOVEREIGN_NETWORK_KERNEL_SPEC_V0.md) · [`SOVEREIGN_NETWORK_CONTRACT_SCHEMAS_V0.md`](SOVEREIGN_NETWORK_CONTRACT_SCHEMAS_V0.md) · [`RHIZOH_CUBE_FIELD_V0.md`](RHIZOH_CUBE_FIELD_V0.md) · [`WORLDSTATE_V0_SPEC.md`](WORLDSTATE_V0_SPEC.md) · [`RHIZOH_CLOSED_USER_ADMISSION_V0.1.md`](RHIZOH_CLOSED_USER_ADMISSION_V0.1.md) · [`LAYER_EXPANSION_PROTOCOL.md`](LAYER_EXPANSION_PROTOCOL.md)

---

## 0. SSOT sentence

> **Ticket is not a new subsystem. Ticket is the portable face of CubeState + Permission Graph + Temporal Binding + WorldState continuity.**

**Architecture sentence:**

> **Rhizoh does not have a login. Rhizoh has a ticket graph — every meaningful message is a state transition edge, every edge anchors continuity in a CubeState.**

**UX sentence:**

> **Users do not carry keys. Users carry journeys.**

---

## 1. Problem: five internal names, one human experience

Today the repo already contains the machinery; it is fragmented across internal names:

| Internal (engineering) | User-facing (ticket dialect) |
|------------------------|------------------------------|
| `CubeState` | **Node cube** — where you are cognitively |
| Sovereign permission row | **Capability** — what you may do |
| `temporalIdentityBindingV0` | **Continuity anchor** — which past you may execute |
| `WorldState` snapshot / replay | **Journey restore** — where you left off |
| `closedUserAdmissionEngineV0` | **Invite / gate verdict** — controlled graph expansion |
| Observation Fabric records | **Signals** — interpreted suggestions, not commands |

**Ticket unifies these** without replacing them. Implementation binds ticket fields to existing artifacts; ticket layer MUST NOT become a parallel truth source.

---

## 2. Ticket anatomy: Capability + Journey

A ticket is **not** a flat object. It is always two halves:

```text
Ticket
 ├─ Capability   — bounded permission (what)
 └─ Journey      — continuity trace (where, what was discovered)
```

### 2.1 Capability (permission face)

| Field | Role |
|-------|------|
| `ticketKind` | Routing + UX label (`llm_gateway`, `dev`, `media`, `corporate`, `arena`, `invite`, `ghost`, `event`, …) |
| `capabilityScope` | Single domain authority id (e.g. `castle.flight.enter`, `arena.go.match`) |
| `prismProjection` | Which reality layers this ticket refracts into |
| `executionClass` | `read_only` \| `suggest` \| `mutate_l1` |
| `quota` | Usage limit + expiration |
| `epochWindow` | REC gate this ticket respects |

### 2.2 Journey (continuity face)

| Field | Role |
|-------|------|
| `departureNode` | Graph node where journey started |
| `visitedNodes` | Ordered path (append-only during ticket life) |
| `discoveries` | Unlocked capabilities / prism hints earned on path |
| `continuityAnchor` | Binding to `temporalIdentityBindingV0` / checkpoint tick |
| `contextNodeCube` | Active `CubeState` id this ticket restores |

**Example — Castle Flight Ticket:**

```json
{
  "ticketId": "tkt_cf_7k2m",
  "capability": {
    "ticketKind": "event",
    "capabilityScope": "castle.flight.enter",
    "prismProjection": ["cesium_global", "media_timeline"],
    "executionClass": "mutate_l1",
    "quota": { "usageLimit": 3, "usageCount": 1, "expiresAt": "2026-12-31T23:59:59Z" },
    "epochWindow": "rec_burst"
  },
  "journey": {
    "departureNode": "node_istanbul_bootstrap",
    "visitedNodes": ["node_istanbul_bootstrap", "node_serencebey_window"],
    "discoveries": ["ghost_ticket_preview"],
    "continuityAnchor": "anchor_tick_18442",
    "contextNodeCube": "cube_7f3a"
  }
}
```

---

## 3. Hard invariants (non-negotiable)

These three invariants are the spam / permission-explosion firewall:

1. **Every Ticket is a Graph Edge** — issuance or transfer MUST create or reference a `traceGraphLink` (sovereign graph edge id).
2. **Every Graph Edge is a Continuity Anchor** — edge MUST bind `continuityAnchor` + `contextNodeCube`; orphan edges are invalid.
3. **Every Continuity Anchor binds to CubeState** — restore path always flows: ticket → journey → `CubeState` → projection layers.

**Corollaries:**

- A message without graph edge = **invalid state transition** (rejected by admission).
- A ticket without `contextNodeCube` = **non-restorable** (cannot be a return ticket).
- Autonomous producers MAY NOT skip journey binding; they emit **suggest** only.

---

## 4. TicketPacket wire shape (immutable constraints)

Canonical packet for transport, signing, and admission. See JSON Schema for machine validation.

```json
{
  "schemaVersion": 1,
  "ticketId": "tkt_ulid",
  "ticketKind": "invite",
  "prismProjection": ["arena_local", "leaflet_semantic"],
  "capabilityScope": "graph.node.extend",
  "contextNodeCube": "cube_uuid",
  "epochWindow": "rec_core_morning",
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
| `llm_gateway` | `dev` / `corporate` | `read_only` (routing) or `suggest` |
| `dev` | `dev_sandbox` | `mutate_l1` (sandbox only) |
| `media` | `media_timeline` | `read_only` or `mutate_l1` |
| `corporate` | `corporate_enclave` | `read_only` + policy envelope |
| `arena` | `arena_rules` | `mutate_l1` (match state) |
| `ghost` | `ghost_sim` | `read_only` |
| `event` | `event_timeline` | `suggest` or `mutate_l1` |
| `invite` | `leaflet_semantic` | `suggest` until accepted |
| `discovery` | multi | `read_only` (unlock hint) |

### 4.2 `prismProjection` enum (v1)

| Prism | Render / semantics layer |
|-------|--------------------------|
| `cesium_global` | 3D world — continents, institutions, arena clusters |
| `leaflet_semantic` | Local nodes, events, invite chains, discovery paths |
| `arena_rules` | Chess / Go / rule-based micro-world |
| `media_timeline` | Time-based perception (video = timeline physics) |
| `ghost_sim` | Simulation / counterfactual layer |
| `dev_sandbox` | Developer tool boundary |
| `corporate_enclave` | Institution-scoped model + data membrane |
| `event_timeline` | Epoch-scoped event history |

**Prism rule:** one event MAY fan out to many prisms; each prism gets a **projection view** of the same graph edge, not a duplicate authority.

### 4.3 `executionClass` (security boundary — priority)

| Class | Who may emit | CubeState write | L1 mutate | Admission |
|-------|--------------|-----------------|-----------|-----------|
| `read_only` | User, system, observer | No | No | Auto if graph valid |
| `suggest` | Autonomous agents, Fox, drift engines | No | No | Delivered as Signal; human or signed ticket promotes |
| `mutate_l1` | User-signed ticket OR frozen-DAG-verified path | Indirect via L1 adapters only | Yes, gated | `closedUserAdmissionEngine` + `temporalIdentityBinding` |

**Frozen core rule:** `mutate_l1` MUST NOT write v562–v570 `phase*.js` execution paths. Ticket layer stops at L1 epistemic state plane per Sovereign Kernel §1.

**Observation Fabric rule:** *Agents may influence interpretation, never execution.* Autonomous class is always `suggest` unless explicitly promoted.

---

## 5. Rhizoh Epoch Clock (REC)

Système nefes ritmi — üç katman:

| Layer | Schedule | Ticket behavior |
|-------|----------|-----------------|
| **Core cycle** | `06:44` and `18:44` local (configurable; `19:44` alt in some founder notes) | Graph reconciliation, `mutate_l1` finalize, quota reset windows, ticket evolution |
| **Soft layer** | Always-on | `read_only` exploration, history, shadow trace viewing |
| **Burst layer** | Event-triggered (arena entry, invite accept, LLM burst) | `suggest` + admission-gated `mutate_l1` |

### 5.1 `epochWindow` values

| Value | Meaning |
|-------|---------|
| `rec_core_morning` | Morning core window (starts 06:44) |
| `rec_core_evening` | Evening core window (starts 18:44) |
| `rec_soft` | Soft layer (no heavy mutate) |
| `rec_burst` | Burst layer (event-driven) |

**Spam as invalid transition:** continuous messaging outside allowed `epochWindow` + `executionClass` → admission `reject` with reason `invalid_epoch_transition`.

---

## 6. Nervous network: not Inbox — Signals, Invites, Discoveries, Events

Rhizoh mail is **not** email. UX buckets:

| Bucket | Meaning | Typical `executionClass` |
|--------|---------|--------------------------|
| **Signal** | Interpretation / suggestion from observer or Fox | `suggest` |
| **Invite** | Controlled graph expansion offer | `suggest` until accept → `mutate_l1` |
| **Discovery** | Unlock earned on journey | `read_only` |
| **Event** | System or arena factual transition | `read_only` or `mutate_l1` |

### 6.1 Message examples

**Signal:**

```json
{
  "messageKind": "signal",
  "from": { "sourceKind": "fox", "sourceRef": "session_abc" },
  "prism": "arena",
  "epoch": "rec_core_morning",
  "executionClass": "suggest",
  "payloadRef": "suggest_open_arena_12",
  "ticketRef": "tkt_parent_ulid"
}
```

**Discovery:**

```json
{
  "messageKind": "discovery",
  "source": { "sourceKind": "arena", "sourceRef": "go_match_881" },
  "node": "cube_143",
  "unlocks": ["ghost_ticket"],
  "executionClass": "read_only",
  "traceGraphLink": "edge_discovery_ulid"
}
```

Every message MUST reference `traceGraphLink` or create one on ingest. Messages without continuity binding are ephemeral UI toasts only — they do not enter the ticket graph.

---

## 7. Map = relationship graph (not place pins)

| Surface | Shows | Binds to |
|---------|-------|----------|
| **Cesium** | Global topology — continents, institutions, universities, companies, arena clusters | `cesium_global` prism |
| **Leaflet** | Local semantic graph — nodes, events, discovery paths, invite chains | `leaflet_semantic` prism |

**Navigation rule:** user does not “browse a map”; user **traverses the ticket graph**. Map layers are **projections** of graph edges onto geo/semantic coordinates.

Cube Field binding: visible motion on either surface MUST trace to `CubeState` scalars per [`RHIZOH_CUBE_FIELD_V0.md`](RHIZOH_CUBE_FIELD_V0.md) — map decoration without cube binding is forbidden in v1.

---

## 8. LLM Gateway ticket = AI traffic director

Ticket kind `llm_gateway` routes by capability, not by UI picker:

| Ticket flavor | Typical route | Prism |
|---------------|---------------|-------|
| Research | Claude-class long context | `corporate_enclave` or `dev_sandbox` |
| Code | GPT-class codegen | `dev_sandbox` |
| Visual | Image / video model | `media_timeline` |
| Corporate | Tenant-owned endpoint | `corporate_enclave` |

Rhizoh becomes **protocol** when gateway selection is encoded in `capabilityScope` + signed ticket, not hardcoded in client.

---

## 9. Return journey (six months later)

**Wrong:** “I logged in.”  
**Right:** “I returned with my last ticket.”

Restore sequence:

```text
1. Present ticketId (or signed ticket packet)
2. Verify traceGraphLink + temporalIdentityBinding
3. Load contextNodeCube → CubeState
4. Replay journey.discoveries + open invites (Signals bucket)
5. Reattach arena bindings + epoch history (Events bucket)
6. Project to active prisms (Cesium / Leaflet / Arena)
```

Admission engine role: validate ticket still within quota + epoch + stress gate; **hold** does not destroy journey — it pauses `mutate_l1`.

---

## 10. Worked scenario A — Invite (controlled graph expansion)

**Actors:** Alice (sender), Bob (recipient), AdmissionEngine, CubeState adapter.

```text
[06:44 REC core — Alice]
  Alice holds invite_ticket (capability: graph.node.extend, executionClass: suggest)
  → creates traceGraphLink edge_inv_001
  → nervous message: Invite bucket → Bob

[Soft layer — Bob reads]
  Bob sees Invite (suggest only)
  → no CubeState write yet

[Burst — Bob accepts]
  Bob signs accept → executionClass promoted to mutate_l1
  → AdmissionEngine.evaluateClosedAdmission(subjectRef)
  → verdict: admit | hold | reject

[admit]
  → new graph node node_bob_ext
  → journey.visitedNodes append
  → CubeState delta (read-only adapter path)
  → Leaflet prism: invite chain edge visible

[reject]
  → edge marked invalid_transition
  → no node extension; invite quota not consumed
```

**Spam case:** unsolicited invite without `continuityAnchor` → `reject` (`orphan_edge`).

---

## 11. Worked scenario B — Arena entry (Go match)

**Actors:** User U, arena_ticket, Go arena service, discovery engine.

```text
[Burst — U presents arena_ticket]
  capabilityScope: arena.go.match
  executionClass: mutate_l1
  prismProjection: [arena_rules, leaflet_semantic]

[Admission]
  quota.usageCount < usageLimit
  epochWindow: rec_burst OK
  temporalIdentityBinding: executionPermitted

[Match complete]
  → Event message (read_only factual)
  → Discovery message if threshold met:
      unlocks: [ghost_ticket]
      node: cube_143

[18:44 REC core]
  → graph reconciliation
  → journey.discoveries finalized
  → WorldState snapshot optional export
```

**Storm case:** autonomous arena bot emits 500 `mutate_l1` → all rejected; only `suggest` Signals allowed from bots.

---

## 12. Binding map (spec → code today)

| Ticket concept | Current repo anchor |
|----------------|---------------------|
| `contextNodeCube` | `spiralReservoirCubeStateAdapterV0` / Cube Field `CubeState` |
| Permission face | `sovereign-network-permission-v0.schema.json` |
| Event transport | `sovereign-network-event-envelope-v0.schema.json` (`epochId`) |
| Continuity anchor | `temporalIdentityBindingV0.js` |
| Admission / invite gate | `closedUserAdmissionEngineV0.js` |
| World restore | `WORLDSTATE_V0_SPEC.md` |
| Observation → Signal | `OBSERVATION_FABRIC_V1.md` |
| LLM route hint | `rhizohDomainZoneAdaptersV0.js` (`rhizoh_llm_gateway`) |

**v1 implementation stance:** ticket kernel is a **facade + validator** over these; no new WAL writer.

---

## 13. Security boundary summary (standalone extract)

See §4.3 for full matrix. Minimum bar for any PR touching ticket runtime:

- [ ] Autonomous paths use `suggest` only
- [ ] `mutate_l1` requires user signature or frozen-DAG verification
- [ ] Every packet has `traceGraphLink` + `contextNodeCube`
- [ ] `temporalIdentityBinding` checked before L1 mutate
- [ ] Admission `reject` for invalid epoch / orphan edge / quota exceeded
- [ ] No import into v562–v570 frozen subgraph from ticket module
- [ ] Cesium/Leaflet bindings are projection-only (Cube Field read path)

---

## 14. Versioning

| schemaVersion | Date | Summary |
|---------------|------|---------|
| 1 | 2026-06-19 | Initial ticket packet + message schema; Capability+Journey; REC; scenarios A/B |

Breaking changes → increment `schemaVersion`, migration note here, never silent `additionalProperties` extension on frozen objects.

---

## 15. Open questions (v1.1)

- Exact crypto on `signature` field (reuse sovereign envelope signing hooks?)
- `19:44` vs `18:44` evening REC — product config vs fixed constant
- Firebase / Firestore collection layout for ticket graph (separate ADR)
- Promotion flow: `suggest` → `mutate_l1` user gesture vs automatic for trusted issuers

---

## 16. Changelog

| Date | Change |
|------|--------|
| 2026-06-19 | v1.0 draft — unified UX dialect, security boundary, invite + arena scenarios |
