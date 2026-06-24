# Go Spacetime Observation Contract v0

**SPECFLOW:** `RESEARCH-ONLY`

## Why spacetime on Go learning samples

Chess learning today is **spatially decoupled** from the world mesh (`chessClusterLearningV0`: `spatialIndependent: true`). Cross-space isolation uses REC slices (`crossSpaceRecReconciliationV0`) but batch samples do not carry explicit world anchors.

Go Academy introduces **explicit spacetime binding** so learning observations remain traceable across:

- **Space** — which map node / media channel framed the session
- **Time** — which execution phase window and temporal trail marker applied
- **Mekân** — world mesh node id (originless topology; Istanbul = bootstrap window only)

This is **observation metadata**, not execution authority.

## Envelope schema

`castle.rhizoh.go_spacetime_observation_envelope.v0`

| Key | Type | Required |
|-----|------|----------|
| `causalSpaceId` | string | yes — `"go.causal.space"` |
| `observationWindow` | `{ startMs, endMs, phaseId }` | yes |
| `worldAnchor` | `{ nodeId, channelId, mapPinSource }` | yes |
| `temporalTrailSeq` | number \| null | no — ring index from spatial temporal trail |
| `locale` | string | no — UI locale at observation time |

## Producer map

| Producer | When |
|----------|------|
| `buildGoSpacetimeObservationEnvelopeV0()` | batch enqueue, media tube wire, manual demo moves |
| `emitSpatialTemporalTrailV0("go", …)` | each accepted learning sample (PR3 wire) |
| `goLearningMediaTubeWireV0` | tube open / refresh |

## Consumer map

| Consumer | Use |
|----------|-----|
| `goLearningBatchV0` | attaches envelope to each pending sample |
| `rhizohGoLearningReportV0` | aggregates `worldAnchor` distribution |
| `rhizohGoLearningCameraV0` | single investor / DevTools snapshot |
| `mediaPlayerGatewayCitizenshipV0` | gateway meta on `rhizoh_go_learning` register |

## Isolation

Go causal space **must not** bleed into chess or sports REC slices:

- `causalSpaceId: "go.causal.space"` — distinct from `sports.causal.space`
- `crossSpaceRecReconciliationV0` — go lane tagged separately (PR3)

## Related docs

- [`RHIZOH_GO_LEARNING_TOPOLOGY_V0.md`](RHIZOH_GO_LEARNING_TOPOLOGY_V0.md)
- [`RHIZOH_CROSS_SPACE_REC_RECONCILIATION_V0.md`](RHIZOH_CROSS_SPACE_REC_RECONCILIATION_V0.md)
- [`apps/client/docs/TEMPORAL_IDENTITY_CONTINUITY_V0.md`](../apps/client/docs/TEMPORAL_IDENTITY_CONTINUITY_V0.md)

*interpretationOnly: true*
