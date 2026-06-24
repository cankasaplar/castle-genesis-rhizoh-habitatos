# Rhizoh Checkers Learning Topology v0

**SPECFLOW:** `RESEARCH-ONLY` — observation framing; no frozen `phase*.js` changes.

## Position vs Go / Chess

| Layer | Chess | Go (v0) | Checkers (v0 target) |
|-------|-------|---------|----------------------|
| Domain fabric | `FULL_ACTIVE` | `EVENT_ACTIVE` | `EVENT_ACTIVE` |
| Learning gate | agreement gate | `goLearningAgreementGateV0` | `checkersLearningAgreementGateV0` |
| Batch + spacetime | implicit | explicit envelope | explicit envelope |
| Media | `rhizoh_learning` | `rhizoh_go_learning` | `rhizoh_checkers_learning` |
| Causal space | chess REC slice | `go.causal.space` | `checkers.causal.space` |

**Principle:** `learning = f(agreement, not events)`

## Spacetime envelope

`castle.rhizoh.checkers_spacetime_observation_envelope.v0` — see [`RHIZOH_CHECKERS_SPACETIME_OBSERVATION_CONTRACT_V0.md`](RHIZOH_CHECKERS_SPACETIME_OBSERVATION_CONTRACT_V0.md)

## Media channels

| Channel ID | Type | Surface |
|------------|------|---------|
| `castle_checkers` | YouTube B-roll / holding | Academy intro |
| `rhizoh_checkers_learning` | `checkers_cluster_live` | Live cluster + learning wire |

Map routing: `map:node:checkers` / `dama` → `rhizoh_checkers_learning`

## PR chain

| PR | Scope |
|----|-------|
| docs | This file + spacetime contract |
| core | gate · batch · report · camera · 8×8 arena stub |
| media | `checkers_cluster_live` · wire · `checkers_arena` pin |

## DevTools smoke

```javascript
await __rhizoh.wireCheckersLearningTube({ force: true, demoMove: true })
__rhizoh.checkersLearningTube()
__rhizoh.checkersLearningReport()
__rhizoh.checkersLearningCamera()
```

*interpretationOnly: true · Observation ≠ Execution*
