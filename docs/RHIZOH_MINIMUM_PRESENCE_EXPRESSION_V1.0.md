# Rhizoh — Failure Expression Layer (FEL / MVIC) v1.0

**Status:** ACTIVE — **event-based** failure narration (normative)  
**SPECFLOW:** `FUTURE-PROOF-ONLY`  
**As of:** 2026-06-03 (repositioned — not presence core)  
**Parents:** [`RHIZOH_CONTRACT_V1.0.md`](RHIZOH_CONTRACT_V1.0.md) · [`RHIZOH_PRESENCE_STATE_ENGINE_V1.0.md`](RHIZOH_PRESENCE_STATE_ENGINE_V1.0.md) (RPSE — asıl varlık)

**Tek cümle (düzeltilmiş):** FEL/MVIC, gate reject sonrası **deterministik hata anlatımı**dır — *“Rhizoh yokken bile konuşuyor”* ilerlemesidir, *“sessizken orada”* hedefi değil.

| Eski yanlış isim | Doğru rol |
|------------------|-----------|
| Minimum Varlık İfadesi = presence | **Failure Expression Layer** = event narration |
| presence fallback | **failure narration** (A2 Contract) |

**Presence çekirdeği:** [`RHIZOH_PRESENCE_STATE_ENGINE_V1.0.md`](RHIZOH_PRESENCE_STATE_ENGINE_V1.0.md) — state-based `active_idle`, attention, memory continuity.

---

## 0. Mimari (Contract → RPSE → RESL → FEL)

```text
Input
  ↓
Engine (STT / LLM)
  ↓
Contract — presence continuity birincil
  ↓
RPSE — sürekli state (present / idle / attention / memory)
  ↓
RESL — state → silence_form (idle pulse vs chat line)
  ↓
FEL/MVIC — yalnızca failure branch (event)
  ↓
T0 UI
```

| Katman | Tür | Soru |
|--------|-----|------|
| Contract | Law | Ne vaat edilir? |
| **RPSE** | **State** | Orada mı, idle mı, hatırlıyor mu? |
| RESL | Driver | Sessizlik **nasıl** görünür? |
| **FEL** | **Event** | Reject olunca **ne söylenir**? |

**Kritik:** FEL bypass yasak (A2) ama FEL **`rhizoh_is_present` false yapmaz**. Log-only reject = Contract FAIL.

**Birincil metrik:** `presence continuity` (state), sonra response quality.

---

## 1. Presence intensity scaling (RESL extension — v1 stub)

**Risk:** Her MVIC aynı ağırlıkta kalırsa Rhizoh “robotik presence layer” olur.

**Kural:** Aynı `reason` → aynı **primary** cümle (deterministik); **intensity** (0–1) bağlamla ölçeklenir — UI pulse, strip vurgusu, ileride TTS volume cap.

| Sinyal | Etki |
|--------|------|
| `baseIntensity` (katalog) | `listening` düşük, `acknowledge` yüksek |
| `returningUser` | +0.08 (cap 1) |
| `relationshipTier` | +0.04 × tier (cap +0.12) |
| `presenceMode === listening` | −0.06 floor 0.45 |

Kod: `resolveMvicPresenceIntensityV0` · `buildMvicHudReplyV0().intensity`  
**Variant havuzu:** yalnızca `stableVariantIndex(sessionId, mvicId)` ile — rastgele `Math.random` yasak.

---

## 2. Deterministik seçim (rastgele değil)

Mevcut `pickShadowAckPhraseV0` havuzdan **rastgele** seçer — MVIC v1.0 bunu **ürün ihlali** sayar (aynı reason → farklı gün farklı his).

### 1.1 Seçim algoritması (normatif)

```text
mvicId = catalog[reason].id
locale = resolveOutputLanguageCodeV0()  // OLP-owned, tr-TR kaybı yasak
text   = catalog[mvicId].phrases[locale].primary
```

