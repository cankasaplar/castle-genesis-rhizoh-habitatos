# Rhizoh Studio V1 — Visibility Layer

**SPECFLOW:** `RESEARCH-ONLY` — read-only product surface; no execution authority.

## Problem

Life OS v0.1 observation layer is **runtime-complete and prod-verified** but **invisible** in product UI. Risk: *"Çalışıyor ama kimse göremiyor."*

## Strategy

**Do not add new motors.** Surface existing motors in Studio:

| Panel | Runtime source | User story |
|-------|----------------|------------|
| **Life OS Status** | `lifeOsStatus()` | "What did we actually ship?" |
| **World Bridge Memory** | `worldBridgeMemory()` | "User behavior → memory nodes" |
| **Habitat Climate** | `habitatClimate()` | "Session climate labels" |
| **Fusion Timeline** | `getCrossSpaceFusionSnapshotV0()` | "How lanes fuse (cal · media · activity)" |
| **Learning Cameras** | `chess/go/checkersLearningCamera()` | "AI learns by observation" |
| **Academy Union** | `academyLearningUnion()` | Cross-discipline digest |

All panels: `interpretationOnly: true` · no executive affordances.

## 8-camera roadmap (P1 — content feed)

| Camera | v1 Studio | YouTube episode |
|--------|-----------|-----------------|
| Chess Arena | ✔ learning camera digest | Ep 2 |
| Go Arena | ✔ | Ep 2b |
| Checkers Arena | ✔ | Ep 2c |
| Habitat | ✔ climate card | Ep 4 |
| Memory | ✔ graph list | Ep 3 |
| Academy | ✔ union digest | Ep 1 |
| WorldSports | ◐ gateway meta only | Future |
| Spatial | ✘ legal hold | Deferred |

## Insertion points

1. **Studio drawer** (`RhizohProductSurfaceDrawerV0` · `surface === "studio"`) — primary P0
2. **Academy observe** (`/academy/observe`) — secondary handoff
3. **Console** — `__rhizoh.studioVisibility()` for investor demo

## PR chain

| PR | Scope |
|----|-------|
| docs | This file + roadmap + gaps update |
| core | `rhizohStudioVisibilitySnapshotV0.js` + tests |
| wire | `RhizohStudioLifeMemoryPanelV0.jsx` · drawer · boot · observe hub |

## Not in v1

- Kernel / director consoles (remain gated)
- Cesium spatial camera
- WorldSports full loop
- Stripe / Founder Circle billing
- Video render pipeline (content is P1 after Studio)

## Prod smoke (after wire)

1. Open **Studio** bottom drawer (shell bar)
2. See **Life Memory** panel with status ACHIEVED
3. Switch tabs: Memory · Habitat · Fusion · Learning
4. Console: `__rhizoh.studioVisibility()`

*Observation ≠ Execution*
