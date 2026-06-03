# Rhizoh MCIB v1 — Multi-Causal Intent Blending

**Status:** ACTIVE — **non-linear** attention biography  
**SPECFLOW:** `RESEARCH-ONLY`  
**As of:** 2026-06-03  
**Parents:** [`RHIZOH_ATTENTION_INERTIA_FIELD_V1.md`](RHIZOH_ATTENTION_INERTIA_FIELD_V1.md) · [`RHIZOH_COGNITIVE_ATTENTION_LAYER_V1.md`](RHIZOH_COGNITIVE_ATTENTION_LAYER_V1.md)

**Tek cümle:** Tek `why_looking` yerine **çoklu motivasyon süperpozisyonu** — içsel çatışma taşıyan varlık modeli.

---

## 0. Kırılma

| Linear propagation | MCIB |
|------------------|------|
| Tek neden → tek devam | Birden fazla **latent neden** |
| `why_looking.code` | `causes[]` + `weight01` |
| Açıklama | **Biography** |

```text
Attention tracking değil → attention biography in real time.
```

---

## 1. Stack (tamamlanmış hikâye katmanı)

| Katman | Rol |
|--------|-----|
| **RPSE** | Varlık |
| **RCAL** | Yön |
| **Inertia** | Akış |
| **Propagation** | Linear hikâye (korunur) |
| **MCIB** | Çoklu motivasyon alanı (internal) |
| **CCF** | Deneyim tekliği — [`RHIZOH_CCF_V1.md`](RHIZOH_CCF_V1.md) |
| **TRF** | Graph yeniden şekil (internal) |
| **RESL** | His |

---

## 2. MCIB çıktısı

Modül: `rhizohMultiCausalIntentBlendingV0.js`  
Konum: `attention_inertia.mcib`

| Alan | Anlam |
|------|--------|
| `causes` | `{ code, weight01, source, label_tr/en }[]` — normalize Σ≈1 |
| `dominant` | En yüksek ağırlık (tek “kazanan” değil — first among peers) |
| `forks` | Yakın ağırlıklı **competing traces** |
| `superposition01` | Ne kadar blended (yüksek = çok nedenli) |
| `internal_tension01` | İçsel çatışma skoru |
| `narrative_blended_tr/en` | RESL hint (“Ses · Keşif · Süreklilik”) |
| `linear_primary` | Eski `why_looking` (compat) |

**Kaynaklar (`source`):** `propagation` · `signal` · `drift` · `trf` · `fork`

---

## 3. Attention fork

İki cause arası `weight01` farkı ≤ ~0.18 → `forks[]` dolar:

```text
competing_voice_explore: Ses ↔ Keşif
```

UI değil — cognitive tension metric for RESL (`internalTension01`).

---

## 4. RESL / TRF bağlantısı

- `projection.narrativeHint` ← `narrative_blended_tr` (MCIB)
- `projection.internalTension01` — strip tonu / geçiş süresi (v1.1)
- TRF cause ek aday olarak `causes[]` içine girer

**Yasak:** Cause list → HUD checklist.

---

## 5. İçsel çatışma = varlık derinliği

MCIB ile sistem:

- Sadece **davranış açıklayan** değil
- **İçsel çatışma taşıyan** varlık modeline geçer

Örnek: `voice_open` (0.31) + `user_intent_explore` (0.27) + `continuity_hold` (0.22) + `latent_drift` (0.12).

---

## 6. Publish sırası

```text
derive attention → inertia (propagation) → topology → TRF → enrichInertiaWithMcib(trf)
```

---

## 7. Test

`rhizohMultiCausalIntentBlendingV0.test.js`

---

## 8. Kilit cümle

```text
RPSE = varlık · RCAL = yön · inertia = akış
propagation = linear hikâye · MCIB = çoklu motivasyon · RESL = his
```