| Kural | Açıklama |
|-------|----------|
| **primary** | Her `(mvicId, locale)` için tek canonical cümle |
| **variant** | Yalnızca `variantIndex = hashStable(sessionId + reason) % variants.length` — aynı oturumda aynı reason → aynı variant |
| **TTS** | `catalog[mvicId].tts` — `never` \| `optional` \| `prefer_chat_only` |
| **UI** | Her zaman `RhizohT0ShellChrome` chat / main HUD — **never empty** |

Planlanan modül: `apps/client/src/rhizoh/runtime/rhizohMinimumPresenceExpressionV0.js`  
Geçiş: `STT_DISPATCH_BLOCKED`, `speakShadowObservationAckV0`, `resolveVoiceUxFallbackV0` → MVIC resolver.

---

## 2. Presence türleri (UI state)

Sessizlik artık **boşluk değil**, etiketli UI state:

| `presenceMode` | Kullanıcı hissi | TTS |
|----------------|-----------------|-----|
| `acknowledge` | Seni duydum | optional |
| `uncertainty` | Emin değilim, devam | optional |
| `reconnect` | Bağlamı kuruyorum | chat only |
| `listening` | Sessiz eşlik (Hold) | never |
| `mic_hint` | Mikrofon/ortam | chat only |

**Hold ≠ yokluk:** `listening` modunda chat’te kısa satır + isteğe bağlı görsel pulse; sıfır UI yasak.

---

## 3. Katalog — router / gate (`executionAccepted: false`)

Kaynak reason kodları: `voiceTranscriptConfidenceRouterV0.js`, `voiceTranscriptSanityV3.js`, `AppRhizoh528T0` `STT_DISPATCH_BLOCKED`.

| `mvicId` | `reason` (gate) | TR **primary** | EN **primary** | `presenceMode` | TTS |
|----------|-----------------|----------------|----------------|----------------|-----|
| `mvic.whisper_default_conf` | `whisper_default_conf` | Seni duydum; tam net değil — bir kez daha söyler misin? | I heard you; not fully clear — once more? | uncertainty | optional |
| `mvic.unknown_band_hold` | `unknown_band_hold` | Buradayım — seni duyuyorum, devam edebilirsin. | I'm here — I hear you, go on. | acknowledge | optional |
| `mvic.ambient_speech_hold` | `ambient_speech_hold` | Ortam sesi var; bana yönelik bir şey söylersen yanıtlarım. | Room audio detected; speak to me directly and I'll respond. | listening | never |
| `mvic.low_confidence` | `low_confidence` | Tam yakalayamadım — biraz daha net tekrar eder misin? | I didn't catch that clearly — say it again a bit louder? | uncertainty | optional |
| `mvic.script_locale_mismatch` | `script_locale_mismatch` | Dili netleştirelim — Türkçe mi devam edelim? | Let's align language — continue in Turkish? | reconnect | chat only |
| `mvic.whisper_artifact` | `whisper_artifact` | Bir parça net değil; kısaca tekrar eder misin? | Part of that wasn't clear — repeat briefly? | uncertainty | optional |
| `mvic.internal_repetition` | `internal_repetition` | Tekrar eden bir parça duydum; yeni bir cümleyle dener misin? | I heard repetition; try a fresh sentence? | uncertainty | optional |
| `mvic.repeated_hallucination` | `repeated_hallucination` | Aynı şeyi tekrar duyuyorum; farklı bir şekilde söyler misin? | Same phrase again — try wording it differently? | uncertainty | optional |
| `mvic.too_short` | `too_short` | Çok kısa geldi — biraz daha uzun söyleyebilir misin? | That was very short — speak a little longer? | uncertainty | optional |
| `mvic.empty` | `empty` | Ses gelmedi — mikrofona tekrar basıp konuşabilirsin. | No speech detected — tap the mic and try again. | mic_hint | chat only |
| `mvic.audio_silent` | `audio_silent` | Mikrofon sessiz gibi; cihazını kontrol edip tekrar dene. | Mic seems silent; check your device and retry. | mic_hint | chat only |
| `mvic.junk` | `junk` | Anlamlı bir cümle duyamadım — tekrar dener misin? | I couldn't make out words — try again? | uncertainty | optional |
| `mvic.platform_template_leak` | `platform_template_leak` | Buradayım — Rhizoh ile konuşmaya devam edebilirsin. | I'm here — you can keep talking to Rhizoh. | acknowledge | optional |
| `mvic.ui_chrome_echo` | `ui_chrome_echo` | Arayüz yankısı algılandı; doğrudan bana konuş. | UI echo detected; speak directly to me. | mic_hint | chat only |
| `mvic.stt_loop_artifact` | `stt_loop_artifact` | Döngüsel ses algılandı; yeni bir cümle dene. | Loop artifact detected; try a new sentence. | uncertainty | optional |
| `mvic.directed_speech_required` | `directed_speech_required` | Rhizoh diye seslenirsen veya bana sorarsan hemen yanıtlarım. | Say Rhizoh or ask me directly and I'll answer. | acknowledge | optional |
| `mvic.quality_reject` | `quality_reject` | Şu an net değil ama buradayım — tekrar eder misin? | Not clear yet but I'm here — repeat? | uncertainty | optional |
| `mvic.stt_dispatch_blocked` | `STT_DISPATCH_BLOCKED` (event) | Seni duydum; şu an yanıtı hazırlayamıyorum — metinle de yazabilirsin. | I heard you; can't respond by voice right now — you can type too. | reconnect | chat only |

