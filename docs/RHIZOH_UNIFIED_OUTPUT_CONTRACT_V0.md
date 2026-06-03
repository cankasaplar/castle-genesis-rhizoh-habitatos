# Rhizoh Unified Output Contract v0

**Status:** ACTIVE  
**SPECFLOW:** `RESEARCH-ONLY`  
**As of:** 2026-06-03  

**Tek cümle:** Rhizoh output = tek envelope; surfaces yalnızca projection.

---

## 1. Envelope

```json
{
  "schema": "castle.rhizoh.unified_output.v0",
  "artifact_id": "rar_…",
  "kind": "narrative_continuity | fel_narration | cognitive_lineage | structured_doc",
  "lineage": {
    "experiential_now_id": "…",
    "stream_coherence_id": "…",
    "mcib_cause_count": 0,
    "ccf_collapse_mode": "singular",
    "ecc_micro_kind": "hold"
  },
  "surfaces": ["t0_strip", "cesium"],
  "visibility": "user | internal",
  "payload": {}
}
```

Registry: [`RHIZOH_ARTIFACT_REGISTRY_V0.md`](RHIZOH_ARTIFACT_REGISTRY_V0.md)  
Binding: [`RHIZOH_SURFACE_BINDING_LAYER_V0.md`](RHIZOH_SURFACE_BINDING_LAYER_V0.md)  
Enforcement: [`RHIZOH_SURFACE_SINGULARITY_LAYER_V0.md`](RHIZOH_SURFACE_SINGULARITY_LAYER_V0.md)  
Citizenship: [`RHIZOH_SURFACE_CITIZENSHIP_RUNTIME_V0.md`](RHIZOH_SURFACE_CITIZENSHIP_RUNTIME_V0.md)  
Studio: [`RHIZOH_STUDIO_OUTPUT_FACTORY_V0.md`](RHIZOH_STUDIO_OUTPUT_FACTORY_V0.md)

---

## 2. Truth vs projection

| Katman | Rol |
|--------|-----|
| T0 `presenceFrame` / `t0UnifiedFrame` | Temporal **truth** |
| RSBL | Surface **projection** map |
| SSL | Surface **enforcement** (isolation forbidden) |
| SCR | Surface **citizenship** (reverse ownership substrate) |
| RAR | What was **produced** + export graph |
| Studio | **Packaging + execution loop** — lived output envelope |
| WAL | **Episode history** — replayable world state |
| MCIB/TRF | **Internal** — artifact `cognitive_lineage` only |

---

## 3. Yasak

- Surface kendi `now` üretmez
- MCIB cause list UI artifact değil
- RAR → execution geri beslemesi yok

---

## 4. SSOT

```javascript
window.__rhizoh.artifactRegistry
window.__rhizoh.studioOutputPack
window.__rhizoh.worldActionLog
window.__rhizoh.worldEpisode
window.__rhizoh.surfaceBindings
window.__rhizoh.surfaceSingularity
window.__rhizoh.surfaceCitizenship
window.__rhizoh.t0UnifiedFrame
window.__rhizoh.surfaceBindingAuthority  // { truth: "t0_presence_frame" }
window.__rhizoh.surfaceSingularityAuthority  // { now_source, isolation_forbidden }
window.__rhizoh.surfaceCitizenshipAuthority  // { reverse, projection_only }
```
