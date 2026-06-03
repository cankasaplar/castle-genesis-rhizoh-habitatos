# Rhizoh Cognitive Attention Layer (RCAL) v1

**Status:** ACTIVE — **cognitive** SSOT (normative sketch + stub)  
**SPECFLOW:** `RESEARCH-ONLY` — frozen v562–v570 dokunmaz; execution authority yok  
**As of:** 2026-06-03  
**Parents:** [`RHIZOH_T0_UNIFIED_PRESENCE_FRAME_V1.md`](RHIZOH_T0_UNIFIED_PRESENCE_FRAME_V1.md) · [`RHIZOH_PRESENCE_STATE_ENGINE_V1.0.md`](RHIZOH_PRESENCE_STATE_ENGINE_V1.0.md) · [`RHIZOH_CONTRACT_V1.0.md`](RHIZOH_CONTRACT_V1.0.md)

**Tek cümle:** Temporal presence sonrası kırılma — **nereye baktığı / neyi seçtiği** (attention direction), UI değil bilişsel katman.

---

## 0. Maturity breakpoint (dürüst)

| Var | Yok |
|-----|-----|
| Varlık (RPSE) | Dikkat **yönü** |
| Süreklilik (T0 Frame) | Seçici odak |
| Faz (RESL + clock) | Intent drift **kontrolü** |

```text
Tek varlık hissi var ama dikkat (attention) yönü yok.
```

Bu **presentation bug değil** — `rhizoh_attention` skaları (idle/listening/focused) **magnitude** verir, **vector** vermez.

---

## 1. Stack (kilitle)

```text
Observable signals (T0 intent, surface, voice, router, user activity)
        ↓
RCAL instant — WHERE / WHAT (now)
        ↓
Attention Inertia Field — HOW it moves (~2–3s)  → docs/RHIZOH_ATTENTION_INERTIA_FIELD_V1.md
        ↓
RPSE — WHAT EXISTS (enriched, optional attention_vector)
        ↓
RESL — HOW IT FEELS (gaze bias, orb direction, strip copy)
        ↓
T0 Frame — WHEN (global clock, unchanged)
        ↓
Surfaces (strip / orb / field)
```

| Katman | Soru | Asla |
|--------|------|------|
| **RCAL instant** | Rhizoh **neye** odaklı? (anlık) | UI layout, LLM cevabı, **HUD highlight** |
| **Inertia** | **Nasıl hareket ediyor?** (smoothed) | 1:1 vector → DOM |
| **RCAL** | Internal drift field (instant + inertia) | — |
| **RPSE** | Orada mı? Hangi silence_form? | Yön seçmez (v1 RPSE) |
| **RESL** | Nasıl görünür? | State yazmaz |
| **FEL** | Fail anlatımı | Odak temsilcisi değil |

**Kilit evrim:**

```text
Rhizoh = distributed presence field over time
         + selective attention vector over that field (RCAL)
```

---

## 2. RCAL çıktısı (normatif)

Modül: `rhizohCognitiveAttentionLayerV0.js`

| Alan | Tip | Anlam |
|------|-----|--------|
| `attention_vector` | `{ vx, vy, magnitude, directionLabel }` | 2D odak yönü (social field theory ile uyumlu) |
| `selective_focus` | `{ primary, secondary?, surfaceId, intentId }` | Seçili hedef |
| `intent_drift_control` | `{ drift01, damped, stickiness01, governor }` | Drift sınırı |
| `confidence01` | `number` | Sinyal birleşim güveni |
| `atMs` | `number` | RPSE tick ile hizalı |

Event: `rhizoh:cognitive-attention-v0`  
SSOT: `window.__rhizoh.cognitiveAttention`

---

## 3. Attention targets (v1)

| `primary` | Ne zaman |
|-----------|----------|
| `user` | Voice listening / partial attention |
| `dialogue` | Focused field / CHAT router |
| `world_mesh` | Explore intent / world surface |
| `continuity` | Active idle, weak anchor |
| `voice_channel` | LISTENING hold, STT path |
| `ambient` | Default diffuse |

