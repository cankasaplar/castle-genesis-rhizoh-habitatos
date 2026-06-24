# Rhizoh Chess Observation Short #001

**SPECFLOW:** `RESEARCH-ONLY` — content capture manifest; not video render pipeline.

## Title

**Rhizoh Chess Observation #001** — 60s vertical short.

## Record threshold

`movesSeen >= 31` → `readyToRecord: true`

Prod log verified: chess cluster + academy union sufficient for first capture.

## Console

```javascript
__rhizoh.chessObservationShort001()
__rhizoh.chessObservationShort001({ locale: "tr" })
await __rhizoh.copyChessObservationBrief({ locale: "tr" })
__rhizoh.printChessObservationBrief({ locale: "tr" })  // DevTools-safe — no clipboard
```

**DevTools note:** If clipboard throws `NotAllowedError` (tab unfocused), `copyChessObservationBrief` falls back to download or `console.log` — never throws. Use `printChessObservationBrief()` from console.

## Shot list (60s)

| Beat | Sec | Scene | Capture |
|------|-----|-------|---------|
| 1 | 5 | Opening | Studio dashboard · `/studio` |
| 2 | 20 | Learning session | Chess arena live · `/world/space?channel=chess` |
| 3 | 10 | Drift | Learning report · `learningReport()` |
| 4 | 10 | Memory | Demo seed if DORMANT · `studioDemoSeed()` |
| 5 | 10 | Habitat | Climate tab · `habitatClimate()` |
| 6 | 5 | Close | Honest disclaimer |

## UI

Studio dashboard → **Copy brief** when chess moves > 0.

## If `lifeOsStatus: DORMANT`

Memory beat: run `await __rhizoh.studioDemoSeed()` before recording beat 4.

## Disclaimer (every frame)

> Observation only. No autonomous scheduling. `mutationPermitted: false`.

## Related

- [`RHIZOH_YOUTUBE_OBSERVATION_SERIES_V0.md`](RHIZOH_YOUTUBE_OBSERVATION_SERIES_V0.md)
- [`RHIZOH_STUDIO_DASHBOARD_V1.md`](RHIZOH_STUDIO_DASHBOARD_V1.md)
