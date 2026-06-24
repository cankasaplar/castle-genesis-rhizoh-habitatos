# Rhizoh Go KataGo GTP Bridge Topology v0

**SPECFLOW:** `RESEARCH-ONLY` — optional sidecar transport; no frozen `phase*.js` changes.

## Position vs chess LC0

| Layer | Chess LC0 | Go KataGo |
|-------|-----------|-----------|
| Protocol | UCI over WebSocket | GTP over WebSocket |
| Env | `VITE_RHIZOH_LC0_UCI_URL` | `VITE_RHIZOH_KATAGO_GTP_URL` |
| Module | `chessLc0UciBridgeV0.js` | `goKataGoGtpBridgeV0.js` |
| Learning gate | `chessEvalFusionV0` cp | `resolveKataGoConfidenceFromAnalysisV0` winrate |
| Boot | `prewarmChessLc0EngineV0` | `prewarmGoKataGoEngineV0` |
| Authority | interpretation only | interpretation only |

**Principle (unchanged):** KataGo output informs **agreement confidence** — never move execution on the live map.

## Topology

```
go_arena (demo moves)
    → goKataGoGtpBridgeV0 (optional sidecar)
    → winrate / visits → confidence
    → goLearningAgreementGateV0
    → goLearningBatchV0 + spacetime envelope
```

When sidecar is offline or env unset, heuristic confidence (`0.72` demo default) remains — same degradation posture as LC0 stub.

## PR chain (this sprint)

| PR | Scope |
|----|-------|
| #375 docs | This file + GTP contract |
| #376 core | `goKataGoGtpBridgeV0` skeleton + arena stone export |
| #377 wire | ingest confidence hook · boot prewarm · arena status · report |

## Not in v0

- WASM KataGo in-browser (weights too heavy for PWA)
- Rules-complete go arena (capture / ko)
- UGL adapter compile path
- Frozen core mutation

## DevTools smoke (after wire PR)

```javascript
__rhizoh.goKataGoGtpBridge()
await __rhizoh.analyzeGoPositionKataGo({ movetimeMs: 500 })
__rhizoh.goLearningReport()
```

*interpretationOnly: true · Observation ≠ Execution*
