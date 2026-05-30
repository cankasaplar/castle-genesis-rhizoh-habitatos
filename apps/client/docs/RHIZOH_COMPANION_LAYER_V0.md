# Rhizoh Companion Rendering Bias v0

**CORE-ELIGIBLE** — tonal rendering bias on meaning → speech (not a separate meaning layer).

## Model

| Wrong | Correct |
|-------|---------|
| assistant / response generation | companion / conversational flow |
| user ↔ agent symmetry | coexisting conversational field |
| Rhizoh owns dialogue | Rhizoh shapes resonance, does not own |

## State

```js
{
  presenceMode: "silent" | "adaptive" | "expressive",
  relationalTone: "close" | "neutral" | "reflective",
  initiativeBias: "user-led" | "co-led" | "autonomous-flow",
  emotionalAttunement: { calm, tension, curiosity, warmth },
  continuityStyle: "memory-aware" | "moment-based",
  flowModel: "shared_speech_field"
}
```

## Voicing

`rhizohConversationVoicingV0.js` — roles: `user` | `companion` (legacy `assistant` maps to `companion`).

## Pipeline position

After `rhizohMeaningFrameV0`, before `rhizohGlobalMeaningProjectorV0`.

## Product surface

On `__CASTLE_RHIZOH_EXPRESSION__`:

- `flowModel: "shared_speech_field"`
- `companion` (collapsed)
- `conversationBehavior.companionPresence`

Module: `apps/client/src/rhizoh/runtime/rhizohCompanionLayerV0.js`
