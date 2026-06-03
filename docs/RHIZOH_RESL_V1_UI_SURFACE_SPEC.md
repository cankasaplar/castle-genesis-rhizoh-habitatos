# Rhizoh RESL v1 — UI Surface Spec

**Status:** ACTIVE — **presentation policy** SSOT (normative)  
**SPECFLOW:** `FUTURE-PROOF-ONLY`  
**As of:** 2026-06-03  
**Parents:** [`RHIZOH_PRESENCE_STATE_ENGINE_V1.0.md`](RHIZOH_PRESENCE_STATE_ENGINE_V1.0.md) (RPSE truth) · [`RHIZOH_MINIMUM_PRESENCE_EXPRESSION_V1.0.md`](RHIZOH_MINIMUM_PRESENCE_EXPRESSION_V1.0.md) (FEL) · [`RHIZOH_CONTRACT_V1.0.md`](RHIZOH_CONTRACT_V1.0.md)

**Tek cümle:** RESL, RPSE truth’unu **görünür render semantiğine** çevirir. UI ve FEL **yalnızca RESL çıktısına** bağlanır — `window.__rhizoh.presenceState` doğrudan CSS’e bağlanmaz.

---

## 0. Mimari risk (net uyarı)

| Durum | Risk |
|-------|------|
| RPSE stub var, UI bağlı değil | **Correct architecture, unchanged UX** |
| FEL event-level chat spam | Ürün hâlâ **event-based** hissedilir |
| RESL yok | State doğru hesaplanır, his **değişmez** |

**Yeni gerçek problem:**

```text
Rhizoh state üretiyor ama state görünür hale gelmiyor.
→ render semantics eksik
```

**State authority kuralı (v1 kilidi):**

```text
RPSE  = tek truth kaynağı (state)
RESL  = tek presentation otoritesi (UI policy)
FEL   = RESL alt dalı — yalnızca failure_narration + throttle
UI    = RESL descriptor render — asla ham gate reason’a göre layout
```

---

## 1. Üç katman (sertleştirilmiş)

| # | Katman | Rol | Asla |
|---|--------|-----|------|
| 1 | **RPSE** | Truth: `rhizoh_is_present`, `attention`, `memory`, `silence_form` | UI metni üretmez |
| 2 | **RESL** | Presentation: idle/listening/focused **nasıl görünür** | State yazmaz |
| 3 | **FEL** | Fallback narration: reject → kısa chat | State temsilcisi değil |

```text
RPSE (truth)
  ↓ resolveReslPresentationV0()
RESL (descriptor)
  ↓ RhizohPresenceSurfaceStripV0 + chrome rules
T0 UI

FEL event ──► RESL.fel.allow? ──► chat HUD (throttled)
```

---

## 2. RESL descriptor (normatif çıktı)

Modül: `rhizohReslPresentationPolicyV0.js` → `resolveReslPresentationV0(presenceState)`

| Alan | Tip | Anlam |
|------|-----|--------|
| `continuityLine` | `string \| null` | Strip metni (chat değil) |
| `presenceBadge` | `{ label, tone }` | Kısa mod etiketi |
| `orbModulation` | `{ breathe, intensity01 }` | Globe/orb nefes |
| `showFelChat` | `boolean` | FEL chat satırı izin |
| `showMainHud` | `boolean` | LLM / cevap HUD |
| `chatPlaceholderTone` | `idle \| listening \| active` | Input ipucu |
| `transition` | `none \| fade_in \| pulse` | §5 |

**Kural:** T0 bileşenleri yalnızca bu alanları okur.

**RCAL / inertia sınırı:** `attention_vector` (instant) UI highlight’a **birebir bağlanmaz** — oyuncu HUD riski. RESL yalnızca `cognitiveAttention.attention_inertia.projection` skalarlarını okur (v1.1). Bkz. [`RHIZOH_ATTENTION_INERTIA_FIELD_V1.md`](RHIZOH_ATTENTION_INERTIA_FIELD_V1.md).