`directionLabel` (vector): `dialogue_focus` · `room_scan` · `self_anchor` — bkz. `attentionVectorField.js`.

---

## 4. Intent drift control

**Kaynaklar (read-only):**

- T0 user intent (`explore` | `produce` | `observe` | `connect`)
- `temporalIntentDriftMemoryV1` (prompt biography — **no write-back**)
- Router intent (`routeRhizohInput` — event path only)

**Kurallar (v1 stub):**

| `drift01` | Anlam |
|-----------|--------|
| `< 0.25` | Stabil odak |
| `0.25–0.55` | Yumuşak geçiş |
| `> 0.55` | `damped: true` — RESL geçişleri uzatılır (v1.1) |

`governor`: `hold` | `allow_shift` | `dampen` — arbitration **yorumu**, execution değil.

---

## 5. RPSE entegrasyonu (v0.2 plan)

v1 stub **RPSE alanlarını değiştirmez** — yan yana yayınlar.

Planlanan RPSE genişlemesi:

```text
attention_vector?: { vx, vy, magnitude }
selective_focus?: { primary, surfaceId }
```

`rhizoh_attention` skaları kalır; vector **ek** kanal.

---

## 6. RESL entegrasyonu (v1.1 plan)

**Yalnızca** `attention_inertia.projection` + mevcut RESL descriptor — **asla** raw `vx/vy` → UI.

| `projection` | Presentation (dolaylı) |
|--------------|------------------------|
| `gazeBias01` | Orb nefes genlik / intensity cap |
| `driftDampen01` | Geçiş süresi uzatma |
| `transitionStretchMs` | FEL → idle dönüş |

**Yasak:** `attention vector = UI highlight` (oyuncu HUD riski). Bkz. [`RHIZOH_ATTENTION_INERTIA_FIELD_V1.md`](RHIZOH_ATTENTION_INERTIA_FIELD_V1.md).

---

## 7. Yürütme sınırı (frozen core)

- RCAL **asla** gateway dispatch, phase*.js, WAL veya execution graph tetiklemez.
- Observers influence interpretation, never execution — [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md).
- LLM prompt injection yalnızca mevcut `temporalIntentDriftMemoryV1` biography path — RCAL ayrı kanal.

---

## 8. Test

`rhizohCognitiveAttentionLayerV0.test.js` — intent → target, listening → user/voice, drift dampen.

---

## 9. Sonraki PR sırası

1. **RCAL v1 stub** (bu belge + modül) — ✔  
2. RPSE v0.2 `attention_vector` merge (optional field)  
3. RESL gaze bias + orb direction from vector  
4. Perceptual coherence: vector + T0 Frame same `coherenceId` epoch  

---

## 10. Crystal topology (image-space lineage)

Kristal node arşivi → [`RHIZOH_RCAL_CRYSTAL_TOPOLOGY_V1.md`](RHIZOH_RCAL_CRYSTAL_TOPOLOGY_V1.md).

```text
RCAL instant + inertia → projectRcalCrystalTopologyV0()
→ spatial cognition graph (not prod UI)
```

**Keşif sırası:** görsel metafor önce · semantic layer sonra.

---

## 11. İlgili mevcut kod

| Parça | Rol |
|-------|-----|
| `attentionVectorField.js` | 2D vector math (social / CSIL) |
| `rhizohRcalCrystalTopologyV0.js` | Graph projection |
| `rhizohAttentionInertiaFieldV0.js` | Motion continuity |
| `temporalIntentDriftMemoryV1.js` | Read-only drift biography |
| `t0ContextStripV0.js` | T0 intent anchors |
| `rhizohVisualCognitiveLanguageV0.js` | VCL deformation (complementary) |
| `routeRhizohInput.js` | Router intent (event path) |
