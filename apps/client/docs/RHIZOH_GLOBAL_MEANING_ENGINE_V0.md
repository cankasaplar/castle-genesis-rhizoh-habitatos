# Global Multilingual Meaning Engine v0

**CORE-ELIGIBLE** — expression model (voice-first product). **Meaning-first invariant:** language is rendering only.

## Unified flow (one surface)

```
User input (any language)
  → FAST ROUTER (default)
  → MF-0 (language-free meaning)
  → Companion layer (relational field — not assistant)
  → Global projection (rhythm, not translation)
  → Speech shape + micro-rhythm bias (timing feel)
  → __CASTLE_RHIZOH_EXPRESSION__
  → (optional) CLAG full_pipeline only
```

**Identity:** Rhizoh = companion-driven meaning-flow; speech from shared state, not generated “responses.”

See [`RHIZOH_COMPANION_LAYER_V0.md`](RHIZOH_COMPANION_LAYER_V0.md).

## Modules

| Layer | File |
|-------|------|
| Semantic core | `rhizohMeaningFrameV0.js` |
| Fast router | `rhizohFastConversationRouterV0.js` |
| Projection | `rhizohGlobalMeaningProjectorV0.js` |
| Voice stream | `rhizohVoiceStreamEngineV0.js` |
| Continuity cache | `rhizohContinuityCacheV0.js` |
| Orchestrator | `rhizohGlobalMeaningEngineV0.js` |

## MF-0 (collapsed prod)

```js
{ intent, depth, emotionVector, continuityHook, entities, unresolvedThreads, language }
```

## Routes

- `fast_greet` · `fast_simple` · `continuation` → no CLAG (~60–70% target)
- `expression_only` → default light path
- `full_pipeline` → CLAG enrichment (debate / long / depth ≥ 4)

## Cohort frame

```js
cohortFrame: {
  language: "en" | "tr" | "es" | "jp",
  rhythmPreference: "calm" | "measured" | "flowing" | "engaged",
  depthPreference: 1-5,
  toleranceLatencyMs: 400
}
```

## Product vs frozen stack

| Frozen (internal) | Product |
|-------------------|---------|
| CLAG / BEA / IPMP / SFR | skipped on fast path |
| Global Meaning + Voice Stream | `__CASTLE_RHIZOH_EXPRESSION__` |

Verbose: `VITE_RHIZOH_STABILITY_VERBOSE=1` → `__CASTLE_RHIZOH_EXPRESSION_INTERNAL__`

## Entry

`runRhizohGlobalMeaningTurnV0` · LLM bridge: `runRhizohClagForLlmTurnV0` delegates here.
