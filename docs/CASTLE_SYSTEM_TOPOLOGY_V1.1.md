# CASTLE System Topology v1.1

**Tag:** `CORE-ELIGIBLE` · **Status:** SSOT (domain ownership — extends v1.0)  
**Parent:** [`CASTLE_SYSTEM_TOPOLOGY_V1.md`](CASTLE_SYSTEM_TOPOLOGY_V1.md)

## Domain ownership (single table)

| Domain | Owner | Wheel? | Product Bar? |
|--------|-------|--------|--------------|
| **Navigation** (destination, route) | Product Bar | ❌ | ✅ |
| **Spatial entry** (perception mode) | Layer Switcher (`rhizohPerceptionModeV0`) | ❌ | ❌ |
| **Cognition state** (layerFocus, seedIntent) | Capability Wheel | ✅ | ❌ |
| **Embodiment** (map / REAL_MAP) | Spatial Shell | ❌ | ❌ |

## Three locks

```
Product Bar      = NEREYE GİDİYORUM     (URL / route)
Layer Switcher   = NASIL ALGILIYORUM    (perceptionMode state)
Capability Wheel = NEYİ YAPABİLİRİM     (cognition bus)
```

## Capability Wheel v1.1 contract

**Removed from node schema:** `href`, `openRealMap`  
**Flag:** `RHIZOH_CAPABILITY_DEPRECATED_NAV = true` in config

**applyNode executes only:**

- `layerFocus` → internal focus shift
- `seedIntent` → chat / cognition injection

Navigation side-effects (`onOpenHref`, `onOpenRealMap`) removed from component props.

## Layer Switcher placeholder

Module: [`rhizohPerceptionModeV0.js`](../apps/client/src/rhizoh/runtime/rhizohPerceptionModeV0.js)

```js
setPerceptionMode("spatial"); // state only — no openRealMap
```

Modes: `t0` · `spatial` · `studio` · `hall` · `live`  
UI control ships in a later PR.

## Registry IDs (v1.1 additions)

| ID | Tier | Role |
|----|------|------|
| `t0_capability_wheel` | A+ | Cognition UI |
| `t0_capability_wheel_nav` | deprecated | Former href/map from wheel |
| `t0_layer_switcher` | A★ | perceptionMode SSOT (runtime) |

## Evolution line (perception, not navigation)

```
State indicator  →  one-line mod
Capability Wheel →  multi-axis cognitive snapshot
Ghost Head         →  continuous field (future)
Kanagawa Cube      →  motion model (future)
```
