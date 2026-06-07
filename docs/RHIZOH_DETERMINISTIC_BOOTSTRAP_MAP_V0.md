# Rhizoh Deterministic Bootstrap Map (V0)

> **Amaç:** voice · world/Cesium · gateway · layers · LLM schema katmanlarının **hangi sırayla ve hangi koşulda** açıldığını tek sayfada netleştirmek. "İki laptop farklı davranıyor" sınıfı non-determinism hatalarının kök analizi için referans.
>
> **Statü:** `RESEARCH-ONLY` gözlem haritası — frozen `phase*.js` çekirdeğini değiştirmez. Runtime davranışını _tarif eder_, _yönetmez_. Bkz. [`.cursor/rules/frozen-core-habitat.mdc`](../.cursor/rules/frozen-core-habitat.mdc).

## 1. Boot fazları (kanıt: `CASTLE_BOOT` telemetri + kod)

```
═══ FAZ 0 · PRE-REACT (main.jsx — senkron, deterministik) ═══
  boot.log.install
  boot.entry              main.jsx loaded
  boot.crash_telemetry    global error + rejection hooks
  boot.runtime_frame      runtimeFrameId bound (castle.last_frame.v1)
  boot.runtime_snapshot   prod: DevTools globals omitted
  boot.firebase_analytics consent-gated (off → skipped)
        ↓
═══ FAZ 1 · PRE-RENDER GATE (mountCastleApplicationV0) ═══
  boot.ontological_gate   pre-render gate → CONTINUITY_OK   ← BLOCKING; fail → quarantine shell
  boot.world_observability presence + liveMonitor bridge
  boot.rhizoh_ingress     route=app
  boot.react_mount        root rendered; Rhizoh shell routing live
        ↓
═══ FAZ 2 · POST-MOUNT (React effects — ASYNC; makineler arası sıra GARANTİ DEĞİL) ═══
  app.voice.adapter       ~410ms   voiceRegistered, provider=rhizoh-voice-engine-v3   (input layer)
  app.engine.ready        booted   Apex engine + world loop active                    (world/Cesium)
  app.gateway.connected   ~1098ms  WS + LLM transport online                          (gateway/LLM)
        ↓  (her biri kendi state'ine bağlı; aralarında deterministik sıra YOK)
═══ FAZ 3 · VOICE ACTIVATION ═══
  voiceReady ──gate(evaluateVoiceEntryGateV0)──> allow_listen | DEFERRED
```

## 2. Katman ready-koşul tablosu