---

## 3. `silence_form` → UI surface

### 3.1 `active_idle` (ürünün kalbi)

**Anlam:** Hiçbir şey olmuyor ama bir şey bitmedi.

| Öğe | Davranış |
|-----|----------|
| `continuityLine` (TR) | `Rhizoh burada · hazır` |
| `continuityLine` (EN) | `Rhizoh is here · ready` |
| `presenceBadge` | `Burada` / `Here` · tone `teal-soft` |
| `orbModulation` | `breathe: true`, intensity `0.55–0.72` (RPSE intensity) |
| Chat | **Yok** (FEL kapalı) |
| `mainHudReply` | Gösterme (idle iken stale FEL temizlenir) |

**Yasak:** Idle sırasında FEL cümlesi tekrarı.

### 3.2 `listening_hold` / `attention: listening`

| Öğe | Davranış |
|-----|----------|
| `continuityLine` | `Dinliyorum` / `Listening` |
| `presenceBadge` | Mic-adjacent hint (chrome zaten mic gösterir) |
| `orbModulation` | `breathe: true`, intensity `0.75` |
| Chat | Yalnızca kullanıcı / LLM cevabı |

### 3.3 `focused` / `partial`

| Öğe | Davranış |
|-----|----------|
| `continuityLine` | `partial`: kısa bağlam satırı; `focused`: strip minimal |
| `orbModulation` | intensity `0.85+` |
| Chat | LLM / voice reply normal |

### 3.4 `failure_narration` (geçici)

| Öğe | Davranış |
|-----|----------|
| Süre | RPSE `RPSE_FAILURE_NARRATION_DECAY_MS` (12s) sonra → `active_idle` |
| `showFelChat` | `true` **bir kez** / throttle |
| `continuityLine` | Değişmez (FEL chat ayrı kanal) |
| Strip | FEL ile **aynı anda** pulse bir kez — chat spam yok |

### 3.5 `absent`

| Öğe | Davranış |
|-----|----------|
| Strip | Gizli veya quarantine copy |
| Orb | breathe off |

---

## 4. FEL throttling (RESL policy)

FEL **asla** state temsilcisi değil.

| Kural | Değer |
|-------|--------|
| `fel.minGapMs` | `12_000` (aynı oturumda ardışık FEL chat) |
| `fel.allowWhen` | `silence_form === failure_narration` **ve** throttle açık |
| `fel.denyWhen` | `active_idle`, `listening_hold` (strip yeterli) |
| Idle sırasında | `showFelChat: false` — MVIC arka plana düşer |

Implementasyon: `shouldAllowFelChatV0(rels, lastFelChatAtMs)` in `rhizohReslPresentationPolicyV0.js`; `publishMvicPresenceV0` RESL’e sorar.

---

## 5. State transition animation

| Geçiş | `transition` | Süre | Not |
|-------|--------------|------|-----|
| → `active_idle` | `fade_in` | 400ms | Strip görünür |
| `active_idle` → `listening` | `pulse` | 320ms | Tek pulse |
| → `failure_narration` | `pulse` | 280ms | Strip + bir FEL chat |
| → `focused` | `none` | — | Cevap zaten hareket |
| `failure_narration` → `active_idle` | `fade_in` | 500ms | FEL HUD dismiss |

**prefers-reduced-motion:** tüm pulse → `fade_in` only.

`data-rhizoh-presence-transition={transition}` on strip root.

### 5.1 Transition feel (ürün hissi katmanı)

Modül: `rhizohReslTransitionSemanticsV0.js` → `transitionFeel` on RESL descriptor.

| Alan | Anlam |
|------|--------|
| `durationMs` | Strip / opacity geçiş süresi |
| `delayMs` | Geçiş gecikmesi (attention decay hissi) |
| `curve` | `ease-out` \| `ease-in-out` |
| `attentionDecay01` | Önceki dikkatten sönüm (0–1) |
| `felDampen01` | FEL → idle: chat spike sönümü |
| `reEngagePulse` | idle → listening: tek pulse |

