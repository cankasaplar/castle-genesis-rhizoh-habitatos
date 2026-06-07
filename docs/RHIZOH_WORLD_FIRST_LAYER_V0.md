# Rhizoh world-first layer v0

**SPECFLOW:** `RESEARCH-ONLY` — client UX layering; frozen core untouched.

## Three separated problems

| Layer | Responsibility | Gate / SSOT |
|-------|----------------|-------------|
| **World** | Observation, map feed, location consent | `WorldObservationGateV0` · `window.__RHIZOH_WORLD_OBS__` |
| **Castle** | Optional user anchor in the world (not a building sim) | `CastleInitiationGateV0` · `CASTLE_CREATE` event |
| **PWE** | Persistent pet entity: state truth, render as projection | `window.__CASTLE_PWE__` · Entity → State → Studio → Render |

## Boot order (target)

```
App → World observation gate → (optional) Castle anchor offer → ongoing Studio / Pet / Gateway
```

Not: coordinate form → mandatory castle → then world.

## World gate copy

- **Konumu aç** → browser geolocation → `REAL_MAP` + `__CASTLE_NEXUS_GEO__` (no castle).
- **Konumsuz devam et** → `GLOBE` + `abstract_world_node` nexus geo (no castle, no fake POI).

Storage: `localStorage` key `rhizoh.world_first_observation.v0`.

## Castle optional

Castle anchor is offered only via `castle:open-anchor-offer-v0` / explicit “kale kur” / living-world **Enter castle** affordance. World, Studio, Memory, and gateway run without `__CASTLE_CLIENT_CASTLE_STATE__`.

## Render strategy (priority)

1. World opens (2D-first / light runtime where enabled).
2. Location flow.
3. Studio drawer.
4. PWE state (`__CASTLE_PWE__`).
5. Map pet pin.
6. Castle anchor creation.
7. Full 3D world last.

Single pet model contract: `asset://castle/pet/shane-core.glb` — studio edits scale, tint, mood, animation only.

## Observer checklist (other laptop)

```javascript
window.__RHIZOH_WORLD_OBS__   // phase complete, mode geo|abstract
window.__CASTLE_PWE__         // after optional CASTLE_CREATE
// Profile → Castle pet studio
// ?skip_world_gate=1 — bypass first-run gate (dev)
```
