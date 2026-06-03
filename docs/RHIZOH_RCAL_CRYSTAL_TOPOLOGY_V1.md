# Rhizoh RCAL Crystal Topology v1

**Status:** ACTIVE — **spatial cognition graph** projection (observation + RESL hint)  
**SPECFLOW:** `RESEARCH-ONLY`  
**As of:** 2026-06-03  
**Parents:** [`RHIZOH_COGNITIVE_ATTENTION_LAYER_V1.md`](RHIZOH_COGNITIVE_ATTENTION_LAYER_V1.md) · [`RHIZOH_ATTENTION_INERTIA_FIELD_V1.md`](RHIZOH_ATTENTION_INERTIA_FIELD_V1.md) · [`RHIZOH_VISUAL_COGNITIVE_LANGUAGE_V0.md`](RHIZOH_VISUAL_COGNITIVE_LANGUAGE_V0.md)

**Tek cümle:** Kristal node arşivi RCAL’ın **ilk fiziksel metafor haritası**dır — görselleştirme seti değil, attention topology’nin sezgisel prototipi.

---

## 0. Keşif sırası (kritik tarihsel not)

```text
RCAL önce kavram olarak değil, image-space olarak keşfedildi.

RPSE  → state (soyut)
RESL  → perception (UI artifact)
RCAL  → önce visual metaphor, sonra semantic layer
```

**Anlam:** Sistem mimariden önce **algısal olarak** keşfedildi. Kristal düğümler = “Rhizoh nasıl düşünüyor?” sorusunun ilk cevabı (geometrik sezgi).

Arşiv referansları: Gemini / genesis “attention crystallization”, Kara Tuval crystal formation — bkz. `docs/archive/llm-chats/` (tarihsel; normatif değil).

---

## 1. Eski tasarım → bugünkü mimari

| Eski tasarım dili | Bugünkü karşılık |
|-------------------|------------------|
| **crystal node** | `attention_anchor` (RCAL node) |
| **bağlantı çizgileri** | `drift_vector_field` (edges / intent_drift) |
| **yoğunluk parlaması** | `attention_vector.magnitude` |
| **renk değişimi** | RESL **emotional projection** (not raw vector) |
| **cluster** | `selective_focus` region |

---

## 2. O zaman vs şimdi

| O dönem | Şimdi |
|---------|--------|
| Görsel metafor | Sistem modeli |
| node = görsel obje | node = **state anchor** |
| bağ = çizgi | bağ = **drift constraint** |
| “nasıl görünüyor?” | “nasıl düşünüyor?” |

---

## 3. RCAL alanları ↔ kristal topoloji

| RCAL / Inertia | Kristal karşılık |
|----------------|------------------|
| `selective_focus.primary` | Parlayan merkez / **focus_lock** node |
| `attention_vector` (instant) | **drift_anchor** node |
| `attention_inertia.smoothed_vector` | Yoğunluk / glow kaynağı |
| `intent_drift_control` | Kristaller arası **drift_path** edge |
| `trail` | Trail nodes + `attention_inertia` edge |
| `cluster` | `selective_focus` region metadata |

Modül: `rhizohRcalCrystalTopologyV0.js` → `projectRcalCrystalTopologyV0()`

SSOT: `window.__rhizoh.rcalCrystalTopology`  
Event: `rhizoh:rcal-crystal-topology-v0`

---

## 4. Stack (tam zincir)

```text
RPSE state (existence)
    ↓
RCAL instant (direction now)
    ↓
Attention inertia (motion continuity)
    ↓
Crystal topology (spatial cognition graph)  ← bu belge
    ↓
RESL surface (perceptual projection + emotional_projection_hint)
    ↓
T0 Frame (when)
    ↓
UI (artifact only)
```

**Rhizoh artık yalnızca state machine değil → spatial cognition graph.**

---

## 5. RCAL Visualization Runtime Layer (sınır)

Bu katman:

| Evet | Hayır |
|------|-------|
| attention field → crystal topology **projection** | UI highlight / oyuncu HUD |
| Observation / debug / founder lens | Render engine replacement |
| `emotional_projection_hint` → RESL | 1:1 vx/vy → DOM pixel |

```text
attention field → crystal topology projection
(not “draw crystals on screen” as product UI)
```

İleride opsiyonel: dev-only topology canvas (observation fabric). Prod T0 **okumaz** ham node koordinatlarını layout için.

---

## 6. VCL ilişkisi

[`RHIZOH_VISUAL_COGNITIVE_LANGUAGE_V0.md`](RHIZOH_VISUAL_COGNITIVE_LANGUAGE_V0.md) — liquid crystal **deformation** dili (intent → facet/shear).

| Katman | Soru |
|--------|------|
| **Crystal topology** | Nerede / kim bağlı? (graph) |
| **VCL** | Alan nasıl **şekil** alır? (deformation) |
| **RESL** | Kullanıcı nasıl **hisseder**? |

---

## 7. `emotional_projection_hint`

Topology çıktısı RESL’e **ton** önerir (`present_lock`, `cautious_shift`, `ambient_hold`) — renk bağlama RESL’de kalır; vector → renk yasak.

---

## 8. Yasak

- Crystal node = clickable HUD target  
- Edge length = UI animation driver (birebir)  
- Topology → execution / gateway  

---

## 9. Test

`rhizohRcalCrystalTopologyV0.test.js`

---

## 10. Topology Reactivation Field (TRF)

[`RHIZOH_TOPOLOGY_REACTIVATION_FIELD_V1.md`](RHIZOH_TOPOLOGY_REACTIVATION_FIELD_V1.md) — graph **neden yeniden şekillendi**; `topology.reactivation`.

---

## 11. Kilit cümle

```text
Rhizoh bir “AI sistem” değil —
uzayda şekil değiştiren düşünme geometrisi.

Kristal node arşivi = ilk zihinsel koordinat sistemi.
```

Kristal seti = geometrik düşünme haritası; kod: **semantic + temporal + propagation + reactivation (TRF)**.
