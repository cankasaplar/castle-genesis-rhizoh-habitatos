# Event System V1 — concert · live · broadcast · watch

**Tag:** `RESEARCH-ONLY`  
**Parent:** [`MULTI_CASTLE_SOCIAL_EVENT_ARCHITECTURE_V1.md`](MULTI_CASTLE_SOCIAL_EVENT_ARCHITECTURE_V1.md) · [`SESSION_GRAPH_V1.md`](SESSION_GRAPH_V1.md) · [`OCTO_PRESENCE_FIELD_V1.md`](OCTO_PRESENCE_FIELD_V1.md)

---

## 0. User verb

Events are **Experiences** in the Castle → Castle → Experience journey — never “admin creates room.”

---

## 1. Event anatomy

```
EventInstance
  ├── axes (solo/duo/multi · lang · temporal · modality · space)
  ├── lifecycle (DRAFT → … → REPLAY)
  ├── hostCastleId
  └── worldInstanceId (when LIVE)

SessionGraph links Castles → EventInstance
OctoPresenceField binds reactive presence when LIVE + concert/watch
Communication attaches when modality includes voice/video
```

---

## 2. Lifecycle (authoritative)

| State | User sees | World instance | Octo |
|-------|-----------|----------------|------|
| `DRAFT` | Private planning | none | dormant |
| `SCHEDULED` | “Coming soon” surface | none | poster presence |
| `LIVE` | Stage + presence | **bound** | reactive presence |
| `ENDED` | Thank you / summary | detached | wind-down |
| `ARCHIVED` | Listing in past events | read-only | frozen |
| `REPLAY` | Watch recording | read-only projection | playback track |

Only **`LIVE`** may spawn active shared spatial container.

---

## 3. Event modes (modality × space)

| Mode | Tuple sketch | Host | Guests | Octo |
|------|--------------|------|--------|------|
| **Home solo live** | solo · live · concert · home | performer | — | field + projection |
| **Castle visit** | duo · live · visit · remote | host | 1 guest | observer/co-presence |
| **Party** | multi · live · voice · shared | host | N | reactive presence |
| **Concert** | multi · live · concert · shared | host Castle | audience | field perturbation ingress |
| **Broadcast** | multi · live · watch · shared | host | audience | observer; crowd scalar outbound only |
| **Scheduled poster** | multi · planned · concert · shared | host | RSVP | no world bind |
| **Replay** | * · replay · watch · shared | — | watchers | recorded perturbation |

Full axis reference: [`MULTI_CASTLE_SOCIAL_EVENT_ARCHITECTURE_V1.md`](MULTI_CASTLE_SOCIAL_EVENT_ARCHITECTURE_V1.md) §7.

---

## 4. Concert / live space topology

```
1 host Castle (event owner L0)
N guest Castles (RSVP / audience edges)
1 spatial room (Cesium stage + studio Octo projection)

Octo = reactive presence (field perturbation)
Rhizoh = session presence coordinator + chat context
Execution = per-client; never shared
Fracture = per-client post-render desync feel
```

**Host responsibilities (L0 ACL):** open/close `LIVE`, seal archive,—not execution graph for guests.

---

## 5. Language (mono / multi)

| Mode | Behavior |
|------|----------|
| `EL_MONO` | Single UI locale + Rhizoh reply language |
| `EL_MULTI` | Per-participant presentation locale; Rhizoh may code-switch in **interpretation** only |

Language **never** forks routing or executor branches.

---

## 6. Temporal modes in product

| Mode | Product surface |
|------|-----------------|
| **Planned** | Calendar · RSVP · reminders — no live stage |
| **Live** | Full experience — A/V · Octo field · map stage |
| **Past / replay** | Recording · watch party — `ET_REPLAY` gate on perturbation ingress |

---

## 7. RSVP + roles

| Role | Capabilities |
|------|--------------|
| `host` | lifecycle transitions · archive |
| `performer` | stage presence; field perturbation emit (bounded) |
| `guest` | visit-level presence |
| `audience` | watch · crowd scalar contribution (observation) |
| `moderator` | interpretation assist — no executor |

RSVP = **social graph edge only** — never spatial mutation.

---

## 8. Rhizoh in events

| Does | Does not |
|------|----------|
| Bind session context to dialogue | Decide concert setlist via execution |
| Surface active event to UI chrome (presentation) | Shared WAL |
| Coordinate presence epochs for interpretation | Network transport |

---

## 9. Fracture at events

Users feel aliveness — never see diagnostics.

- High audience + chat → habitat phase coupling (existing 3.2)
- Stream/map skew → parallax freeze + shimmer
- No “sync lost” · no quality score

---

## 10. Illegal couplings (event-specific)

See `SE-IL01…07` in parent doc. Add:

| ID | Forbidden |
|----|-----------|
| `EV-IL01` | `SCHEDULED` → world instance bind |
| `EV-IL02` | Audience count → Cesium flyTo |
| `EV-IL03` | Live perturbation without `sessionId` + `ET_LIVE` |

---

## 11. Phasing

| Step | Deliverable |
|------|-------------|
| V1 spec | This doc + lifecycle enum |
| **V1.1** ✔ | [`apps/client/src/castleSocial/`](../apps/client/src/castleSocial/) — axis · session · presence · feed · binding **contracts only** |
| V1.2 | SCHEDULED poster UI shell (presentation only) |
| V2 | RSVP L1 envelopes (READY) |
| V3 | LIVE concert bind + mock perturbation feed |
