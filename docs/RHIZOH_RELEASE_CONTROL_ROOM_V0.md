# Rhizoh Release Control Room v0

**Status:** ACTIVE — deploy gate picture (not cognitive design)  
**SPECFLOW:** `RESEARCH-ONLY`  
**As of:** 2026-06-03  

**Tek okuma:** Ses → yanıt → T0 · metrik sağlığı · rhizoh.com deploy yüzeyi.

---

## 0. Son karar (deploy)

| Yapılmaz | Yapılır |
|----------|---------|
| Yeni cognitive sistem | İlk 3 sn + voice readiness + silent presence UX |
| MCO hot path | CCF/ECC/TDG freeze |
| Core değişiklik | Continuity first paint |

---

## 1. Ses → yanıt → T0

```text
Mic → STT → RPSE → RCAL/inertia/MCIB (internal)
  → CCF → ECC → TDG → RESL → T0
```

### Sağlam

| Alan | Durum |
|------|--------|
| RPSE varlık | ✔ |
| MCIB UI sızıntısı | ✔ yok |
| CCF tek şimdi | ✔ |
| ECC + TDG akış | ✔ |

### Kritik UX riskleri

| Metrik | Durum | Risk |
|--------|--------|------|
| speech → presence latency | Stabil, optimize değil | İlk tepki gecikmesi → “sessizlik = yokluk” |
| **executionAccepted ratio** | Gate-heavy | **“Duyurdum ama cevap yok”** — en büyük UX risk |
| FEL → MVIC | Doğru motor | Kullanıcı bazen sadece “fallback hissi” |

**Özet:** Engine ✔ · “duyuldum hissi” ⚠ henüz %100 değil.

**Kod SSOT:** `window.__rhizoh.voiceWitnessShadow` · `voiceStt` · CIS `voice.execution_accepted_ratio01`

---

## 2. Metrik sağlığı (system truth)

| Katman | Runtime |
|--------|---------|
| MCIB / TRF / CCF / ECC / TDG | ✔ ölçülebilir |
| **continuity perception gap** | ⚠ sistem stabil ≠ kullanıcı kesintisiz hisseder |

### CIS — Continuity Integrity Score v0

Modül: `rhizohContinuityIntegrityScoreV0.js`  
SSOT: `window.__rhizoh.continuityIntegrityScore`

| Bileşen | Anlam |
|---------|--------|
| `session_coherence01` | TDG/ECC faz hizası |
| `silence_perception_cost01` | absent / FEL maliyeti |
| `response_reentry_smoothness01` | ECC velocity tutarlılığı |
| `fel_disruption_visibility01` | FEL = kaybolma değil |
| `execution_accepted_ratio01` | Ses gate |
| `first_paint_ok` | Checklist A |
| `voice_ready_coherent_ok` | Checklist B |

`product_gate_ok` = `cis01 >= 0.62` — **observe-only** (MCO değil, geri besleme yok).

---

## 3. rhizoh.com deploy gerçeği

### İdeal vs risk

| İdeal | Risk |
|-------|------|
| Landing → T0 → presence | Ingress/legal/flags → T0 gecikmiş |
| Voice explore | İlk 3 sn “boş/sessiz” |
| Backend stabil | Frontend fazlı geliyor |

**Tek cümle risk:** Sistem güçlü — **ilk 5 sn varlık hissi garanti değil**.

### Deploy readiness (dürüst)

| Alan | ~% |
|------|-----|
| Teknik backend | 80–90 |
| Ürün hissi | ~70 |
| Stabilite (first frame) | UI/first paint fix gerekli |

---

## 4. Deploy Ready Patch Set (ACTIVE)

Modül: `rhizohDeployReadyPresenceV0.js`

