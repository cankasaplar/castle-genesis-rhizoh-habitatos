# Rhizoh ECC v1 — Experience Continuity Compiler

**Status:** ACTIVE — temporal narrative fusion  
**SPECFLOW:** `RESEARCH-ONLY`  
**As of:** 2026-06-03  

**Ürün tanımı (doğru):** Rhizoh, kullanıcının yaşadığı **tek akışın neden değiştiğini** açıklayan **görünmez süreklilik katmanı** üretir — düşünce geometrisi değil.

---

## 0. Yanlış vs doğru

| Yanlış | Doğru |
|--------|--------|
| “Rhizoh düşünce geometrisi üretiyor” | Görünmez süreklilik + gerekçelendirme |
| TRF = graph evolution engine | TRF = deneyim sürekliliği için **reason** |
| RCAL → UI kristal | RCAL/TRF internal; UI = **tek akış** |

---

## 1. Stack yerleşimi

```text
MCIB → TRF → CCF (collapse)
               ↓
RESL ──────────┼──→ ECC (raw) → **TDG** (phase insurance) → publish
               ↓
          T0 Frame (single narrative stream)
```

CCF = frame · ECC = motion · [`RHIZOH_TEMPORAL_DRIFT_GUARD_V0.md`](RHIZOH_TEMPORAL_DRIFT_GUARD_V0.md) = faz kayması yokluğu.

| Katman | Üretir |
|--------|--------|
| **TRF** | REASON (neden yeniden şekillendi — internal) |
| **RESL** | FEEL (nasıl hissedilir) |
| **ECC** | **STREAM** (bunların tek deneyim gibi algılanması) |
| **T0** | WHEN (zaman çerçevesi + `narrativeStream`) |

---

## 2. ECC görevi

- TRF + RESL + RPSE (+ RCAL/MCIB) → **tek timeline hissi**
- **Event üretmez** — sadece **akış**
- Kullanıcı “değişim oldu” demeden **devamlılık** (temporal narrative fusion)

---

## 3. Çıktı (`experienceContinuity`)

Modül: `rhizohExperienceContinuityCompilerV0.js`

| Alan | Rol |
|------|-----|
| `continuity_line` | Tek görünür metin (RESL tabanlı) |
| `micro_transition` | `hold` \| `drift` \| `shift` \| `settle` \| `breathe` + `undertone_*` (arka plan, eventless) |
| `narrative_velocity` | Hikâye hızı → T0 fade süresi |
| `fade_semantics` | Eventless curve/delay/duration |
| `stream_coherence_id` | T0 `coherenceId` bağlayıcısı |

**Yasak:** Node grafiği · kristal koordinat · cause checklist HUD.

---

## 4. UI kuralı

Görünen:

- Tek akış (`continuity_line`)
- Geçiş hissi (`fade_semantics` + strip opacity)
- Arka plan nedeni (`undertone_weight01` — metin değil, opacity mikro-modülasyon)

Görünmeyen:

- TRF topology · RCAL crystal · MCIB cause list

---

## 5. Publish sırası

```text
RPSE → RESL (partial ECC) → RCAL → TRF → MCIB → ECC full → T0
```

`syncCognitiveAttentionAfterPresenceV0` sonunda `syncExperienceContinuityV0`.

---

## 6. SSOT

```javascript
window.__rhizoh.experienceContinuity
window.__rhizoh.presenceFrame.narrativeStream
```

Event: `rhizoh:experience-continuity-v0`

---

## 7. Kilit cümle

```text
RPSE = varlık · RCAL = yön · TRF = gerekçe (internal)
RESL = his · ECC = tek hikâye · T0 = zaman
```