**Contract A2:** Yukarıdaki her satır, log’da reject olsa bile **chat primary** render edilir.

---

## 4. Katalog — dual path / authority

Kaynak: `rhizohVoiceDualPathRouterV0.js`, `rhizohVoiceConversationAuthorityV0.js`.

| `mvicId` | `reason` / `speakMode` | TR **primary** | EN **primary** | `presenceMode` | TTS |
|----------|------------------------|----------------|----------------|----------------|-----|
| `mvic.strict_hold_suppressed` | `strict_hold_suppressed` | Şu an net değil ama buradayım — biraz sonra tekrar deneyebilirsin. | Not sure yet but I'm here — try again in a moment. | listening | never |
| `mvic.speak_silent` | `speakMode: silent` | Dinliyorum; istersen yazarak da devam edebilirsin. | Listening; you can also continue in text. | listening | never |
| `mvic.authority_silent` | `authority_silent` / `VOICE_AUTHORITY_SILENT` | Ses yanıtı kapalı; sohbet satırından devam ediyorum. | Voice reply paused; continuing in chat. | listening | never |
| `mvic.uncertainty_hold` | `uncertainty_hold` / gray hold | Tam duyamadım — bir kez daha söyler misin? | I didn't catch that — could you say it once more? | uncertainty | optional |
| `mvic.micro_verify_technical` | `micro_verify_technical` | Bunu tam net duyamadım — kısaca tekrar eder misin? | I didn't get that clearly — repeat briefly? | uncertainty | optional |
| `mvic.micro_verify_question` | `micro_verify_question` | Sorunu tam yakalayamadım — bir kez daha söyler misin? | I didn't quite catch your question — once more? | uncertainty | optional |
| `mvic.behavior_llm_skip` | `BEHAVIOR_LLM_SKIP` | Seni duydum; şu an kısa bir iç kontrol var — buradayım. | I heard you; a brief internal check — still here. | reconnect | chat only |
| `mvic.fast_noise_drop` | `fast_noise_drop` | Gürültü gibi geldi; Rhizoh'a doğrudan konuşursan devam ederim. | Sounded like noise; speak directly to Rhizoh. | mic_hint | chat only |

**Not:** `unknown_band_slow_completion` LLM yoluna izin veriyorsa MVIC devreye girmez; yalnızca **kullanıcıya sıfır çıktı** kaldığında §3 veya bu tablo uygulanır.

---

## 5. Katalog — süreklilik ve oturum