| Patch | Ne yapar |
|-------|----------|
| **A** First paint | `bootstrapRhizohContinuityFirstPaintV0` — App + T0 rail mount |
| **B** Voice entry | `evaluateVoiceEntryGateV0` — dinleme öncesi silent presence + prewarm |
| **C** Zero frame | `resolveT0ZeroFramePresenceV0` — strip asla boş değil |
| **D** FEL re-entry | `enrichFelCcfTransitionFeelV0` — 300–600ms `presenceReentryHint` |

Voice: `startVoiceToRhizoh` → gate → `VOICE_ENTRY_DEFERRED` log (CCF yeniden çalışmaz).

Strip: `data-rhizoh-zero-frame-policy` · min opacity 0.42 ilk paint.

---

## 5. Release checklist (feature değil)

### A. T0 first frame guarantee

Modül: `rhizohT0FirstFrameBootstrapV0.js`  
Event: `rhizoh:continuity-first-paint-v0`  
SSOT: `window.__rhizoh.continuityFirstPaint`

- İlk paint: `continuity_line` dolu
- Silent = `active_idle` (yokluk değil)
- Ürün cümlesi: **Rhizoh is already present**

### B. Voice ready synchronization

Modül: `rhizohVoiceReadyCoherenceV0.js`  
RPSE · `fieldState` · `voiceReady` · UI listening — aynı clock.

### C. FEL safety UX

Garanti: **hata ≠ yokluk hissi** — FEL sonrası `continuity_line` korunur (RESL).

### D. CCF / ECC / TDG freeze

- MCO: off
- TDG: insurance only
- Deploy öncesi regression-only

### E. Continuity first paint

`bootstrapRhizohContinuityFirstPaintV0()` — App mount + ingress APP phase sonrası.

---

## 6. Observability + hardening (son adım)

[`RHIZOH_CONTINUITY_OBSERVABILITY_V0.md`](RHIZOH_CONTINUITY_OBSERVABILITY_V0.md)

| Bileşen | Rol |
|---------|-----|
| `user_felt_presence_score01` | Non-invasive proxy |
| `continuity_integrity_drift_heatmap` | CIS/TDG drift |
| `first_contact_success_rate01` | İlk 10 sn |
| `cssi` | 0–3 sn stability (A) |

```bash
npm run ops:continuity-smoke-v0
```

---

## 7. Smoke protocol (0–10 sn)

| sn | Beklenen |
|----|----------|
| 0–1 | `continuityFirstPaint.ok === true` |
| 0–3 | Strip: “Rhizoh burada” (zero-frame fallback kabul) |
| 3–5 | `continuityIntegrityScore.cis01` ≥ 0.62 |
| Voice tap | `allow_listen` veya `VOICE_ENTRY_DEFERRED` + silent presence (yokluk yok) |
| FEL sonrası | `data-rhizoh-presence-reentry-ms` 300–600 |

```javascript
window.__rhizoh.continuityFirstPaint
window.__rhizoh.continuityIntegrityScore
```

---

## 8. Output + surface unity (ürün kırılması)

| Katman | Rol |
|--------|-----|
| **RAR** | Ne üretildi + lineage + export graph |
| **RSBL** | T0 truth → tüm surface projection |
| **Unified output** | Tek envelope — [`RHIZOH_UNIFIED_OUTPUT_CONTRACT_V0.md`](RHIZOH_UNIFIED_OUTPUT_CONTRACT_V0.md) |

```javascript
window.__rhizoh.artifactRegistry
window.__rhizoh.surfaceBindings
```

---

## 9. Ontoloji (ürün)

```text
Rhizoh = multi-causal cognition with single-stream lived projection
```

İçeride çok dünya · ortada CCF+TDG · dışarıda ECC+T0+RESL.

**Öncelik:** stability of lived continuity.

---

## 10. Console (release debug)

```javascript
window.__rhizoh.continuityFirstPaint
window.__rhizoh.continuityIntegrityScore
window.__rhizoh.voiceWitnessShadow?.counters
window.__rhizoh.experienceContinuity?.temporal_guard
```