| Geçiş | durationMs (tipik) | Not |
|-------|-------------------|-----|
| FEL → `active_idle` | 520 | `felDampen01` yüksek, strip fade |
| `active_idle` → listening | 320 | `reEngagePulse` |
| listening → `active_idle` | 480 | `delayMs` ile yumuşak dönüş |

`prefers-reduced-motion`: pulse → fade only; süreler kısaltılır.

---

## 6. Multi-surface presence

| Yüzey | Rol | Kaynak |
|-------|-----|--------|
| **Chat** | Konuşma / throttled FEL | T0 HUD |
| **Strip** | Continuity indicator | `RhizohPresenceSurfaceStripV0` ← RESL |
| **Orb / globe** | Varlık hissi | `rhizohReslGlobeModulationV0` ← `orbModulation` |
| **Presence field** | Comms orb nefes | `reslToQppKineticsV0` ← RESL |

RPSE tick → `publishReslPresentationV0` → `syncT0UnifiedPresenceFrameV0` → `window.__rhizoh.presenceFrame` + `rhizoh:t0-presence-frame-v0`. **Temporal authority:** [`RHIZOH_T0_UNIFIED_PRESENCE_FRAME_V1.md`](RHIZOH_T0_UNIFIED_PRESENCE_FRAME_V1.md).

---

## 7. T0 continuity surface (tek yüzey)

Bileşen haritası:

| Bölge | Kaynak | Chat? |
|-------|--------|-------|
| `RhizohPresenceSurfaceStripV0` | RESL `continuityLine` + badge | Hayır |
| `RhizohFlowContinuityStripV0` | FCL flow (orthogonal) | Hayır |
| `RhizohT0ShellChromeV1` `mainHudReply` | LLM veya **throttled FEL** | Evet |
| Orb / globe | RESL `orbModulation` (`breathe`, `breathPeriodMs`, `opacityTarget`) | — |

**Mount:** `T0ContinuitySurfaceRailV0` — `rhizoh:presence-state-v0` event subscribe.

**SSOT event:** `publishRhizohPresenceStateV0` → `window.dispatchEvent('rhizoh:presence-state-v0')`.

---

## 7. Implementasyon sırası (tek doğru yol)

| PR | İçerik | Durum |
|----|--------|--------|
| **RESL-1** | Bu spec + `rhizohReslPresentationPolicyV0.js` + test | ✔ |
| **RESL-2** | `RhizohPresenceSurfaceStripV0` + rail subscribe | ○ |
| **RESL-3** | FEL throttle in `publishMvicPresenceV0` | ○ |
| **RESL-4** | Orb breathe bind (scene adapter) | ○ |
| **RESL-5** | Idle stale HUD clear | ○ |

---

## 8. Experiential debug (render semantics)

| PASS | FAIL |
|------|------|
| Sessiz 30s → strip “Rhizoh burada” | Sessiz → boş strip |
| Reject → bir FEL chat, 12s içinde ikinci yok | Her reject → chat spam |
| `__rhizoh.presenceState.silence_form === active_idle` | State var, strip yok |
| Console state değişince strip güncellenir | State tick, UI donuk |

---

## 9. Anti-patterns (yasak)

| Anti-pattern | Neden |
|--------------|--------|
| UI `execRoute.reason` ile layout | Event-based his |
| FEL = presence | Error narration |
| `pickShadowAckPhrase` rastgele | Robotik presence |
| RPSE bypass ile doğrudan chat | State authority kırılır |
| Idle’da sürekli MVIC | FEL spam |

---

## 10. Contract / RPSE cross-links

- Contract §0.1: presence render = RESL + optional FEL  
- RPSE §6: RESL v1 bu belge  
- FEL doc: alt dal, throttle §4  

---

*Rhizoh Systems — RESL v1 UI Surface Spec — 2026-06-03*
