# Rhizoh Fast Speech Mode v0

**CORE-ELIGIBLE** — reorganization only; not a new architecture layer.

## Scheduling (speech-first)

| Phase | Target | Content |
|-------|--------|---------|
| **HOT** sync | 0–300ms | Router → Companion → Speech skeleton → minimal MF → publish |
| **SOFT** async | 300–1200ms | Full MF, CLAG (if needed), depth, full speech shape, influence |
| **DEEP** background | later | Memory shaping, contamination (unchanged policy) |

## Hot path order (corrected)

1. Companion impulse (relational bias)
2. Speech skeleton (chunk plan, no full SME)
3. MF-0 minimal
4. TTS prewarm + optional instant ack phrase
5. Publish `__CASTLE_RHIZOH_EXPRESSION__` + `__CASTLE_RHIZOH_HOT_SPEECH__`

**CLAG never runs on hot path.**

## Wiring (v0.1)

| Entry | Module |
|-------|--------|
| Hot prep + ack | `rhizohLlmTurnHotWireV0.js` → `prepareRhizohLlmTurnV0` |
| Gateway POST | `rhizohLlmTurnClientV0.js` → `postRhizohLlmTurnV0` |
| Voice execution path | `rhizohVoiceLlmDispatchV0.js` → `handleRhizohVoiceTranscriptV0` |
| Chunk TTS reply | `rhizohSpeechChunkTtsV0.js` → `speakRhizohReplyChunkedV0` |
| Studio cognitive | `rhizohCognitiveInvoke.ts` (context patch before fetch) |
| Voice v3 bridge default | `voiceEngineV3TurnBridgeV0.js` when no custom `handleVoiceTranscriptRef` |
| Spatial UI dock | `RhizohConversationDockV0.jsx` + `useRhizohConversationDockV0.js` |
| **Continuity glue** | `rhizohConversationContinuityGlueV0.js` — ack → LLM reply micro handoff |

## Continuity glue (hot ack → LLM TTS)

- `buildConversationContinuityGlueV0` — `bridgeGapMs`, `rateRamp`, `volumeRamp` from `microRhythmFeel`
- `handoffHotSpeechToLlmReplyV0` — waits ack end + gap; optional `…` bridge if LLM slow
- `resolveGlueProsodyForChunkV0` — first reply chunk carries ack prosody (rate 1.04 → 1.0)
- Surface: `window.__CASTLE_RHIZOH_SPEECH_GLUE__`

## Env

`VITE_RHIZOH_FAST_SPEECH_MODE=1` (default) · `0` = legacy synchronous `runRhizohGlobalMeaningTurnV0` path.

## API

- `runRhizohHotSpeechPathV0(input)`
- `scheduleRhizohSoftIntelligencePathV0(input, hot)`
- `awaitRhizohSoftIntelligenceV0()` — wait for soft queue
- `runRhizohGlobalMeaningTurnV0` — delegates here when enabled

Module: `rhizohFastSpeechModeV0.js`
