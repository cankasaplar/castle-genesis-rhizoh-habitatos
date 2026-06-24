# Rhizoh Output Engine v1

**SPECFLOW:** `RESEARCH-ONLY` — assembly manifest; no video render · no YouTube upload API.

## Role in stack

```
Director timeline (scenes)
        ↓
Output Pack (subtitles + checklist + meta)
        ↓
Human screen record + edit
        ↓
YouTube upload (manual)
```

## Console

```javascript
__rhizoh.outputPack({ locale: "tr" })
__rhizoh.printOutputPack({ locale: "tr" })
await __rhizoh.copyOutputPack({ locale: "tr" })
await __rhizoh.exportOutputPackJson({ locale: "tr" })
```

## Pack contents

| Field | Description |
|-------|-------------|
| `programs` | Chess #001 + WorldSports #001 |
| `subtitles` | Timed narrator lines per beat |
| `voiceCues` | Voice sync anchors (`atSec`, `phrase`) |
| `uploadChecklist` | Pre-upload steps |
| `youtubeMeta` | Title templates + disclaimer |
| `markdown` | Full export text |

## UI

Studio drawer → **Output engine** panel (below Director mode).

## Honest limits

- No Sora render
- No YouTube API upload
- Video = screen record + manual edit

## Related

- [`RHIZOH_DIRECTOR_ENGINE_V1.md`](RHIZOH_DIRECTOR_ENGINE_V1.md)
- [`RHIZOH_CHESS_OBSERVATION_SHORT_001_V0.md`](RHIZOH_CHESS_OBSERVATION_SHORT_001_V0.md)
- [`RHIZOH_WORLDSPORTS_OBSERVATION_SHORT_V0.md`](RHIZOH_WORLDSPORTS_OBSERVATION_SHORT_V0.md)
