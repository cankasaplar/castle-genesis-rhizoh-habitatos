# Rhizoh Match Authority Layer v1

**Tag:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY`  
**Parent:** [`RHIZOH_MATCHMAKING_CORE_SPEC_V1.md`](RHIZOH_MATCHMAKING_CORE_SPEC_V1.md)

**Code:** `apps/client/src/rhizoh/runtime/matchAuthorityLayerV0.js`

---

## 0. SSOT sentence

> **Match state is server-primary** — client shadow may simulate, but only server commit mutates authoritative chess state.

`serverAuthoritative: false` on shadow rehearsal is **honest**, not a bug — it means *effective authority is not yet bound*. The contract still declares `SERVER_PRIMARY`.

---

## 1. Problem

Working shadow loop:

```text
beacon → match → SESSION_ACTIVE
```

Risk if authority is implicit client-owned:

- desync · double move injection · replay divergence · cheating surface

---

## 2. Authority contract (every session)

```javascript
authority: {
  mode: "SERVER_PRIMARY",
  commitRequired: true,
  reconciliation: "diff-merge",
  effectiveAuthority: "SHADOW_CLIENT" | "SERVER" | "PENDING_SERVER_ACK"
}
```

| Field | Meaning |
|-------|---------|
| `mode` | Target policy — always `SERVER_PRIMARY` in prod path |
| `commitRequired` | Moves must be server-acked before committed lane updates |
| `reconciliation` | `diff-merge` when shadow ≠ server |
| `effectiveAuthority` | **Current** binding (shadow until gateway READY) |

---

## 3. Dual lane model

```text
Client shadow lane   → proposeMove()   → rehearsal / UI preview
Server commit lane   → commitMove()    → authoritative FEN + clocks
Reconciliation       → reconcile()     → diff-merge on divergence
```

| Lane | Mutates committed state? |
|------|--------------------------|
| Shadow propose | No |
| Server commit | Yes |
| Client direct `session.move()` without commit | **Blocked** when `commitRequired: true` |

---

## 4. API

```javascript
window.__rhizoh.matchmaking.authority.status();
window.__rhizoh.matchmaking.authority.proposeMove({ san: "e4", playerId: "user_a" });
window.__rhizoh.matchmaking.authority.reconcile({ serverState: { fen, seq } });
```

`session.move()` routes through authority — returns `shadowOnly: true` until server commit.

---

## 5. Phase gate

Until data-plane READY:

- `effectiveAuthority: "SHADOW_CLIENT"`
- `serverAuthoritative: false` (honest)
- Gateway handler will flip to `SERVER` on `MATCH_MOVE_ACK`

---

## Related

- [`RHIZOH_MATCHMAKING_CORE_SPEC_V1.md`](RHIZOH_MATCHMAKING_CORE_SPEC_V1.md)
- [`schemas/rhizoh-match-session-v1.schema.json`](schemas/rhizoh-match-session-v1.schema.json)