| Layer | Ready koşulu | Kaynak | Deterministik? |
|-------|--------------|--------|----------------|
| Ontological gate | `CONTINUITY_OK` | `boot/mountCastleApplicationV0.jsx` | ✅ blocking |
| World / Cesium | `booted` state | `AppRhizoh528T0.jsx` (`app.engine.ready`) | ✅ runtime |
| Cesium **assets** | `/cesium/Cesium.js` + `Widgets/widgets.css` deploy edilmiş | `vite.config.js` (cesium plugin + guard) | ✅ (guard ile garanti) |
| Gateway / LLM | WS connect (retry'li) | `gatewayBootObservabilityFilterV0.js` | ⚠️ ağ-bağımlı |
| Voice input | `voiceReady && adapter && !fallback` | `AppRhizoh528T0.jsx` | ✅ (V0 fix sonrası) |

## 3. Voice activation — ideal model

```
BOOT
  ↓
Voice Engine Register (available)        app.voice.adapter
  ↓
Silent Presence Mode (deferred)          voiceReady henüz gate'i açmaz
  ↓
TTS engine available  ──────────────────▶ voiceReady = true   (mount'ta deterministik)
  ↓
User Interaction (mic tap / gesture)     tarayıcı gesture şartı (ayrı, doğru)
  ↓
Active Listening Mode                    evaluateVoiceEntryGateV0 → allow_listen
```

## 4. Çözülen non-determinism: `voiceReady` ⟂ `speakRhizoh`

**Eski (kırık) davranış:** `voiceReady` yalnızca `speakRhizoh()` (TTS) ilk kez çalıştığında `true` oluyordu. Mic activation gate'i `voiceReady` istediğinden:

- **Voice-first kullanıcı:** mic tap → gate `voice_not_ready` → DEFERRED → hiç konuşma olmadığı için `voiceReady` asla `true` olmaz → **kilit**.
- **Text-first kullanıcı:** yaz → reply → `speakRhizoh` → `voiceReady=true` → mic çalışır.

Davranış kullanıcının önce yazıp yazmadığına + tarayıcı TTS/voices/autoplay zamanlamasına bağlıydı → makineler arası tutarsızlık.

**Tanı sinyali yanılgısı:** `handlersAttached: false` bug sinyali **değil** — o telemetri yalnızca eski Chrome `SpeechRecognition` yoluna ait (`voiceSttTelemetryV0.js`). Voice Engine V3 (MediaRecorder) bu yolu kullanmadığından alan tasarımca hep `false`. Asıl sinyal: logda **`app.voice.ready · speech synthesis initialized` satırının hiç görünmemesi** = `voiceReady` hiç flip olmadı.

**Fix (V0):** `voiceReady`, gerçek anlamına ("speech synthesis engine available") göre mount'ta deterministik set edilir; `speakRhizoh` içindeki set zararsız backstop olarak kalır. Mic'in tarayıcı gesture şartı korunur.

```jsx
useEffect(() => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  setVoiceReady(true);
}, []);
```

## 5. Activation path (mic tıklama → dinleme) — doğrulanmış wiring

```
onMicClick → handleMicButtonClick (AppRhizoh528T0.jsx:11499)
  → stampVoiceUserGestureV0("mic_button")          gesture anchor
  → startVoiceLoop (:11459)
      → installVoiceSttTelemetryV0()
      → awaitVoiceAdapterRegistryReadyV0()          adapter hydrate
      → setVoiceLoopEnabled(true)
      → startVoiceToRhizoh(true,{userGestureUrgent}) (:10881)
          → adapter check
          → tryVoiceEntry()  GATE (voiceReady)       ← tek gerçek blocker; V0 fix ile açık
          → V3: bridge.startTurn() (voiceEngineV3TurnBridgeV0.js:330)
              → acquireVoiceStreamLayerLockV1
              → setRhizohFieldState("LISTENING") + setMicListening(true)
              → telemetry: V3_SESSION_BEGIN            ← V3'te "active listening" sinyali
              → engine.start()  (MediaRecorder)
              → V3_STOP → V3_FINAL (transcript) → LLM dispatch
```

**`handlersAttached` neden yanıltıcı:** o telemetri yalnızca eski Chrome `SpeechRecognition` (`STT_HANDLERS_ATTACHED`, `voiceSttTelemetryV0.js:134`) yoluna ait. V3 (MediaRecorder) bu yolu kullanmaz → alan tasarımca hep `false`. V3'ün "binding tamamlandı" karşılığı **`V3_SESSION_BEGIN`**'dir.

## 6. Hızlı doğrulama (konsol)

- Boot sonrası logda **`app.voice.ready`** satırı görünmeli (artık ilk turdan bağımsız).
- Mic'e dokununca beklenen zincir: `MIC_REBIND`/`startVoiceLoop` → **`V3_SESSION_BEGIN`** (field=LISTENING) → konuş → `V3_STOP` → `V3_FINAL`.
- Eğer dokunuşta **yalnızca `VOICE_ENTRY_DEFERRED reason=voice_not_ready`** görünüp `V3_SESSION_BEGIN` **hiç gelmiyorsa** → gate kopuk (V0 öncesi davranış).
- `handlersAttached: true` **aranmaz** — V3'te bu beklenmez (SR-only).
- Cesium: `/cesium/Cesium.js` 200 dönmeli (HTML/`text/html` değil), "Cesium is not defined" olmamalı.
