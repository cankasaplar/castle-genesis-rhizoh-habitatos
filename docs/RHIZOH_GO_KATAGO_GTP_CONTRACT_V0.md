# Rhizoh Go KataGo GTP Contract v0

**SPECFLOW:** `RESEARCH-ONLY` — sidecar wire format; not execution authority.

## Endpoint

| Env | Example | Required |
|-----|---------|----------|
| `VITE_RHIZOH_KATAGO_GTP_URL` | `wss://katago-sidecar.example/gtp` | No — bridge dormant when unset |

Sidecar must speak **GTP** (one command per message, responses end with blank line). WebSocket framing: UTF-8 text lines.

## Handshake sequence

```
name
version
protocol_version
boardsize 19
clear_board
```

Ready when sidecar responds `= ...` to `name` and `boardsize`.

## Analysis command (v0)

Replay current arena stones with `play B|W <coord>` then:

```
kata-genmove_analyze B <visits>
```

Parse JSON in `info` lines for `winrate`, `visits`, `pv`.

## Confidence mapping

| Signal | Maps to |
|--------|---------|
| `winrate` ∈ [0,1] | `confidence` for agreement gate |
| missing / timeout | `null` → ingest uses heuristic fallback |

```javascript
confidence = Math.max(0, Math.min(1, winrate))
```

Threshold: `GO_LEARNING_AGREEMENT_MIN_CONFIDENCE_V0` (0.55 today).

## GTP coordinate mapping (19×19)

Arena grid `(x, y)` with `x,y` ∈ [0,18], `y=0` top row:

- Column: `a`–`h`, `j`–`t` (skip `i`)
- Row: `19 - y` (GTP row 1 = bottom)

## Status enum

| Status | Meaning |
|--------|---------|
| `not_configured` | env unset |
| `katago_connecting` | WS open in progress |
| `katago_initializing` | GTP handshake |
| `katago_gtp` | ready for analyze |
| `katago_offline` | connect failed |

## Observation envelope

Analysis results are **never** written to WAL or admission gates. They attach only to learning batch samples and DevTools reports.

*See also:* [`RHIZOH_GO_LEARNING_TOPOLOGY_V0.md`](RHIZOH_GO_LEARNING_TOPOLOGY_V0.md) · [`RHIZOH_GO_SPACETIME_OBSERVATION_CONTRACT_V0.md`](RHIZOH_GO_SPACETIME_OBSERVATION_CONTRACT_V0.md)
