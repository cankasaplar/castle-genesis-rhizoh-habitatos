# Micro-Rhythm Bias v0

**Not a pipeline layer** — post-pass on `buildVoiceStreamShapeV0` when companion bias is present.

## Tweaks

| Bias | Effect |
|------|--------|
| Sentence break timing | Extra pause on questions / reflective close |
| Hesitation | `hesitationBeforeSpeakMs` (deterministic jitter) |
| Pre-emption | Slightly lower `targetFirstAudioMs` on fast ask |
| Emotional drift smoothing | Warmth EMA vs continuity cache |
| Interrupt hint | `interruptible` on ask / co-led |

## Concrete UX surface

On `conversationBehavior.microRhythmFeel` and `speechShape.microRhythmFeel`:

```js
{ whenYouHearMs, breathGapMs, hesitationMs, canInterrupt, preemptiveStart01, breakStyle }
```

Module: `rhizohMicroRhythmBiasV0.js`
