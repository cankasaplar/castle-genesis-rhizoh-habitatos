# Human-tier ops runbook + SLA v1.0

Decision ownership scales with DAU/tenants; gateway execution stays bounded.

## Tier matrix

| Tier | Trigger | Decision owner | Ack SLA | Resolve SLA | Route id |
|------|---------|----------------|---------|-------------|----------|
| `solo_operator` | DAU &lt; 1k, tenants ≤ 3 | `human_or_external_ops` | 240 min | 1440 min | `rhizoh.ops.solo` |
| `team_on_call_queue` | DAU ≥ 1k or tenants &gt; 3 | `team_on_call_queue` | 60 min | 480 min | `rhizoh.ops.team_oncall` |
| `platform_governance_board` | DAU ≥ 10k or tenants &gt; 20 | `platform_governance_board` | 15 min | 120 min | `rhizoh.ops.platform_governance` |

## Runbook steps (summary)

### Solo

1. Open RAW on hardening status — `rollout.activeTurns`, GCL health.
2. Read POLICY prohibitions — never auto-apply `suggestedActions`.
3. If DERIVED stressed but RAW idle → projection/sim bias; no tier change without RAW.
4. Log decision externally; narrative export is evidence only.

### Team queue

1. Assign incident commander from on-call pool.
2. Ack within 60m; involve FINOPS if GCL degraded.
3. Run misread tabletop if headline confidence drove action.
4. PHASE3D human sign-off for burst/tier/GCL changes.

### Platform governance

1. Convene ops_lead + finops + incident_commander.
2. Ack within 15m; customer comms after RAW + GCL audit alignment.
3. Block CI/scripts applying narrative `suggestedActions`.
4. Post-incident: `npm run ops:state-narrative` + `npm run ci:misread-gate`.

## Code

- `humanDecisionScalingV0.js` — tier resolution
- `humanDecisionOpsRunbookV0.js` — SLA + routing + steps
- Narrative export: `humanOps.humanDecisionOpsRunbook`

## Related

- [PHASE3D_HUMAN_APPROVAL_GOVERNANCE_V1.0.md](./PHASE3D_HUMAN_APPROVAL_GOVERNANCE_V1.0.md)
- [INTERPRETATION_UX_CONTRACT_V1.0.md](./INTERPRETATION_UX_CONTRACT_V1.0.md)
- [NARRATIVE_MISREAD_SIMULATION_V1.0.md](./NARRATIVE_MISREAD_SIMULATION_V1.0.md)
