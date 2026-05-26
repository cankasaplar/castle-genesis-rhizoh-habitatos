# Launch Polish Night (V1)

**Tag:** `CORE-ELIGIBLE` (runtime polish) · **not** a feature sprint  
**When:** Before domain + first external access — verify **real runtime behavior**, not perceived intelligence.  
**Parent:** [`RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md`](../../../docs/RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md) (shift after this passes)

**Honest risk map:** Rhizoh’s launch risk is **not** model IQ. It is **orchestration**, **realtime continuity**, **media sync**, and **concurrency integrity**. All are solvable engineering problems.

**Frozen core (do not touch tonight):** v562–v570 `ghost/phase*.js`, canonical laws, attestation, append-only behavior, projection architecture — run `npm run stabilization:validate-graph` before and after.

---

## Captain console (voice snapshot)

After build with latest client:

```javascript
window.__rhizoh.launchPolish.voiceSnapshot()
```

Returns: `voiceTtsSessionId`, `voiceTurnBusy`, `recognitionActive`, `bargeInActive`, `speechSynthesis.speaking/pending`.

Module: `apps/client/src/rhizoh/runtime/launchPolishDiagnosticsV0.js`

---

## 1. Microphone pipeline

**Primary implementation:** `AppRhizoh528.jsx` — `recognitionRef`, `bargeInRecognitionRef`, `startVoiceToRhizoh`, `speakRhizoh`, `startBargeInWhileRhizohSpeaks`.

Rhizoh voice loop uses **Web Speech API** (`SpeechRecognition`), not a persistent `MediaStream` for ASR. Double-capture risk = **two recognition instances** (main + barge-in) or **hot reload** leaving listeners.

### A. Double capture

| Check | How |
|-------|-----|
| Only one main `recognitionRef` | `launchPolish.voiceSnapshot()` → `recognitionActive` + `bargeInActive` not both true during idle |
| Previous rec stopped | `startVoiceToRhizoh` stops `prev` before new `rec` (lines ~11041–11051) |
| Barge-in teardown | `stopBargeInMic()` nulls handlers + `stop()` |
| Dev panel media (separate) | `RhizohDevPanel` `streamRef` — `refreshMedia` stops old tracks before new (`getTracks().forEach(t => t.stop())`) |

**Symptoms:** echo, robotic audio, CPU spike, delayed transcript.

**Manual:** Enable voice loop → speak → during TTS check snapshot — `bargeInActive` may be true briefly; after TTS end both false.

### B. Speech interruption (barge-in)

**Ideal:**

```text
USER SPEAKS (during TTS)
→ speechSynthesis.cancel()
→ voiceTtsSessionId++
→ invalidateRhizohVoiceLlmAudioGate("barge_in_interrupt")
→ fresh ASR → handleVoiceTranscript
```

| Check | Pass |
|-------|------|
| TTS stops within ~500ms | Listen — no overlap with new phrase |
| No ghost continuation | Old reply text not appended to new LLM turn |
| `awaitTtsSettled: true` on voice turns | Preserved in `handleVoiceTranscript` / command path (~11658) |
| LLM audio gate | `llmStreamIdForAudioGate` + `invalidateRhizohVoiceLlmAudioGate` on barge-in |

**Ghost continuation bug:** prior `voiceTtsSessionId` or unstopped TTS chunk reads after interrupt — verify `voiceTtsSessionIdRef` bump on barge-in (~10949).

### C. Silence / end-of-utterance (Turkish)

| Setting | Location | Note |
|---------|----------|------|
| `rec.continuous` | `true` when keepAlive voice loop | |
| `rec.interimResults` | `false` main / `true` barge-in | |
| Restart delay | `VOICE_MIC_LOOP_RESTART_MS` / `VOICE_AFTER_TURN_RESTART_MS` = **420ms** | Tune if TR pauses cut early |
| `voiceTurnBusyRef` | Blocks `onend` restart during LLM/TTS | |

**Test:** Turkish sentence with mid-clause pause — should not split into two sends unless pause > browser default.

**Future:** adaptive VAD / Whisper path — not in Web Speech default; document as known limit.

---

## 2. Camera layer

**Dev / studio media:** `AppRhizoh528.jsx` `RhizohDevPanel` (~5235+) — `streamRef`, `videoRef`, `refreshMedia`.

**Cesium / flight:** separate from voice; test map surface independently.

### A. Toggle spam (10–15×)

| Pass | Fail |
|------|------|
| No black screen stuck | Frozen preview |
| `track.readyState` → `ended` after off | `live` tracks accumulate |
| Memory stable in Performance tab | Climbing heap |

```javascript
// During test — dev panel after refreshMedia:
streamRef.current?.getTracks().forEach(t => console.log(t.kind, t.readyState))
```

### B. Device switching

Laptop cam → USB → OBS virtual cam — `refreshMedia` or re-enumerate; expect one active `srcObject` on `videoRef`.

### C. Permission revoke mid-session

Browser site settings → block camera — UI should show recoverable error (`media izin hatası`), not silent hang.

---

## 3. Audio / TTS pipeline

**Engine:** `window.speechSynthesis` + `SpeechSynthesisUtterance` in `speakRhizoh` (~10677).

### A. Overlapping audio

| Mechanism | Status |
|-----------|--------|
| `speechSynthesis.cancel()` before speak | Yes (~10780) |
| Session supersede | `voiceTtsSessionIdRef` (~10738) |
| Chunked TTS | `splitCastleTtsTextForChunks` + sequential `awaitTtsSettled: true` (~10862) |

