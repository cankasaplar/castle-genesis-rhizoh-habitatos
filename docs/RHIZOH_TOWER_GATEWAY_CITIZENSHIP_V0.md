# Rhizoh Tower Gateway Citizenship v0

**SPECFLOW:** `CORE-ELIGIBLE` (gateway + client tower lane — not frozen `phase*.js`)
**Parent:** [`RHIZOH_GATEWAY_CONSOLIDATION_NIGHT_V1.md`](RHIZOH_GATEWAY_CONSOLIDATION_NIGHT_V1.md) · [`RHIZOH_VOICE_GATEWAY_CITIZENSHIP_V0.md`](RHIZOH_VOICE_GATEWAY_CITIZENSHIP_V0.md)

---

## Problem

LLM towers had **map pins + workspaces** but were not **gateway citizens**:

| Passport item | Before | After v0 |
|---------------|--------|----------|
| Presence registry | stub only | ✓ `BROADCAST_REGISTER` kind=tower × 7 |
| Boot registration | manual console | ✓ auto on gateway WS open |
| Workspace focus | — | ✓ `affirmActive` on tower open |
| Observation slice | — | ✓ `observationState.snapshot().towers` |
| System report | voice only | ✓ `tower citizenship: registered/partial/detached` |

---

## LLM towers registered

All rows in `SOVEREIGN_TOWERS_V0` (7): `gemini_tower` … `sora_tower`.

Service id = tower id. Meta includes `provider`, `model`, `lat`, `lon`.

---

## Modules

| Layer | Path |
|-------|------|
| Client | `apps/client/src/rhizoh/runtime/towerGatewayCitizenshipV0.js` |
| Observation | `rhizohObservationStateV1.js` → `.towers` slice |
| Gateway WS | existing `BROADCAST_REGISTER` handler in `server.js` |
| Boot | `matchmakingConsoleV0.js` → `ensure()` after WS open |
| Workspace | `RhizohV11TowerWorkspaceHostV0.jsx` → `affirmActive` |

---

## Console

```javascript
await window.__rhizoh.towerGateway.ensure()           // register all 7
await window.__rhizoh.towerGateway.registerAll()      // alias
window.__rhizoh.towerGateway.listRegistered()
window.__rhizoh.observationState.snapshot().towers
```

Citizenship labels:

| `citizenship` | Meaning |
|---------------|---------|
| `detached` | 0 towers registered |
| `partial` | 1–6 towers registered |
| `registered` | all 7 registered |

---

## Not in v0

- Per-tower ACK / `TOWER_STATE_APPLIED` wire (voice-style commit lane)
- Media player citizenship (next PR)
- HTTP presence filter by `kind=tower` (gateway read path exists; client uses generic presence)

*interpretationOnly: true · Observation ≠ Execution*
