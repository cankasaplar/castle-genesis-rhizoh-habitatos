# Trust decay vs mythology dynamics v1.0

**Question:** When divergence appears, what do humans do?

| Fork | Human behavior |
|------|----------------|
| `trust_decay` | “System is unreliable” — churn, support pressure, withdrawal |
| `mythology` | “System sees the truth” — divergence read as depth |
| `ambiguous` | Same signal admits opposite readings |

## Axes

| Axis | Role |
|------|------|
| `exposureRepetition` | Re-exposure → mythology |
| `confidenceDetachmentExposure` | Highest-risk propagation path |
| `influencerRelayCount` | Mass-channel relay (X/YouTube/TikTok) |
| `rawVerificationAccess` | RAW-first UI reduces decay |
| `narrativeContradictionFrequency` | Divergence flags / mismatch |
| `communityReinforcement` | Urban legend + high authority amp |

Scores combine into `trustDecayScore` vs `mythologyScore`; margin ≥ 0.12 picks a fork.

## Wiring

- Input: `validation.divergence` + `humanOps.socialPropagationSimulation`
- Export: `culturalRisk.trustDynamics` on unified narrative
- Hardening: `culturalRisk.trustFork`, axis snapshots

## CI

```bash
npm run ci:trust-dynamics-gate
```

## Product guidance (non-executable)

Emitted per fork in `productGuidance` — ops comms vs anti-myth counter-narrative.

## Related

- [SOCIAL_PROPAGATION_SIMULATION_V1.0.md](./SOCIAL_PROPAGATION_SIMULATION_V1.0.md)
- `confidenceReadabilityPolicy` in propagation sim (bucketed public confidence)
