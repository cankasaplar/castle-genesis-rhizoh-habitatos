# Rhizoh WorldSports Observation Short v0

**SPECFLOW:** `RESEARCH-ONLY` — Sprint 3 content manifest.

## Prerequisites

Gateway env (server):

- `FOOTBALL_DATA_ORG_TOKEN` and/or `API_SPORTS_KEY`

Client:

- `VITE_LIVE_GATEWAY_BASE` or `VITE_GATEWAY_HTTP`

## Console

```javascript
await __rhizoh.wireWorldSportsTube({ force: true })
__rhizoh.worldSportsTube()
__rhizoh.worldSportsObservationShort001({ locale: "tr" })
__rhizoh.printWorldSportsObservationBrief({ locale: "tr" })
```

Studio boot polls feed every 60s via `startRhizohStudioWorldSportsFeedPollV0`.

## Shot list (50s)

| Beat | Sec | Scene |
|------|-----|-------|
| 1 | 5 | Studio WorldSports tile |
| 2 | 15 | Gateway wire |
| 3 | 25 | Live chips strip |
| 4 | 5 | Honest close |

`readyToRecord: true` when `liveMatchCount > 0` or `pinCount > 0`.

## Related

- [`RHIZOH_DIRECTOR_ENGINE_V1.md`](RHIZOH_DIRECTOR_ENGINE_V1.md)
