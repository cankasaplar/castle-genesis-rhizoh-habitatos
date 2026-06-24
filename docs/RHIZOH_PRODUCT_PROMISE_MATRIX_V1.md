# Rhizoh Product Promise Matrix v1

**SPECFLOW:** `RESEARCH-ONLY` — investor / founder SSOT; not execution authority.  
**Parent:** [`RHIZOH_HONEST_BASELINE_CHARTER_V1.md`](RHIZOH_HONEST_BASELINE_CHARTER_V1.md) · [`paper-v0.1.md`](academic/preprint/paper-v0.1.md)

---

## One-liner (external)

> Rhizoh turns fragmented digital activity into **continuous life memory**. Habitat is the long-horizon **behavior, learning, and identity climate** built on that memory.

## One-liner (honest today)

> Today: **observation + memory graph + academy seeds** under legal hold. Life OS executive scheduling and data-plane mutation ship after counsel READY.

---

## Matrix

| Surface | User promise (1 sentence) | Runtime today | API / env | User action | Phase gate |
|---------|---------------------------|---------------|-----------|-------------|------------|
| **Ingress** | Legal consent + identity on one screen | ✔ live | cohort allowlist, Firebase auth | checkboxes + Google | Legal freeze |
| **Voice (Rhizoh)** | Speak; get bounded reply | ✔ v3 + gateway STT | `VITE_GATEWAY_TOKEN`, gateway HTTP/WS | mic | Prod |
| **Chess / Learning** | Play, learn, lifetime report | ✔ ~88% (Stockfish, cluster, reports) | WASM local | pin → arena | Prod |
| **Habitat climate** | Behavior / learning climate labels | ◐ session_v0 pattern engine | `habitatClimate()` | ingest + compare | Observation only |
| **Go learning** | Academy Go + spacetime wire | ✔ pipeline parity (arena, batch, gate, tube, KataGo optional) | `wireGoLearningTube`, `goLearningReport` | pin / media tube | Observation only |
| **Checkers learning** | Academy checkers + spacetime wire | ✔ pipeline parity | `wireCheckersLearningTube`, `checkersLearningReport` | pin / media tube | Observation only |
| **Academy Learning Union** | Single observability across chess + go + checkers | ◐ session_v0 union digest | `academyLearningUnion()`, `wireAcademyLearningUnion()` | console | Observation only |
| **World Bridge** | Calendar / media / activity → life memory | ✔ 3 lanes, fusion, memory graph | `ingestCalendarEvent`, `ingestMediaEvent`, `ingestUserActivity` | console / future sync | Observation only |
| **Life Shadow** | Day A/B counterfactual | ✔ calendar + media branches | `lifeShadowDayBranches()` | ingest + compare | Observation only |
| **Life OS status** | Honest closure snapshot | ✔ runtime observability | `lifeOsStatus()` | console | Observation only |
| **WorldSports** | Live scores + map pins + media tube | ◐ feed + pin + tube wire | `API_SPORTS_KEY` (gateway), optional YouTube VOD | pin / voice / tube | Gateway |
| **World News** | Headline strip + feed | ◐ gateway feed | gateway world-feed | tube channel | Gateway |
| **Castle Genesis media** | YouTube live + short honest clips | ✔ embed + channels SSOT | `VITE_CASTLE_GENESIS_YOUTUBE_*` | media tube | Prod |
| **Gemini tower** | Vision + creative surface | ◐ chat/vision ✔, Imagen stub | `GEMINI_API_KEY` | pin → workspace | Gateway |
| **Claude tower** | Analysis + long context | ✔ workspace | `ANTHROPIC_API_KEY` | pin | Gateway |
| **ChatGPT tower** | General assistant | ✔ | `OPENAI_API_KEY` | pin | Gateway |
| **Sora tower** | Cinematic video | ✘ pin only | `OPENAI_API_KEY` (no Sora EP yet) | pin (preview) | Future |
| **Spatial / Cesium** | 3D world mesh | ✘ held | `VITE_CESIUM_WORLD_PROJECTION_BIND=1` | — | `legal_hold` prod |
| **Match / C2C** | Server-authoritative play | ✔ prototype + replay harness | gateway WS | match URL | Prod |
| **Data plane mutation** | Real WAL writes from user life | ✘ `admission=hold` | `VITE_RHIZOH_CLOSED_ADMISSION` | — | READY/HOLD |

**Legend:** ✔ shipped · ◐ partial · ✘ not yet

---

## Sequencing (do not reorder for product)

```
Legal counsel READY
    → Data plane open
    → Life OS scheduling
    → First paying cohort
    → Academy topology (learning map)
    → Castle Genesis (life simulation UI)
    → Habitat climate layers
    → Spiral MMO
```

---

## Console probes (prod)

```javascript
__rhizoh.lifeOsStatus()
__rhizoh.worldBridgeMemory()
__rhizoh.habitatClimate()
__rhizoh.executionPermission()
__rhizoh.academyLearningUnion()
await __rhizoh.wireAcademyLearningUnion({ demoMove: true })
__rhizoh.spatialRendererRegistry.gateCause
__rhizoh.worldLayerStatus.phase
await window.__rhizoh.mediaGateway.ensure()
```

---

## Related

- [`RHIZOH_LLM_TOWER_API_REGISTRY_V1.0.md`](RHIZOH_LLM_TOWER_API_REGISTRY_V1.0.md)
- [`CASTLE_GENESIS_MEDIA_PLAYER_CHANNELS_V0.md`](CASTLE_GENESIS_MEDIA_PLAYER_CHANNELS_V0.md)
- [`RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md`](RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md)
