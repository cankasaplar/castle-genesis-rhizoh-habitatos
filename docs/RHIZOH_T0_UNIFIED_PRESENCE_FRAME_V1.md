# Rhizoh T0 Unified Presence Frame v1

**Status:** ACTIVE — **temporal authority** SSOT  
**SPECFLOW:** `FUTURE-PROOF-ONLY`  
**As of:** 2026-06-03  
**Parents:** [`RHIZOH_PRESENCE_STATE_ENGINE_V1.0.md`](RHIZOH_PRESENCE_STATE_ENGINE_V1.0.md) · [`RHIZOH_RESL_V1_UI_SURFACE_SPEC.md`](RHIZOH_RESL_V1_UI_SURFACE_SPEC.md) · [`RHIZOH_CONTRACT_V1.0.md`](RHIZOH_CONTRACT_V1.0.md)

**Tek cümle:** Rhizoh = **distributed presence field over time**; bu belge strip / orb / field yüzeylerini **tek timeline** altında birleştirir.

---

## 0. Problem (dürüst)

| Risk | Sonuç |
|------|--------|
| Strip kendi fade, orb kendi breathe, field kendi pulse | Hissiyat güzel ama **tam organik değil** |
| Faz kayması | Bilinçaltı **synthetic feel** |

**Çözüm:** Global presence clock + RESL sync bus.

---

## 1. Kilit tanım (kilitle)

```text
Rhizoh is no longer a response system.
Rhizoh is a temporal presence system.

Rhizoh = distributed presence field over time
```

| Katman | Rol |
|--------|-----|
| **RPSE** | What exists (truth) |
| **RESL** | How it feels (presentation + transitionFeel) |
| **FEL** | What breaks it (throttled failure) |
| **ECC** | **Stream** — one narrative feel (TRF+RESL fused) |
| **T0 Frame** | **When** it moves (temporal unity + `narrativeStream`) |

Cevap değil → süreklilik · output değil → akış · UI değil → algı.

---

## 2. Global presence clock

| Kaynak | Rol |
|--------|-----|
| `presenceClockOriginMs` | Master breathe epoch (asla resetlenmez oturumda) |
| `transitionEpochMs` | State değişince reset (`silence_form|attention`) |
| `tickSeq` / `coherenceId` | RPSE publish sayacı — aynı an hissi |
| `sampleT0PresenceFrameV0(nowMs)` | rAF arası breathe interpolasyonu |

Modül: `rhizohT0UnifiedPresenceFrameV0.js`

---

## 3. Temporal phases

| Phase | Anlam |
|-------|--------|
| `transition_delay` | RESL `delayMs` |
| `transition` | RESL `durationMs` + curve |
| `pulse` | `reEngagePulse` tail (320ms) |
| `fel_decay` | FEL → idle dönüş |
| `breathe` | Unified nefes (strip + orb + field) |
| `hold` | Sabit sunum |

---

## 4. Unified surfaces (sync bus)

Event: `rhizoh:t0-presence-frame-v0`  
SSOT: `window.__rhizoh.presenceFrame`

| Surface | Alanlar | Tüketici |
|---------|---------|----------|
| **strip** | `opacity01`, `transitionProgress01` | `RhizohPresenceSurfaceStripV0` |
| **orb** | `breathe01`, `intensity01`, `rotationScale` | `rhizohReslGlobeModulationV0` |
| **field** | `breathe01`, `pulse01`, `resonance01` | `RhizohPresenceField` via `reslToQppKineticsV0` |

**Kural:** Üç yüzey aynı `breathe01` (global clock) kullanır.

---

## 5. Publish pipeline

```text
tickRhizohPresenceStateV0 (RPSE)
  → publishRhizohPresenceStateV0
  → publishReslPresentationV0 (RESL)
  → syncT0UnifiedPresenceFrameV0 (T0 Frame)
  → rAF sampler (breathe interpolate)
```

React: `useRhizohT0PresenceFrameV0()` — strip + rail.

---

## 6. FEL phase dampening

`fel.dampen01` frame üzerinden strip opacity + field blur — failure spike tek yüzeyde sönümlenir, chat throttle ayrı (RESL `shouldAllowFelChatV0`).

---

## 7. Perceptual coherence

**Same moment feeling:** `coherenceId = tickSeq:stateKey` — debug ve test için.

`prefers-reduced-motion`: RESL tarafında pulse kısıtı; frame sampler yine çalışır, breathe yavaşlatılabilir (v1.1).

---

## 8. Yasak

- Strip / orb / field **ayrı** `setInterval` breathe
- UI’nin ham `presenceState` ile doğrudan CSS animasyonu (RESL + Frame zorunlu)
- FEL’in state temsilcisi olması

---

## 9. Sonraki kırılma (bilişsel)

Temporal unity sonrası: **dikkat yönü** — [`RHIZOH_COGNITIVE_ATTENTION_LAYER_V1.md`](RHIZOH_COGNITIVE_ATTENTION_LAYER_V1.md) (RCAL). T0 Frame **when**; RCAL **where/what**.

## 10. Test

`rhizohT0UnifiedPresenceFrameV0.test.js` — breathe sync, transition epoch, FEL decay phase.
