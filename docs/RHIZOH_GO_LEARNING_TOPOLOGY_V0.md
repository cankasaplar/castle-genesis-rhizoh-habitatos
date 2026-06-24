# Rhizoh Go Learning Topology v0

**SPECFLOW:** `RESEARCH-ONLY` — observation framing; no frozen `phase*.js` changes.

## Position vs chess

| Layer | Chess (today) | Go (v0 target) |
|-------|---------------|----------------|
| Domain fabric | `FULL_ACTIVE` | `EVENT_ACTIVE` → `FULL_ACTIVE` (roadmap) |
| Engine | Stockfish WASM + lc0 stub | Heuristic / KataGo bridge (future) |
| Learning gate | `chessLearningAgreementGateV0` | `goLearningAgreementGateV0` |
| Batch | `chessLearningBatchV0` (32/16) | `goLearningBatchV0` (32/16) |
| Report / camera | `learningReport()` / `chessLearningCamera()` | `goLearningReport()` / `goLearningCamera()` |
| Media | `rhizoh_learning` · `chess_cluster_live` | `rhizoh_go_learning` · `go_cluster_live` |
| Spacetime envelope | implicit (cross-space lanes) | explicit on every batch sample |

**Principle (unchanged):** `learning = f(agreement, not events)` — agreement gate before weight update.

## Spacetime observation contract

Go learning samples carry a **non-executive observation envelope** (see `goSpacetimeObservationEnvelopeV0.js`):

```json
{
  "causalSpaceId": "go.causal.space",
  "observationWindow": { "startMs": 0, "endMs": 0, "phaseId": "phase_1" },
  "worldAnchor": { "nodeId": "go_arena", "channelId": "rhizoh_go_learning", "mapPinSource": "map:node:go" },
  "temporalTrailSeq": 12
}
```

| Field | Source | Authority |
|-------|--------|-----------|
| `causalSpaceId` | domain fabric | interpretation only |
| `observationWindow` | execution phase synchronizer | interpretation only |
| `worldAnchor` | sovereign map node + media channel | interpretation only |
| `temporalTrailSeq` | `rhizohSpatialTemporalTrailV0` ring index | interpretation only |

Agents may influence interpretation, never execution (`docs/OBSERVATION_FABRIC_V1.md`).

## Media player channels

| Channel ID | Type | Surface |
|------------|------|---------|
| `castle_go` | YouTube B-roll / holding | Academy intro |
| `rhizoh_go_learning` | `go_cluster_live` | Live cluster + learning wire in media tube |

Map routing: `map:node:go` → `rhizoh_go_learning` (when live cluster armed); fallback `castle_go`.

## PR chain (this sprint)

| PR | Scope |
|----|-------|
| #368 docs | This file + spacetime contract |
| #369 core | gate · batch · report · camera · arena engine stub |
| #370 media | `go_cluster_live` · media tube wire · map dispatch |

## Not in v0

- KataGo WASM engine
- Full 8-board Go cluster parity with chess
- UGL adapter compile path (`rhizohUglGoAdapterV0`)
- Frozen core mutation

## DevTools smoke

```javascript
window.__rhizoh.goLearningReport()
window.__rhizoh.goLearningCamera()
await window.__rhizoh.wireGoLearningTube({ force: true })
window.__rhizoh.goLearningTube()
```

*interpretationOnly: true · Observation ≠ Execution*
