# Rhizoh Attention Inertia Field v1

**Status:** ACTIVE — RCAL **motion continuity** (normative + stub)  
**SPECFLOW:** `RESEARCH-ONLY`  
**As of:** 2026-06-03  
**Parents:** [`RHIZOH_COGNITIVE_ATTENTION_LAYER_V1.md`](RHIZOH_COGNITIVE_ATTENTION_LAYER_V1.md) · [`RHIZOH_RESL_V1_UI_SURFACE_SPEC.md`](RHIZOH_RESL_V1_UI_SURFACE_SPEC.md)

**Tek cümle:** Inertia artık yalnızca smoothing değil — **intent propagation** (neden bakıyor / neden değişti) taşır.

---

## 0. Problem (kaçınılmaz)

| Var | Yok (v1 öncesi) |
|-----|-----------------|
| Nereye bakıyor | **Neden bakıyordu?** |
| Bakıyordu → baktı (trail) | **Bakış neden değişti?** |
| Vector smoothing | **Direction persistence** |

```text
RPSE     → Rhizoh var mı?
RCAL     → Nereye gidiyor?
Inertia  → Nasıl hareket ediyor + neden (propagation)
```

Üçlü tamamlanınca: dijital varlık değil — **süreklilik davranışı olan varlık**.

---

## 1. Kritik sınır (HUD riski)

```text
attention vector ≠ UI highlight
```

| Katman | Rol | Asla |
|--------|-----|------|
| **RCAL instant** | Internal drift sample | Doğrudan CSS / HUD |
| **Inertia field** | Short-horizon smoothed drift | Oyuncu minimap hissi |
| **RESL** | Perceptual projection (`projection.*`) | 1:1 vector → pixel |
| **UI** | Projection artifact only | “Nereye baktı” oku |

Vector → UI animasyon birebir = sistem **oyuncu HUD**’una döner. Yasak.

---

## 2. Stack (güncel)

```text
Signals
  → RCAL instant (WHERE now)
  → Attention Inertia (HOW it moves, ~2–3s)
  → RPSE truth (unchanged scalars)
  → RESL perceptual projection (reads inertia.projection + T0 frame)
  → UI surfaces
```

Publish: `window.__rhizoh.cognitiveAttention`

```json
{
  "attention_vector": { "...": "instant — internal" },
  "attention_inertia": { "smoothed_vector", "trail", "projection" }
}
```

**RESL kuralı:** Yalnızca `attention_inertia.projection` + mevcut descriptor — **not** raw `vx/vy` → DOM.

---

## 3. Inertia mechanics (v1)

Modüller: `rhizohAttentionInertiaFieldV0.js` · `rhizohAttentionIntentPropagationV0.js`

| Mekanizma | Parametre |
|-----------|-----------|
| Vector EMA | `INERTIA_VECTOR_HALF_LIFE_MS` = 2000ms |
| Focus hysteresis | `INERTIA_FOCUS_HOLD_MS` = 720ms |
| History ring | `INERTIA_HISTORY_HORIZON_MS` = 3000ms |
| **Intent propagation** | `persisted_cause`, `persistence_ms`, shift record |

| Çıktı | Anlam |
|-------|--------|
| `smoothed_vector` | RESL orb bias girişi (dolaylı) |
| `smoothed_focus` | Strip copy tonu (primary debounced) |
| `motion_continuity01` | Aynı yönde kalma güveni |
| `trail` | `{ from, to, spanMs }` — spatial trace |
| **`propagation`** | **Aktif** — aşağıda |
| `projection` | RESL-only scalars |

### 3.1 Intent propagation (aktif inertia)

| Alan | Soru |
|------|------|
| `why_looking` | **Neden bakıyor?** (`code`, TR/EN label) |
| `why_changed` | **Bakış neden değişti?** (`from`, `to`, `cause`) — shift anında |
| `persisted_cause` | Taşınan niyet kodu |
| `persistence_ms` | Aynı committed primary süresi |
| `direction_persist01` | Yön sürekliliği (0–1) |
| `last_shift` | Son kayıtlı geçiş |

Örnek `PROPAGATION_CAUSE`: `voice_open`, `user_intent_explore`, `continuity_hold`, `fel_return`, `drift_shift`.

RCAL `signals` (intent, surface, router, silence) → propagation nedensellik — **execution değil**.

### 3.2 MCIB (Multi-Causal Intent Blending)

Linear propagation üstüne → [`RHIZOH_MCIB_V1.md`](RHIZOH_MCIB_V1.md).

`attention_inertia.mcib` — çoklu `causes[]`, `forks`, `internal_tension01`, `narrative_blended_*`.

---

## 4. RESL entegrasyonu (v1.1 plan)

| `projection` | RESL etkisi |
|--------------|-------------|
| `gazeBias01` | Orb intensity cap, nefes genlik |
| `driftDampen01` | `transitionFeel.durationMs` stretch |
| `transitionStretchMs` | FEL sonrası dönüş yavaşlatma |

Orb rotation **asla** `vx` ile birebir; yalnızca bias skalarları.

---

## 5. Test

`rhizohAttentionInertiaFieldV0.test.js` — EMA smoothing, focus hold, trail span.

---

## 6. Sonraki

- RPSE v0.2 optional `attention_motion` merge  
- RESL `resolveGazeProjectionV0(inertia.projection)`  
- Coherence: `coherenceId` + inertia `trail.spanMs` aynı epoch  
