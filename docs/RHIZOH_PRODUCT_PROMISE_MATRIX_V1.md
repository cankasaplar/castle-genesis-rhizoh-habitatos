# Rhizoh Product Promise Matrix v1

**SPECFLOW:** `RESEARCH-ONLY` — investor / founder SSOT; not execution authority.  
**Parent:** [`RHIZOH_HONEST_BASELINE_CHARTER_V1.md`](RHIZOH_HONEST_BASELINE_CHARTER_V1.md) · [`paper-v0.1.md`](academic/preprint/paper-v0.1.md) · [`RHIZOH_INVESTOR_APPENDIX_V1.md`](outreach/RHIZOH_INVESTOR_APPENDIX_V1.md)

---

## One-liner (external)

> Rhizoh turns fragmented digital activity into **continuous life memory**. Habitat is the long-horizon **behavior, learning, and identity climate** built on that memory.

## One-liner (honest today)

> Today: **World Bridge observation layer** + memory graph + session habitat climate under legal hold. Rhizoh is **not** an executive Life OS until counsel READY.

---

## Expectation management (read this first)

| Surface | User may assume | Reality today |
|---------|-----------------|---------------|
| **Life OS** | Autonomous daily-life operating system | **Observation layer** — ingest, fuse, describe; no executive scheduling |
| **Habitat** | 90-day behavior climate engine | **Session climate** — pattern labels from World Bridge lanes |
| **Academy** | Full learning coach product | **Learning topology** — chess ✔ · go ✔ · checkers ✔ (observation reports) |
| **Spatial world** | Live 3D mesh for all users | **Legal hold** — Cesium gated in prod |
| **Sora** | Video generation tower | **Placeholder** — pin only, no Sora EP |
| **WorldSports** | Complete sports life layer | **Partial** — gateway feed + map pin + media tube |
| **Data plane** | Real WAL writes from life | **Off** — `admission=hold`, `mutationPermitted: false` |

This table is the primary risk control: **expectation management**, not technical debt hiding.

---

## Life OS v0.1 closure

**Status:** `ACHIEVED` (observational scope only)

| In scope | Out of scope |
|----------|--------------|
| World Bridge Layer 2 | Autonomous scheduling |
| Memory graph | Executive decision engine |
| Habitat climate (session) | Life automation |
| Shadow governance | 9-lane Habitat |
| Interpretation-only boundary | Full spatial activation |

See [`RHIZOH_LIFE_OS_V0_1_CLOSURE_NOTE.md`](RHIZOH_LIFE_OS_V0_1_CLOSURE_NOTE.md).

---

## Matrix

| Surface | User promise (1 sentence) | Runtime today | API / env | User action | Phase gate |
|---------|---------------------------|---------------|-----------|-------------|------------|
| **Ingress** | Legal consent + identity on one screen | ✔ live | cohort allowlist, Firebase auth | checkboxes + Google | Legal freeze |
| **Voice (Rhizoh)** | Speak; get bounded reply | ✔ v3 + gateway STT | `VITE_GATEWAY_TOKEN`, gateway HTTP/WS | mic | Prod |
| **Chess / Learning** | Play, learn, lifetime report | ✔ ~88% (Stockfish, cluster, reports) | WASM local | pin → arena | Prod |
| **Go learning** | Academy Go + spacetime wire | ✔ pipeline parity (arena, batch, gate, tube, KataGo optional) | `wireGoLearningTube`, `goLearningReport` | pin / media tube | Observation only |
| **Checkers learning** | Academy checkers + spacetime wire | ✔ pipeline parity | `wireCheckersLearningTube`, `checkersLearningReport` | pin / media tube | Observation only |
| **Academy Learning Union** | Single observability across chess + go + checkers | ◐ session_v0 union digest | `academyLearningUnion()`, `wireAcademyLearningUnion()` | console | Observation only |
| **World Bridge** | Calendar / media / activity → life memory | ✔ 3 lanes, fusion, memory graph | `ingestCalendarEvent`, `ingestMediaEvent`, `ingestUserActivity` | console / future sync | Observation only |
| **Life Shadow** | Day A/B counterfactual | ✔ calendar + media branches | `lifeShadowDayBranches()` | ingest + compare | Observation only |
| **Habitat climate** | Behavior / learning climate labels | ◐ session_v0 pattern engine | `habitatClimate()` | ingest + compare | Observation only |
| **Life OS status** | Honest closure snapshot | ✔ runtime observability | `lifeOsStatus()` | console | Observation only |
| **Studio Life Memory** | Visible World Bridge + habitat + learning cameras | ✔ Studio drawer + academy observe | `studioVisibility()` · Studio shell | shell bar | Observation only |
| **Studio Dashboard** | 8 cameras on one screen — Memory · Habitat · Chess · Go · Checkers · Academy · WorldSports · Spatial | ✔ 2×4 grid + adapter previews | `studioVisibility()` · `studioAdapters()` | Studio drawer | Observation only |
| **Studio demo seed** | One-click investor memory demo | ✔ panel + console | `studioDemoSeed()` | Studio panel | Observation only |
| **Chess Observation #001** | 60s YouTube short capture manifest | ✔ console + dashboard brief | `chessObservationShort001()` | Studio dashboard | Observation only |
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
    → Life OS scheduling (executive — not v0.1)
    → First paying cohort
    → Academy topology (learning map)
    → Castle Genesis (life simulation UI)
    → Habitat climate layers (90-day)
    → Spiral MMO
```

---

## Console probes (prod)

```javascript
__rhizoh.studioVisibility()
__rhizoh.studioAdapters()
__rhizoh.chessObservationShort001()
await __rhizoh.copyChessObservationBrief()
__rhizoh.studioDemoSeed()
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
- [`RHIZOH_INVESTOR_APPENDIX_V1.md`](outreach/RHIZOH_INVESTOR_APPENDIX_V1.md)
