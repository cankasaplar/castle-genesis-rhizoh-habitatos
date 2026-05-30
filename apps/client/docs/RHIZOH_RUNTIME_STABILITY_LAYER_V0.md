# Rhizoh Runtime Stability Layer v0

**Status: ARCHITECTURE FROZEN** — CLAG / BEA / IPMP / SFR receive no new features.

## Product surface (only)

```js
window.__CASTLE_RHIZOH_RUNTIME_STABILITY__
// conversationBehavior: rhythm, depthMode, continuity, toneStability, responseContinuity
```

Single log: `[CASTLE_runtime_stability]`

## Internal (not product)

| Module | Role |
|--------|------|
| CLAG + registry + traversal | Internal graph |
| BEA + temporal | Feel engine (rhythm) |
| IPMP + SFR | Internal memory (no UI leak) |

Verbose debug: `VITE_RHIZOH_STABILITY_VERBOSE=1` or DEV → `window.__CASTLE_RHIZOH_CLAG_INTERNAL__`

## Phase abstraction (invisible)

| Internal phase | User-facing feel |
|----------------|------------------|
| accumulate | inhale · calm_open |
| conserve | hold · steady_guarded |
| release | exhale · resonant_pulse |

## Stabilization goals

- Voice + meaning: tone consistency, response continuity
- Latency path: no extra UI graph dumps in prod
- Collapse: one `conversationBehavior` object per tick

## Speech resonance

Primary expression path: [`RHIZOH_GLOBAL_MEANING_ENGINE_V0.md`](RHIZOH_GLOBAL_MEANING_ENGINE_V0.md) (`__CASTLE_RHIZOH_EXPRESSION__`). Speech resonance attaches via voice stream after stability publish.

## Module

`apps/client/src/rhizoh/runtime/rhizohRuntimeStabilityLayerV0.js` · `publishRuntimeStabilityV0`
