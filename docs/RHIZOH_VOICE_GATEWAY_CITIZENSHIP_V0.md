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
window.__rhizoh.observationState.snapshot().voice
await window.__rhizoh.voiceGateway.fetchPresence()
```

Do **not** fetch `onrender.com` directly from `rhizoh.com` — use `fetchPresence()` (app gateway base + token + CORS credentials).

---

## Not in v0

- HTTP fallback path envelope (WS lane only)
- Tower/Media citizenship (separate PRs)
- Live two-client voice proof (manual — after deploy)

*interpretationOnly: true · Observation ≠ Execution*
