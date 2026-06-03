# Rhizoh Multi-Inhabitant Co-Presence v0

**Status:** ACTIVE · **SPECFLOW:** `RESEARCH-ONLY`  
**Modül:** `rhizohMultiInhabitantCoPresenceV0.js`

---

## Entity roles (locked)

| Entity | Rol |
|--------|-----|
| **Pet** | world inhabitant · spatial anchor |
| **Agent** | RCAL subscriber · cognitive extension |
| **User** | interactive observer / participant |
| **Castle** | shared projection surface |
| **World** | single SSOT |

---

## Rules

- `single_world` — castle projection must not fork world
- `shared_wal` — no inhabitant holds WAL authority
- `scr_frame_bound` — all inhabitants share `coherence_id`
- `no_local_temporal_authority` — `owns_state: false` for all
- **Agent golden rule** — interpret only; see [`RHIZOH_AGENT_COGNITION_BOUNDARY_V0.md`](RHIZOH_AGENT_COGNITION_BOUNDARY_V0.md)

---

## API

- `tickMultiInhabitantCoPresenceV0(ctx?)`
- `registerCastleAgentSubscriberV0({ agent_id, label })`
- `evaluateCoPresenceRulesV0(inhabitants, coherenceId, castle)`

Studio loop stage: `multi_inhabitant_co_presence`

---

## SSOT

```javascript
window.__rhizoh.coPresence
window.__rhizoh.multiInhabitantCoPresence
```

UI: `RhizohCastleCoPresenceStripV0` in studio citizen shell.

---

## Sıra

1. Castle Projection ✔  
2. **Co-presence** ✔ (this doc)  
3. Studio → Castle mapping ✔  
4. Castle network graph — **only after ICL stable** (not now)

5. ~~Castle coherence hardening~~ ✔ [`RHIZOH_CASTLE_COHERENCE_HARDENING_V0.md`](RHIZOH_CASTLE_COHERENCE_HARDENING_V0.md)

6. ~~Organism stabilization~~ ✔ [`RHIZOH_ORGANISM_STABILIZATION_V0.md`](RHIZOH_ORGANISM_STABILIZATION_V0.md)