| `mvicId` | Tetikleyici | TR **primary** | EN **primary** | `presenceMode` |
|----------|-------------|----------------|----------------|----------------|
| `mvic.continuity_restore` | Geri dönen kullanıcı, PAL yüklü | Tekrar hoş geldin — kaldığımız yerden devam edebiliriz. | Welcome back — we can continue. | acknowledge |
| `mvic.continuity_reset` | Oturum sıfırı, bellek yok | Bağlamı yeniden kuruyorum — dilin ve tercihlerin kayıtlı. | Rebuilding context — your language and prefs are kept. | reconnect |
| `mvic.locale_repair` | OLP / locale drift tespiti | Dili netleştirdim — Türkçe ile devam ediyorum. | Language reset — continuing in Turkish. | reconnect |
| `mvic.name_recall` | Profil adı biliniyor | {name}, buradayım. | {name}, I'm here. | acknowledge |

`{name}` — RESL tarafından doldurulur; boşsa `mvic.unknown_band_hold` primary kullanılır (sahte isim yok).

---

## 6. Katalog — QPP / sessiz eşlik (LLM `<SILENCE>`)

| `mvicId` | Tetikleyici | TR **primary** | `presenceMode` |
|----------|-------------|----------------|----------------|
| `mvic.quiet_companion` | `normalizeRhizohOutput` QPP, skipSpeech | Rhizoh şu an sessiz eşlik modunda — buradayım, dinliyorum. | listening |

Mevcut: `materializeCommsFromNormalized` — MVIC ile **aynı canonical** cümle (rastgele değil).

---

## 7. Render kuralları (T0)

| # | Kural |
|---|--------|
| R1 | MVIC metni **her zaman** `setRhizohMainHudReply` veya chat dock’a yazılır |
| R2 | TTS yalnızca `catalog.tts !== never` ve kullanıcı ses tercihi açıksa |
| R3 | `presenceMode` UI badge / continuity strip’te opsiyonel kısa etiket (`listening`, `uncertainty`, …) |
| R4 | Shadow ack **tek başına** yeterli değil — chat satırı olmadan MVIC FAIL |
| R5 | Strict ingest: MVIC chat **zorunlu**; TTS **asla** tek kanal olamaz |

---

## 8. Experiential debugging checklist

Runtime “green” ama kullanıcı yalnız:

| Adım | Soru |
|------|------|
| E1 | Son reject `reason` nedir? |
| E2 | `resolveMvicV0(reason)` çağrıldı mı? |
| E3 | Chat satırında `primary` görünüyor mu? |
| E4 | Yalnızca `speechSynthesis` veya log var mı? → FAIL |

**Teşhis cümlesi:** Rhizoh konuşmuyor değil — **sessizliği anlatılmıyor**.

---

## 9. Implementasyon durumu (dürüst)

| Parça | Durum |
|-------|--------|
| Bu katalog (v1.0) | ✔ normatif |
| `rhizohMinimumPresenceExpressionV0.js` | ✔ v1 (3 reason + blocked + authority) |
| `AppRhizoh528T0` `publishMvicPresenceV0` | ✔ STT_DISPATCH_BLOCKED / REJECT / authority |
| `rhizohVoiceLlmDispatchV0` authority | ✔ `mvic` on return |
| Shadow ack rastgele havuz | ⚠ chat MVIC öncelikli; TTS shadow sonra kaldırılacak |
| RESL spec | ○ planlanan (intensity + name injection) |

**İlk kod PR sırası:** (1) MVIC resolver + testler reason→primary, (2) `AppRhizoh528T0` dispatch blocked branch, (3) authority silent branch, (4) RESL stub locale/name injection.

---

## 10. İhlal

| Durum | Muamele |
|-------|---------|
| Reason katalogda yok | `mvic.quality_reject` fallback + ops log `MVIC_UNKNOWN_REASON` |
| MVIC bypass (strict shadow-only) | Contract §0.1 FAIL |
| Rastgele cümle seçimi (prod) | MVIC v1.0 ihlali |

---

## Özet

> **Çalışmıyorsa bile yokmuş gibi görünemez.**  
> MVIC = existence guarantee. RESL = enforcement. Contract = semantic law.

*Rhizoh Systems — MVIC v1.0 — 2026-06-03*
