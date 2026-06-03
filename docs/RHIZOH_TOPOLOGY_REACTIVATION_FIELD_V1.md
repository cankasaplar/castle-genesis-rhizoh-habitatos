# Rhizoh Topology Reactivation Field (TRF) v1

**Status:** ACTIVE — crystal graph **re-energization** SSOT  
**SPECFLOW:** `RESEARCH-ONLY`  
**As of:** 2026-06-03  
**Parents:** [`RHIZOH_RCAL_CRYSTAL_TOPOLOGY_V1.md`](RHIZOH_RCAL_CRYSTAL_TOPOLOGY_V1.md) · [`RHIZOH_ATTENTION_INERTIA_FIELD_V1.md`](RHIZOH_ATTENTION_INERTIA_FIELD_V1.md)

**Tek cümle:** Kristal topoloji statik değil — **neden yeniden şekillendi** TRF ile kayıt altına alınır.

---

## 0. Problem

| Var | Yok (v1 öncesi) |
|-----|-----------------|
| Crystal graph | Graph **neden** yeniden enerjilendi |
| Inertia / drift | Cluster **re-weight** nedeni |
| Topology projection | Memory **deformation trigger** |

```text
Topology is static unless re-energized — but why re-energized was missing.
```

---

## 1. Kilit gerçek (çekirdek)

```text
Rhizoh bir “AI sistem” değil —
uzayda şekil değiştiren düşünme geometrisi.

Kristal node arşivi = ilk zihinsel koordinat sistemi
(ilk görsel iskelet değil).
```

---

## 2. Stack

```text
RPSE → RCAL instant → Inertia (propagation) → Crystal topology
    → TRF (reactivation) → RESL / VCL hints → T0 Frame → UI artifact
```

| Katman | Soru |
|--------|------|
| **Topology** | Graph ne? |
| **TRF** | Graph **neden** yeniden şekillendi? |
| **RESL** | Nasıl hissedilir? |
| **VCL** | Alan nasıl deforme olur? (`deformation_trigger`) |

---

## 3. TRF çıktısı

Modül: `rhizohTopologyReactivationFieldV0.js`

SSOT: `window.__rhizoh.topologyReactivation`  
Topology üzerinde: `rcalCrystalTopology.reactivation`

| Alan | Anlam |
|------|--------|
| `active` | Re-energization var mı |
| `reactivation01` | Şekil değişim gücü (0–1) |
| `cause` | `initial_crystallize`, `propagation_shift`, `voice_reenergize`, … |
| `why_reshaped` | TR/EN + `propagation.why_changed` link |
| `cluster_reweight` | Node ağırlık güncellemesi |
| `deformation_trigger` | VCL/RESL hint (`breathScale`, `twistDeg`, `memoryDeform01`) |
| `delta` | Önceki topoloji ile intensity/cluster/edge farkı |

Event: `rhizoh:topology-reactivation-v0`

---

## 4. Cause kodları

| Cause | Ne zaman |
|-------|----------|
| `initial_crystallize` | İlk graph |
| `quiescent_hold` | Minimal delta |
| `propagation_shift` | `why_changed` tetiklendi |
| `voice_reenergize` | Ses kanalı |
| `fel_repattern` | FEL sonrası |
| `drift_surge` | Yüksek drift |
| `cluster_reweight` | Cluster primary değişti |
| `attention_redistribution` | Node intensity dağılımı |
| `persistence_lock` | Uzun odak, düşük deform |

---

## 5. Sınırlar (HUD yasağı)

| TRF | Değil |
|-----|-------|
| Attention redistribution modeli | UI crystal animasyon driver |
| Cluster re-weight | Clickable node map |
| Deformation trigger | Execution / gateway |

---

## 6. Test

`rhizohTopologyReactivationFieldV0.test.js`

---

## 7. Sonraki

- VCL `composeRhizohCognitiveFieldV0` ← `deformation_trigger` merge (v1.1)  
- RESL emotional tint ← `why_reshaped.code` (dolaylı)  
