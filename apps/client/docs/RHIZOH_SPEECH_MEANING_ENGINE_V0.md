# Speech Meaning Engine v0

**CORE-ELIGIBLE** — read-side resonance for voice + conversation; no execution authority.

## Pipeline

| Stage | Module | Role |
|-------|--------|------|
| Cümle segmenter | `rhizohSpeechSentenceSegmenterV0.js` | sentence / clause / fragment split |
| Anlam yoğunluk haritası | `rhizohSpeechMeaningDensityMapV0.js` | per-segment `density01`, hotspots |
| Vurgu dağıtıcı | `rhizohSpeechEmphasisDistributorV0.js` | normalized emphasis budget |
| Konuşma ritim motoru | `rhizohSpeechRhythmMotorV0.js` | pause / rate / pitch cues from `conversationBehavior.rhythm` |
| Orchestrator | `rhizohSpeechMeaningEngineV0.js` | `runSpeechMeaningEngineV0` |

## Product surface (collapsed)

On `conversationBehavior` after stability publish with `utteranceText`:

```js
speechResonance: {
  segmentCount,
  utteranceDensity01,
  peakEmphasis01,
  meanPauseMs,
  rhythmPacing,
  breathAlign  // inhale | hold | exhale — not accumulate/release
}
```

Log: `[CASTLE_speech_meaning]`

Internal (verbose): `window.__CASTLE_RHIZOH_SPEECH_MEANING_INTERNAL__` when `VITE_RHIZOH_STABILITY_VERBOSE=1` or DEV.

## Wiring

- LLM turn bridge: user `message` → `publishRuntimeStabilityV0({ utteranceText })`
- Voice v3 orchestrator: final transcript → `runSpeechMeaningEngineV0` with last stability behavior
- CLAG / BEA / IPMP remain frozen; this layer only consumes collapsed rhythm

## TTS hint (future)

Rhythm `cues[]` carry `pauseBeforeMs`, `rate`, `pitchDelta01` per segment — wire to `speechSynthesis` / gateway prosody when ready.
