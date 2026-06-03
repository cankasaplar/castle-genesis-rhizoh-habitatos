# Rhizoh Artifact Registry (RAR) v0

**Status:** ACTIVE  
**SPECFLOW:** `RESEARCH-ONLY`  
**Modül:** `rhizohArtifactRegistryV0.js`

---

## Problem

Metin ve state var; **“Rhizoh ne üretti?”** için tek yer yok.

---

## Çözüm

| Özellik | Açıklama |
|---------|----------|
| `registerRhizohArtifactV0` | Tek artifact kaydı |
| `lineage` | MCIB/CCF/ECC kimlikleri |
| `surfaces[]` | Nereye gitti (`t0_strip`, `cesium`, …) |
| `export_graph` | parent/child artifact zinciri |
| `visibility` | `user` \| `internal` |

**Otomatik:** `registerRhizohArtifactFromContinuityStackV0` — ECC publish sonrası.

---

## SSOT

```javascript
window.__rhizoh.artifactRegistry
// { count, artifacts[], export_graph[] }
```

Event: `rhizoh:artifact-registry-v0`

---

## Kilit

```text
İçeride tek Rhizoh düşünüyor → RAR “ne üretti” der.
```
