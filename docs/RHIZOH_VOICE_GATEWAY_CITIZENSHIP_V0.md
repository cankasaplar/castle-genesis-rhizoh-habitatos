# Rhizoh Voice Gateway Citizenship v0

**SPECFLOW:** `RESEARCH-ONLY` · `CORE-ELIGIBLE` (gateway + client voice lane — not frozen `phase*.js`)
**Parent:** [`RHIZOH_GATEWAY_CONSOLIDATION_NIGHT_V1.md`](RHIZOH_GATEWAY_CONSOLIDATION_NIGHT_V1.md)

---

## Problem

Voice was **connected** to gateway (`RHIZOH_VOICE_LIVE_*`, HTTP fallback) but not a **gateway citizen**:

| Passport item | Before | After v0 |
|---------------|--------|----------|
| Presence registry | ❌ | ✓ `BROADCAST_REGISTER` kind=voice |
| Event envelope | ❌ | ✓ `gatewayEvent` on live lane |
| ACK | ❌ | ✓ `VOICE_STATE_APPLIED` → `VOICE_BROADCAST_HEALTH` |
| `sessionId` / `worldId` bind | ❌ local only | ✓ binds active match session when present |
| Observation slice | ❌ | ✓ `observationState.snapshot().voice` |

---

## Wire messages

| Message | Direction | Role |
|---------|-----------|------|
| `RHIZOH_VOICE_LIVE_*` | both | Legacy lane (unchanged type names) |
| `VOICE_TRANSCRIPT_COMMITTED` | gateway → client | Envelope + `voiceCommitSeq` |
| `VOICE_STATE_APPLIED` | client → gateway | ACK after transcript apply |
| `VOICE_BROADCAST_HEALTH` | gateway → client | Aggregated ack meta |

---

## World bind rule

```javascript
boundMatchSessionId = active match session (if any)
worldId = boundMatchSessionId || voiceSessionId
sessionId = opts.sessionId || boundMatchSessionId || live_*
```

---

## Modules

| Layer | Path |
|-------|------|
| Protocol | `packages/protocol/src/index.js` |
| Gateway | `apps/gateway/src/rhizoh/voiceGatewayCitizenshipV0.js` |
| Client | `apps/client/src/rhizoh/runtime/voiceGatewayCitizenshipV0.js` |
| Transport | `apps/client/.../geminiLiveVoiceTransportV0.js` |
| Observation | `rhizohObservationStateV1.js` → `.voice` slice |

---

## Console

```javascript
window.__rhizoh.voiceGateway.resolveContext()
window.__rhizoh.voiceGateway.sessionActive()  // true after first LIVE_WS_READY
window.__rhizoh.observationState.snapshot().voice
await window.__rhizoh.voiceGateway.fetchPresence()
```

Do **not** fetch `onrender.com` or bare `rhizoh.com/rhizoh/...` directly — Firebase SPA rewrites non-API paths to `index.html`. Use `fetchPresence()` (routes via `/api/gatewayProxy/rhizoh/network/presence` on prod).

---

## P0 network admission (voice)

| Root issue | Fix |
|------------|-----|
| `pre_stt_low_energy` at `maxRms ~0.002` | `VOICE_MIN_SPEECH_RMS_V3` 0.012→0.008; `allow_if_session_active` when gateway citizenship registered |
| Presence CORS (`credentials: include` without ACA creds) | `httpCorsPolicyV1` sets `Access-Control-Allow-Credentials: true` for non-wildcard ACAO |
| `STT_DISPATCH_BLOCKED` / `whisper_default_conf` | Gateway session + conversational TR bypass in `voiceTranscriptConfidenceRouterV0` |

Env canaries: `VITE_RHIZOH_VOICE_GATE_BYPASS_PRE_STT`, `VITE_RHIZOH_VOICE_GATE_BYPASS_STT_DISPATCH` (default ON).

---

## Not in v0

- HTTP fallback path envelope (WS lane only)
- Media player citizenship (separate PR — see [`RHIZOH_TOWER_GATEWAY_CITIZENSHIP_V0.md`](RHIZOH_TOWER_GATEWAY_CITIZENSHIP_V0.md) for towers)
- Live two-client voice proof (manual — after deploy)

*interpretationOnly: true · Observation ≠ Execution*
