# City Map Legal Media Gate v1

**SPECFLOW:** `RESEARCH-ONLY` — perception + archive metadata; no frozen `phase*.js` edits.

## Purpose

When legal admission is pending, World Space opens **city_map** (V11 Leaflet) with:

1. A **countdown strip** until legal ack (`RhizohCityMapLegalCountdownStripV0`)
2. **Castle Genesis** media tube primed via `RHIZOH_OPEN_MEDIA_TUBE_EVENT_V1`
3. **YouTube publisher bridge** community ingest (votes, manifesto, protest rows)

Agents influence interpretation, never execution — see `docs/OBSERVATION_FABRIC_V1.md`.

## Modules

| Module | Role |
|--------|------|
| `cityMapLegalCountdownMediaGateV0.js` | Boot gate, countdown tick, city_map + media tube prime |
| `castleArchiveMediaMetaV0.js` | Frequency band, event state, content kind enums |
| `youtubeCommunityDataAdapterV0.js` | Bridge snapshot → community lab rows |
| `RhizohCityMapLegalCountdownStripV0.jsx` | Top strip UI |
| `castleArchiveVaultV0.js` | Persists meta on archive entities |

## Env

- `VITE_YOUTUBE_PUBLISHER_BRIDGE_URL` — bridge `/v0/analytics/latest` (communities optional in JSON)
- `VITE_CASTLE_GENESIS_YOUTUBE_CHANNEL_ID` — live embed channel id

## Build failure note (resolved on main)

Rollup failed when `RhizohOctoEightCameraLabV0.jsx` imported `createWorldSpaceMediaCaptureV0` from `worldSpaceMediaChannelsV0.js`. Correct source: `worldSpaceMediaEngineV0.js` (same as `RhizohWorldSpaceMediaTubeV0.jsx`).

## Tests

```bash
npm run test --workspace=apps/client -- cityMapLegalMediaGateV0
npm run test --workspace=apps/client -- castleArchiveVaultV0
```
