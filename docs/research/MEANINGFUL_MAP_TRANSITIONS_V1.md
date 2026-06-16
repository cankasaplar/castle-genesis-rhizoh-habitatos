# Meaningful Map Transitions v1

**SPECFLOW:** `RESEARCH-ONLY` — perception pacing for V11 map pins, SpiralMMO, birds, and Octo/Fox camera lab.

## Problem

Pin clicks and SpiralMMO awakening felt instantaneous — users landed in nests/screens without reading map context. Octo eight-camera lab showed emoji placeholders instead of GLB models (fox missing entirely).

## Solution

### Staged map transitions (`worldMapMeaningfulTransitionV0.js`)

| Phase | Duration | Behavior |
|-------|----------|----------|
| Approach (flyTo) | 2.2s generic / 2.8s Spiral | Leaflet camera moves toward pin |
| Dwell | 1.2s generic / 1.6s Spiral | Pause strip: "read what opens next" |
| Commit | — | Orchestrator action (library, SpiralMMO, etc.) |
| Immersion enter | 1.1s delay | Satellite basemap + chrome hide |

- Hover preview debounced **750ms** (no accidental preview on quick pass)
- SpiralMMO awakening **deduped** — single staged path via orchestrator
- `RhizohMapTransitionApproachStripV0` shows phase label during transition

### Slower SpiralMMO visuals

- Cube stagger: 140ms → **280ms**
- Birds: longer wing/hover/flight/collapse timings
- Collapse handoff: 2.8s → **4.2s**

### Octo / Fox GLB in camera lab

- `ActorGlbNestPreviewV0.jsx` — mini Three.js viewer for `/models/octo-blue-ringed.glb` and `/models/fox1.glb`
- Replaces emoji in all nest/counterpart panes
- Fox-primary YouTube lenses show fox GLB corner preview (NASA lens)

## Tests

```bash
npm run test --workspace=apps/client -- worldMapMeaningfulTransitionV0
```
