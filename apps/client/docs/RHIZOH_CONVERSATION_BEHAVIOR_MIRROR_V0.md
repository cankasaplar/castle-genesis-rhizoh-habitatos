# Rhizoh conversation behavior mirror v0

**SPECFLOW:** `CORE-ELIGIBLE` (observational phase — no learning, no weight updates)

## Purpose

Passive mirror of conversation behavior for cohort / ops observation:

| Surface | Source |
|---------|--------|
| TR / EN / ES heatmap | `recordConversationMirrorTurnV0` (per language turns, fast path, voice/text) |
| Silence vs speak log | `recordConversationMirrorVoiceRouteV0` (voice router finalize) |
| Ack→reply latency histogram | `markConversationMirrorDispatchV0` + glue / LLM complete events |
| Companion tone drift index | relational tone + warmth delta across turns |

**Not** a training signal. `note: MEASUREMENT_ONLY_NOT_LEARNING`.

## Console

```js
__CASTLE_RHIZOH_CONVERSATION_MIRROR__()
```

Latest cached snapshot: `__CASTLE_RHIZOH_CONVERSATION_MIRROR_SNAP__`.

## Env

| Variable | Default | Effect |
|----------|---------|--------|
| `VITE_RHIZOH_CONVERSATION_MIRROR` | on (`1`) | Set `0` to disable all recording |
| `VITE_RHIZOH_CONVERSATION_MIRROR_UI` | off | Show inspect strip (also DEV, `?mirror=1`) |

## UI

`RhizohConversationMirrorStrip` under **Bağlantı** (gateway detail) when mirror UI is visible.

## Hooks

- `rhizohLlmTurnHotWireV0` — dispatch mark + turn
- `voiceTranscriptConfidenceRouterV0` — speak/silence
- `rhizohConversationContinuityGlueV0` — glue handoff latency
- `rhizohVoiceLlmDispatchV0` — LLM round-trip
- `voiceInstantAckV0` — first speech (instant ack)

## Module

`apps/client/src/rhizoh/runtime/rhizohConversationBehaviorMirrorV0.js`
