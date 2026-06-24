# Rhizoh Director Engine v1

**SPECFLOW:** `RESEARCH-ONLY` — event → scene timeline; interpretation only.

## Thesis

| Role | System |
|------|--------|
| **Rhizoh** | Director — cut rules, narrative anchors |
| **Studio** | Edit desk — dashboard, record guide |
| **Sora** | Render layer — **stub only** (no Sora EP) |

Logs become scenes, not dead telemetry.

## Console

```javascript
__rhizoh.directorTimeline({ locale: "tr" })
__rhizoh.soraPromptPack({ locale: "tr" })   // prompt compiler — no API call
```

## Cut triggers

| Event | Scene kind |
|-------|------------|
| Chess cluster move | `chess_move` |
| Policy drift threshold | `drift_cut` |
| Memory graph nodes | `memory_anchor` |
| Habitat climate label | `habitat_shift` |
| WorldSports live feed | `world_sports_pulse` |
| Chess Short #001 beats | `program_beat` |

## Sora (honest)

Sora EP is **not wired**. `soraPromptPack()` outputs style presets + prompts for future render — pin-only tower today.

## UI

Studio drawer → **Director mode** panel above 8-camera dashboard.

## Related

- [`RHIZOH_CHESS_OBSERVATION_SHORT_001_V0.md`](RHIZOH_CHESS_OBSERVATION_SHORT_001_V0.md)
- [`RHIZOH_WORLDSPORTS_OBSERVATION_SHORT_V0.md`](RHIZOH_WORLDSPORTS_OBSERVATION_SHORT_V0.md)
