# Phase 3D — Threshold Proposal Queue v0 (FROZEN)

**Status:** FROZEN · **Code:** `phase3DProposalQueueV0.js`  
**feedsExecution:** `false` (always)

Mode B closure artifact — shadow suggests, humans actuate via config bump.

---

## Queue record

```json
{
  "schema": "rhizoh.phase3d.proposal_queue.v0",
  "feedsExecution": false,
  "evolutionMode": "human_approved_proposal_semi_actuator",
  "governance": { "...state machine..." },
  "proposals": [],
  "stats": { "pending_human": 0 }
}
```

---

## Proposal record

| Field | Required | Notes |
|-------|----------|-------|
| `schema` | `rhizoh.phase3d.threshold_proposal.v0` | Locked |
| `proposalId` | yes | Opaque id |
| `feedsExecution` | `false` | Locked |
| `kind` | enum | See `PROPOSAL_KIND_V0` |
| `state` | governance state | See state machine doc |
| `delta` | object | Bounded config delta proposal |
| `evidence` | object | `exportRef`, ejector, balance |
| `rationale` | string | Non-product engineering reason |
| `targetConfigSchema` | `rhizoh.phase3.config.v0` | Not live runtime |
| `auditTrail` | array | Every transition logged |

### Proposal kinds (v0)

| Kind | Approve allowed? |
|------|------------------|
| `entropy_limit_delta` | yes |
| `divergence_mid_delta` | yes |
| `divergence_low_delta` | yes |
| `divergence_high_delta` | yes |
| `modeled_projection_schema_bump` | yes (human + migration) |
| `monitoring_hold` | **no** — draft only |

---

## Export

`phase3Observation.proposalQueue` in harness JSON.

---

*Proposal queue v0 — semi-actuator suggestions, zero execution authority.*
