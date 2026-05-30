# Surface reduction pass (live) — V0

**SPECFLOW:** `RESEARCH-ONLY` — checklist for **shipping surface** vs **kept engine**.

## Removed or narrowed for production

| Item | Change |
|------|--------|
| **Atmosphere debug renderer** | `RhizohAtmospherePresenceBridge`: `RhizohAtmosphereRenderer` mounts **only in `import.meta.env.DEV`**. Runtime (`RhizohAtmosphereRuntime`) always on. |
| **Perception debug overlay** | `AppRhizoh528`: `RhizohPerceptionDebugOverlay` mounts **only in DEV**. |
| **Demo path as product surface** | `/demo` route handling in `AppRhizoh528` and `guest` lane in `observationLaneResolveV0` → **DEV only**; prod no automatic demo sandbox. |
| **Runtime snapshot DevTools globals** | `main.jsx`: `__CASTLE_BUILD_RUNTIME_SNAPSHOT__` etc. only in **DEV**; prod boot log notes omission. |

## Kept (engine)

- Live orchestrator, world presence store/runtime, temporal lock, projection adapter + smoothing, Cesium bridge (consumer path), membrane / identity boundaries unchanged.

## Out of scope (this pass)

- **Router multiplicity** (`/studio`, `/greenroom`, live trace URLs) — unchanged; follow-up PR if product wants fewer routes.
- **Studio / health product chrome** — not removed; distinct from Rhizoh debug overlays.

## Related

- [`docs/COGNITIVE_LOAD_LAYER_V0.md`](COGNITIVE_LOAD_LAYER_V0.md)
- [`docs/LIVE_RUNTIME_EXPERIENCE_PHASE_V0.md`](LIVE_RUNTIME_EXPERIENCE_PHASE_V0.md)

## Changelog

| Version | Date | Summary |
|---------|------|---------|
| v0 | 2026-05-12 | Initial pass: prod hides debug overlays, demo path dev-only, snapshot globals dev-only |
