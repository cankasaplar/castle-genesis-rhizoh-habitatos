# Decision Packet Uncertainty Boundary (DPUB) v1.0

**Failure mode after DLGL:** *decision packet overconfidence* — clean packet read as “everything resolved.”

| Risk | Mitigation |
|------|------------|
| Compression trust inflation | `certaintyCap: bounded_hypothesis`, mandatory banner |
| Hidden contradiction loss | `contradictionDigest` always on packet; fast path cannot strip |
| SLA false urgency | `slaQualification` — ack target only, not deadline or go-signal |

---

## Central invariant

```
dlgl_packet_never_collapses_uncertainty_into_certainty
```

Violating this loses **epistemic transparency**, not just a safety layer.

---

## Enriched human packet

DLGL `humanDecisionPacket` is amended with:

- `uncertaintyEnvelope` (open questions + known unknowns)
- `contradictionDigest` (ECL/ACRL conflicts, always visible on fast path)
- `slaQualification` (disclaimer)
- `overconfidenceRisk` (monitored classes)

---

## Export

`buildUnifiedStateNarrativeV0()` → `decisionPacketUncertaintyBoundary` + enriched packet on `decisionLatencyGovernance.humanDecisionPacket`

```bash
npm run ci:decision-packet-uncertainty-gate
```

---

**EDPL** (`EPISTEMIC_DECISION_PACING_V1.0.md`) — operator pacing + `temporary_static_posture_windows` (not certainty zones).

---

*DPUB v1.0 — after DLGL; preserves uncertainty while compressing latency.*
