# Decision Latency Governance Layer (DLGL) v1.0

**Problem:** ASGL → ACRL → ECL → CAB → human is correct but **serial** → *decision latency inflation*.

DLGL does **not** bypass safety. It **compresses operator cognitive latency** via a pre-built human packet.

---

## Risks addressed

| Domain | Pattern | DLGL response |
|--------|---------|----------------|
| Robotics | Over-safe freeze, delayed actuation | `releaseWhen`: sensor + ACRL + human if high risk |
| Ops | Blocked but cluster healthy | `ops_blocked_but_healthy` — read RAW/GCL first |
| UX | Coherent but feels actionless | `humanDecisionPacket` + ack SLA |

---

## Fast path

`immediate_human_packet` when:

- CAB binding valid
- No critical cross-layer conflicts
- Not `contradictory`
- Inflation pressure not `high`

Skips re-reading ASGL/ACRL/CAB matrices — **not** execution.

---

## Human decision packet

Single bundle: headline, operator decision, CAB banner, health, GCL, `primaryActionId`, `ackSlaMinutes`.

---

## Export

`buildUnifiedStateNarrativeV0()` → `decisionLatencyGovernance`

```bash
npm run ci:decision-latency-gate
```

---

**DPUB** (`DECISION_PACKET_UNCERTAINTY_V1.0.md`) caps the packet: never collapses uncertainty into certainty.

---

*DLGL v1.0 — after CAB; human final owner unchanged.*
