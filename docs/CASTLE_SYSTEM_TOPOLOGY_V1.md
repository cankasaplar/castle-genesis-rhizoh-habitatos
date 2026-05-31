# CASTLE System Topology v1

**Tag:** `CORE-ELIGIBLE` · **Status:** SSOT (spec + code registry)  
**Code mirror:** [`apps/client/src/castle/layers/castleLayerRegistryV1.js`](../apps/client/src/castle/layers/castleLayerRegistryV1.js)  
**Gates:** [`castleLayerGateV1.js`](../apps/client/src/castle/layers/castleLayerGateV1.js)

## Purpose

Single truth for **which layer exists**, **who owns it**, **whether it renders**, and **what replaced deprecated UI**.  
Without this, new features land in the wrong shell (spatial map, legacy mic, debug panels).

## T0 product shell (default on rhizoh.com)

| Slot | Component | Renders |
|------|-----------|---------|
| Chat surface | `RhizohT0ShellChromeV1` text + send | Always |
| State indicator | phase · bond · gateway dot · field state | Always |
| Layer toggle | "Gelişmiş" → `advanced_aux` stack | Always |

**Not in default T0 UI:** legacy mic, voice v3 dock mic, voice loop button, full gateway card, Hızlı Başlangıç, onboarding chips, spatial full-page shell.

## Layer status model

| Status | Meaning |
|--------|---------|
| `active` | May run; render per `render` / `envGate` |
| `deprecated` | Code retained; `render: false` unless `renderInAdvanced: true` |
| `research` | (reserved) habitat-only |

## Deprecated registry (do not delete — deactivate)

| Layer id | Replaced by | UI |
|----------|-------------|-----|
| `voice_v1_loop_mic_ui` | `voice_v3_dock_mic` | Legacy loop mic + continuous STT — **off** |
| `voice_v3_dock_mic` | (runtime: `voice_v3_engine`) | Push-to-talk in dock — **Gelişmiş only** |
| `spatial_product_shell` | `t0_core_shell` | `VITE_RHIZOH_SPATIAL_SHELL=1` only |
| `gateway_banner_panel` | state indicator line | Advanced only |
| `first_interaction_chips` | chat seeds (off) | Advanced only |
| `trust_strip_expanded` | `t0_slot_state_indicator` | Advanced only |

## Runtime-only (no React chrome)

- `voice_v3_engine` — headless STT/TTS when `VITE_RHIZOH_VOICE_ENGINE_V3=1`
- `voice_v3_dock_mic` — gated by Gelişmiş + same env flag
- `metehan_observability` — `window.__CASTLE_RHIZOH_RUNTIME_STABILITY__` + `window.__CASTLE_LAYER_AUDIT__`

## Product routes (shell ↔ URL)

See [`rhizohProductTopologyV0.js`](../apps/client/src/rhizoh/product/rhizohProductTopologyV0.js):

| Surface | Path |
|---------|------|
| world | `/` |
| hall | `/hall/main` |
| greenroom | `/greenroom/main` |
| broadcast | `/broadcast/main` |
| studio | `/studio` |
| profile | `/settings` |

## Dependency direction (fixed)

```
ingress → AppRhizoh528 router → t0_core_shell (AppRhizoh528T0)
                              ↘ spatial_product_shell (opt-in env)
runtime (voice_v3, gateway, RLL-O) → never imports UI shells upward
```

## Advanced aux SSOT (T0 ↔ spatial)

Single source: `localStorage` key **`rhizoh.command_panel_aux.v2`**

| Writer | Reader |
|--------|--------|
| T0 `Gelişmiş` toggle | `RhizohT0ShellChromeV1` via prop |
| same write | `RhizohConversationDockV0` via `useSyncExternalStore` |
| cross-tab | `storage` event |

Helpers: [`rhizohCommandPanelPrefsV0.js`](../apps/client/src/rhizoh/runtime/rhizohCommandPanelPrefsV0.js)

No parallel React-only advanced state — T0 uses the same external store subscription.

## Observability check (Metehan / debug)

```js
window.__CASTLE_LAYER_AUDIT__  // mismatches: mounted && !shouldRender
window.__CASTLE_RHIZOH_RUNTIME_STABILITY__
```

## Phase roadmap

1. **Cleanup (now)** — T0 shell, registry, mic UI off  
2. **Topology lock** — CI test on registry + gate  
3. **Rhizoh aesthetic layer** — animation / thought physics (after zemin)
