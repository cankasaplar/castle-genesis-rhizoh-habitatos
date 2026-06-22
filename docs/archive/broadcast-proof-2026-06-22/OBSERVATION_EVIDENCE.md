# Observation Evidence — Two-Client Visual Proof (2026-06-22)

**SPECFLOW:** `RESEARCH-ONLY`  
**Session:** `c2c_host_peer_mqpgxzg0`  
**Video:** `media/2026-06-22 20-12-15.mp4` (ingest pending)

---

## Hypothesis shift

### Previous hypothesis

`DRIFT_DETECTED` (especially `classification=fork` or `driftScore=1.0`) was treated as a **primary reconciliation failure** signal.

### New evidence (visual + panel)

Under **nominal two-client load** (host + incognito guest, `?proof=1`):

| Signal | Observed |
|--------|----------|
| `in sync` | `yes` |
| `drift` | `none` |
| `commitSeq` | aligned across clients (visual) |
| `projectionVer` | aligned (visual) |
| Board | same position on both panes |

**Conclusion:** At nominal load, **deterministic reconciliation appears successful**. The drift lane is **no longer the primary suspect** for “does sync work at all?”

### Remaining uncertainty

Console still shows:

```text
DRIFT_DETECTED … classification=pattern|fork  (during ProposeMove preview)
app.gateway.uncertain → gateway connected     (Render WS soft-fail)
```

Correlation: `driftScore=1.0` often precedes `gateway.uncertain`.  
**Causality not proven** — gateway issue is plausible but not confirmed.

---

## What this proof establishes

> Under normal load, two clients **can** preserve the same authoritative projection.

## What this proof does NOT establish

- Behavior under **burst commits**, **reconnect**, **tab refresh**, **artificial latency**, or **websocket drop**
- Production SLA or DATA-PLANE READY
- That gateway tuning alone fixes all drift

---

## Engineering decision (2026-06-22)

**Do not** jump to gateway heartbeat / timeout tuning as the next exclusive task.

**Do** run **Boundary Failure Tests** first (see [`RHIZOH_BROADCAST_BOUNDARY_FAILURE_TEST_V1.md`](../../RHIZOH_BROADCAST_BOUNDARY_FAILURE_TEST_V1.md)).

Priority order:

1. **Faz 1 — Load injection** (latency, disconnect, reconnect, burst)
2. **Faz 2 — Failure classification** (drift vs projection mismatch vs missed broadcast vs duplicate commit vs snapshot recovery)
3. **Faz 3 — Gateway tuning** (heartbeat, ack timeout, reconnect threshold) — **only after** boundary map exists

---

## Bundle note (mixed deploy)

Recording used mixed client bundles (`index-DNdkvg1u.js` host vs `index-B6S3iZjP.js` guest).  
Round-2 sync fix (PR #314 follow-up commit `9317bee`) should be deployed to **both** tabs before boundary tests.

---

*interpretationOnly: true · Agents may influence interpretation, never execution.*
