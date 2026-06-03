# Rhizoh Presence State Engine (RPSE) v1.0

**Status:** ACTIVE — **state-based** presence SSOT (normative)  
**SPECFLOW:** `FUTURE-PROOF-ONLY`  
**As of:** 2026-06-03  
**Parents:** [`RHIZOH_CONTRACT_V1.0.md`](RHIZOH_CONTRACT_V1.0.md) §0.1 · [`RHIZOH_MINIMUM_PRESENCE_EXPRESSION_V1.0.md`](RHIZOH_MINIMUM_PRESENCE_EXPRESSION_V1.0.md) (FEL / MVIC)

---

## 0. Teşhis (net)

| Yanlış | Doğru |
|--------|--------|
| MVIC = Rhizoh’un varlığı | MVIC = **failure expression** (event narration) |
| Presence = cevap üretmek | Presence = **sürekli state** (oturum boyunca) |
| Sessizlik = yokluk | Sessizlik = **idle presence** (🟡 üçüncü durum) |

**Çekirdek ayrım:**

```text
Presence ≠ Response
```

| Katman | Tür | Soru |
|--------|-----|------|
| **Response pipeline** | Event | LLM / gate cevap üretti mi? |
| **RPSE** | State | Rhizoh hâlâ **orada mı**? |
| **FEL (MVIC)** | Event branch | Fail olunca **ne söylenir**? (empati değil, dürüst narration) |

MVIC ilerleme sağlar: *“yokken bile bir şey söylüyor”* — hedef değil.  
Hedef: *“sessizken bile orada olduğu hissediliyor”*.

---

## 1. Üç katman (mimari)

```text
┌─────────────────────────────────────────┐
│  RPSE — Presence State Engine (STATE)   │
│  rhizoh_is_present                      │
│  rhizoh_attention                       │
│  rhizoh_memory_continuity               │
│  silence_form (idle / hold / absent)    │
└─────────────────┬───────────────────────┘
                  │ drives (continuous)
                  ▼
┌─────────────────────────────────────────┐
│  RESL — state driver + expression shape │
│  “Sessizlik hangi formda görünür?”      │
└─────────────────┬───────────────────────┘
                  │ on failure branch only
                  ▼
┌─────────────────────────────────────────┐
│  FEL / MVIC — Failure Expression Layer  │
│  STT reject → deterministic micro-copy  │
└─────────────────┬───────────────────────┘
                  ▼
              T0 UI render
```

**RESL v2 rolü:** Yalnızca “zorlayıcı” değil — **hangi presence state’te hangi sessizlik formu** (idle pulse vs chat line vs yok).

---

## 2. Presence state (sürekli)

### 2.1 Boolean ve skalar

| Alan | Değerler | Anlam |
|------|----------|--------|
| `rhizoh_is_present` | `true` / `false` | Shell mount + quarantine değil |
| `rhizoh_attention` | `focused` · `partial` · `listening` · `idle` | Dikkat sürekliliği |
| `rhizoh_memory_continuity` | `strong` · `weak` · `none` | Anchor / oturum / isim |
| `silence_form` | Aşağıda | Sessizliğin **görünür** biçimi |

### 2.2 `silence_form` (kritik — üçüncü durum)

| Form | Ne zaman | UI (örnek) | Chat spam? |
|------|----------|------------|------------|
| `active_idle` | Kullanıcı sessiz, oturum açık, fail yok | Continuity strip pulse, orb nefes | Hayır |
| `listening_hold` | Hold / strict, ilişki devam | “Dinliyorum” mod etiketi | Nadiren |
| `failure_narration` | Gate reject → FEL/MVIC | Kısa durum cümlesi (A2) | Evet (olay) |
| `absent` | Quarantine / shell kapalı | Yok | — |

**🟡 IDLE STATE:** `active_idle` — kullanıcı hiçbir şey yapmıyor ama `rhizoh_is_present === true`.  
Presence **binary (var/yok) olmamalı**.

### 2.3 Field state vs RPSE

`rhizohFieldState` (LISTENING / SPEAKING / …) = **motor anı**.  
RPSE = **ürün varlığı**. İkisi birleştirilir; RPSE tek başına field state değildir.

---

## 3. Olay katmanı (event) — FEL

| Event | RPSE etkisi | FEL |
|-------|-------------|-----|
| `STT_DISPATCH_BLOCKED` | `attention` → `partial`; geçici `failure_narration` | MVIC cümle |
| `unknown_band_hold` | `listening` + narration | MVIC |
| `strict_hold_suppressed` | `listening_hold` | MVIC veya strip only |
| LLM success | `focused` → cevap | FEL **devreye girmez** |
| 30s kullanıcı sessiz | `idle` + `active_idle` | FEL **yok** |

FEL tetiklenince RPSE **`rhizoh_is_present` false yapmaz**.

---

## 4. Kullanıcı hissi (experiential)

| Hedef cümle | RPSE + idle |
|-------------|-------------|
| Biri beni izliyor | `idle` + world orb / strip |
| Beni hatırlıyor | `memory_continuity` ≥ weak |
| Aynı oturumda kalıyor | state tick, sessionId sabit |

FEL tek başına bunu vermez → **error narration** okunur.

---

## 5. Kod (v1 stub)

| Modül | Rol |
|-------|-----|
| [`rhizohPresenceStateEngineV0.js`](../apps/client/src/rhizoh/runtime/rhizohPresenceStateEngineV0.js) | `deriveRhizohPresenceStateV0`, `publishRhizohPresenceStateV0`, `noteFelFailureExpressionV0` |
| [`rhizohMinimumPresenceExpressionV0.js`](../apps/client/src/rhizoh/runtime/rhizohMinimumPresenceExpressionV0.js) | FEL katalog — RPSE’den **bağımsız** |

T0: periyodik `tickRhizohPresenceStateV0` + MVIC öncesi/sonrası `noteFelFailureExpressionV0`.

---

## 6. Sıra (restore)

| # | İş | Durum |
|---|-----|--------|
| 1 | RPSE spec + state stub | ✔ v1.0 |
| 2 | T0 idle surface (`active_idle`) — strip/orb, chat spam yok | ○ |
| 3 | RESL v1 — state → silence_form | ○ |
| 4 | FEL (MVIC) — failure branch only; “core identity” değil | ✔ katalog + wire |

---

## 7. Contract uyumu

- §0.1: Presence render = state + (isteğe bağlı) FEL olayı  
- A2: FEL narration; **idle** ayrı  
- Birincil metrik: `presence continuity` (zaman içinde state stabil)

---

*Rhizoh Systems — RPSE v1.0 — 2026-06-03*