**Fail if:** two utterances without cancel — check `speechSynthesis.speaking && pending` in snapshot during single reply.

### B. `awaitTtsSettled` (must keep)

All voice-turn TTS paths should use:

```javascript
await speakRhizoh(text, { voiceTurn: true, awaitTtsSettled: true, llmStreamIdForAudioGate })
```

Watchdog: 120s max (~10791). HUD `rhizohFieldState` should return IDLE after `onend`.

### C. Mobile audio unlock (iOS)

| Test | Action |
|------|--------|
| First TTS without prior tap | May fail — expected |
| After user gesture on mic button | TTS should play |
| `speechSynthesis.resume?.()` | Called in `speakRhizoh` |

Test Safari iOS + Chrome Android.

---

## 4. Multilingual transition

**Current defaults:** `rec.lang` / `utterance.lang` often **`tr-TR`** + `navigator.language` for barge-in (~10938, ~10740).

| Flow | Check |
|------|-------|
| TR → EN → TR | Transcript language matches speech |
| Mixed sentence | No garbage carry in LLM prompt |
| TTS language | `utterance.lang` should follow **response** language policy (verify product intent) |
| Session memory | `continuityRef` / persona — language not locked as wrong dominant state |

**Risk:** session memory treats first language as permanent — inspect `buildContinuityPayload` / `persistContinuityTurn` in voice handler.

**Pass:** TTS speaks English after English LLM reply when product mode expects it.

---

## 5. Multi-user / session isolation

**Speech overlap (research):** `castleSpeechConflictEngineV0.js` — `resolveCastleSpeechOverlapV0` (deterministic, no RNG).

| Isolate | Leak vector |
|---------|-------------|
| Transcript / continuity | `continuityRef`, `readClientContinuity` — per browser profile |
| Ghost / studio state | `uiStore`, `rhizohCompanionSlice` — **singleton** — multi-tab same origin shares store |
| TTS queue | `voiceTtsSessionIdRef` — per tab instance (OK) |
| Gateway | `connectionId`, `getOrCreateCastleDevUid()` — verify per login |

**Pre-domain test:** Two browsers / two profiles — User A text must not appear in User B panel.

**React note:** `uiStore` global — intentional for SPA; not cross-device isolation (server must enforce).

---

## 6. Latency targets (feel = 70% of “intelligence”)

Measure with Performance + `logRhizohHealth` / network tab. Rough targets:

| Layer | Target |
|-------|--------|
| Mic → recognition result | < 700ms first final |
| LLM first token (gateway) | < 1.5s |
| TTS start after text ready | < 2s |
| UI state flip (`LISTENING` / `SPEAKING`) | instant (< 50ms perceived) |

Log keys: `voice_audio_epoch_invalidate`, `tts_suppressed_*`, `[VOICE_RECOGNITION_ERROR]`.

---

## 7. Stress test (15 min)

Single session, aggressive:

1. Voice loop on — talk over Rhizoh (barge-in)  
2. Toggle dev cam/mic if panel open  
3. Switch browser tab away 30s — return  
4. Rapid text + voice alternation  
5. Change `navigator.language` / OS input language mid-session  

| Pass | Fail |
|------|------|
| Persona / tone stable | Fragmented “amnesia” |
| No duplicate listeners | Duplicate replies |
| `launchPolish.voiceSnapshot()` sane | Both rec refs stuck true |

---

## 8. Frozen core gate (end of night)

```bash
npm run stabilization:validate-graph
npm run stabilization:validate-client-boundaries-quick
npm run test -- src/rhizoh/runtime/__tests__/narrativeSourceProvenanceV0.test.js
npm run test -- src/rhizoh/runtime/__tests__/postGoLiveIntegrityLoopV0.test.js
```

Do **not** modify `apps/client/src/ghost/phase562–570` for polish.

---

## 9. Sign-off checklist

| # | Area | Owner | Pass |
|---|------|-------|------|
| 1 | Mic / ASR no double listener | | ☐ |
| 2 | Barge-in kills TTS + no ghost text | | ☐ |
| 3 | Camera toggle / permission | | ☐ |
| 4 | TTS `awaitTtsSettled` + no overlap | | ☐ |
| 5 | iOS audio unlock | | ☐ |
| 6 | Multilingual smoke | | ☐ |
| 7 | Two-profile isolation | | ☐ |
| 8 | Latency spot-check | | ☐ |
| 9 | Stress 15 min | | ☐ |
| 10 | Stabilization CI scripts green | | ☐ |

Log results: [`docs/academic/SESSION_LOG.md`](../../../docs/academic/SESSION_LOG.md)

---

## Related

| Doc | Use |
|-----|-----|
| [`RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md`](../../../docs/RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md) | Domain shift after polish |
| [`RHIZOH_CASTLE_GENESIS_PRODUCTION_ARCHITECTURE_V1.md`](../../../docs/RHIZOH_CASTLE_GENESIS_PRODUCTION_ARCHITECTURE_V1.md) | §0 ESM — no narrative without provenance |
| [`GUARDIAN_FIRST_ANCHOR_RUNBOOK_V0.1.md`](GUARDIAN_FIRST_ANCHOR_RUNBOOK_V0.1.md) | Post-shift Guardian flow |

---

*No new features tonight — stabilize the nervous system. Then open the domain.*
