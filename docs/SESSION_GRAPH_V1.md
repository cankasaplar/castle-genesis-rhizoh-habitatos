# Session Graph V1 — Castle-to-Castle network

**Tag:** `RESEARCH-ONLY`  
**Parent:** [`MULTI_CASTLE_SOCIAL_EVENT_ARCHITECTURE_V1.md`](MULTI_CASTLE_SOCIAL_EVENT_ARCHITECTURE_V1.md) · [`RHIZOH_COM_USER_EXPERIENCE_V1.md`](RHIZOH_COM_USER_EXPERIENCE_V1.md)  
**Planes:** L0 identity · L1 epistemic edges · L2 transport ([`SOVEREIGN_NETWORK_KERNEL_SPEC_V0.md`](SOVEREIGN_NETWORK_KERNEL_SPEC_V0.md))

---

## 0. Core model

> **Session = shared spatial container** (perception field), not shared execution.

```
Castle A ──edge──► SessionInstance ◄──edge── Castle B
                      │
              WorldInstance bind (LIVE only)
              Presence nodes (per user)
              Communication bind (optional)
```

- Each **Castle** = persistent node (home anchor, owner L0).
- Each **connection** = temporary graph edge (invite, call, event join).
- Each **session** = bounded container participants subscribe to.

---

## 1. Node types

```text
CastleNode {
  castleId, ownerUid, homeAnchor?, displayRef
}

PresenceNode {
  uid, castleId, sessionId?, epoch,
  mode: idle | linking | in_session | observing
}

SessionInstance {
  sessionId, kind, lifecycleState,
  hostCastleId, worldInstanceId?, createdAtMs
}

SessionEdge {
  fromCastleId, toCastleId | toUid,
  edgeKind: invite | visit | call | event_join,
  expiresAtMs?
}
```

**Rule:** `user` is not a monolithic object in session logic — **user = node in presence graph** with Castle attribution.

---

## 2. Session kinds

| Kind | User verb | Containers |
|------|-----------|------------|
| `private_link` | Friend invite / 1:1 | Duo presence + optional A/V |
| `party` | Small group hangout | Multi presence + shared habitat lens |
| `event` | Concert / live / RSVP | Event instance + audience nodes |
| `observation` | Octo watch mode | Read-only presence; no input authority |

---

## 3. State per session

| Field | Shared? | Notes |
|-------|---------|-------|
| `sessionId` | yes | Container id |
| `sharedFieldState` | **interpretive only** | Rhizoh-mediated mood of session — not execution |
| `perceptionLens` | **no** | Per participant (locale, habitat, fracture) |
| `inputGraph` | **no** | Each user owns ingress |
| `executionGraph` | **never shared** | Frozen per client; grammar routes locally |

---

## 4. Castle-to-Castle flows

### A) Visit / “gel”

1. Host Castle emits `InviteEdge`
2. Guest accepts → `SessionInstance` kind `private_link` or `party`
3. Spatial Session binds **remote projection** into host or shared instance
4. Communication layer attaches A/V if modality includes voice/video

### B) Event join

1. `EventInstance` reaches `LIVE` ([`EVENT_SYSTEM_V1.md`](EVENT_SYSTEM_V1.md))
2. Guests attach `PresenceNode` with role `audience|guest|performer`
3. Session graph links N Castle nodes to one `worldInstanceId`

### C) Observation (Octo watch)

1. `observation` session — no RSVP requirement
2. Presence read-only; Octo feed from host projection
3. Guest input graph unchanged; no cross-tenant WAL

---

## 5. Rhizoh role in session graph

Rhizoh (presence-session coordinator):

| Does | Does not |
|------|----------|
| Open/close session protocol state | Own Firebase signaling |
| Merge presence epochs for **interpretation** | Merge execution state |
| Route chat/voice **context** to active session | Route Cesium commands |

---

## 6. Fracture in sessions

Multi-user desync is **expected**. Fracture renders **aligned distortion** per lens — not “we are in sync” UI.

- Stream latency → phase lag (presentation)
- Guest map + host Octo hero → false-correlation guard (existing P2 rules)
- No session badge · no “connection quality %”

---

## 7. Illegal edges (SE + SG)

| ID | Forbidden |
|----|-----------|
| `SG-IL01` | Shared execution graph across Castles |
| `SG-IL02` | Presence edge → direct `routeCesiumCommandV0` |
| `SG-IL03` | Session master WAL without L0 host ACL |
| `SG-IL04` | Guest input graph override from host session |

---

## 8. Phasing

| Step | Deliverable |
|------|-------------|
| V1 spec | This doc + graph schema sketch |
| V1.1 | `sessionGraphV0.js` read-model (local mock edges) |
| V2 | L1 Firestore envelopes + rules (READY gate) |
| V3 | Gateway handshake + token refs |
