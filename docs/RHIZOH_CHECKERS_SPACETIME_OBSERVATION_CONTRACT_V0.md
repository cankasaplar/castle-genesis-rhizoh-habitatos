# Checkers Spacetime Observation Contract v0

**SPECFLOW:** `RESEARCH-ONLY`

## Envelope schema

`castle.rhizoh.checkers_spacetime_observation_envelope.v0`

| Key | Value |
|-----|-------|
| `causalSpaceId` | `checkers.causal.space` |
| `observationWindow` | execution phase window |
| `worldAnchor.nodeId` | `checkers_arena` |
| `worldAnchor.channelId` | `rhizoh_checkers_learning` |
| `worldAnchor.mapPinSource` | `map:node:checkers` |

## Producers

- `buildCheckersSpacetimeObservationEnvelopeV0()`
- `checkersLearningMediaTubeWireV0`
- `emitSpatialTemporalTrailV0("checkers", …)`

## Isolation

Distinct from `go.causal.space` and `sports.causal.space` — no REC bleed.

*interpretationOnly: true*
