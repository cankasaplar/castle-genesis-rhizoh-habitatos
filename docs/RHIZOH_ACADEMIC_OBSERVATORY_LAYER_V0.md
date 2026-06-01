# Rhizoh — Academic Observatory Layer v0 (AOL)

**Status:** ACTIVE — research observation SSOT (not production UI)  
**SPECFLOW:** `RESEARCH-ONLY` — does not thaw frozen core or replace product surface  
**As of:** 2026-06-01  
**Parents:** [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md) · [`RHIZOH_SURFACE_LAYER_OPERATING_MODEL_V0.md`](RHIZOH_SURFACE_LAYER_OPERATING_MODEL_V0.md) · [`SPRINT_HABITAT_ACADEMIC.md`](SPRINT_HABITAT_ACADEMIC.md)

**One-line:** *The system should not only be used — it should be understandable while it runs.* AOL makes L1/L2 behavior **scientifically visible** without turning the product into a debug screen.

---

## 0. Two postures (choose explicitly)

| | ❌ Closed product model | ✅ Open research observatory (AOL) |
|--|-------------------------|-------------------------------------|
| User role | Consumer only | **Participant / researcher** |
| System role | Polished “product” | **Live laboratory** + calm product surface |
| Inside behavior | Hidden | **Exportable** (traces, graph deltas, resolver decisions) |
| Output | Controlled answer text | Answer + **data + trace + process** |
| Growth | Safe but academically closed | Safe **and** academically legible |

**Rhizoh without AOL:** a working intelligence system.  
**Rhizoh with AOL:** a **self-explaining** intelligence system — still bounded by core freeze.

---

## 1. Stack placement — do not collapse

**Canonical letters** match [`RHIZOH_SURFACE_LAYER_OPERATING_MODEL_V0.md`](RHIZOH_SURFACE_LAYER_OPERATING_MODEL_V0.md) (engine explicit):

| Letter | Layer | Question |
|--------|-------|----------|
| **A** | Core (L1/L2, freeze) | What is true? What exists? |
| **B** | Engine (recall, resolver, PAL) | How is truth computed for display? |
| **C** | Surface (chat, map, studio) | What can the user do and feel? |
| **D** | **Academic Observatory (AOL)** | What can we **publish / reproduce / defend**? |

Founder shorthand (product-only): *Core + Surface + Observatory* — engine sits between A and C; AOL is always **D**, not mixed into C UI.

```text
┌─────────────────────────────────────────────────────────────┐
│  D — Academic Observatory (AOL)                             │
│  trace export · experiment log · paper-oriented views       │
│  Audience: researchers, collaborators, SESSION_LOG          │
│  NEVER: default prod UI · admission · WAL writes            │
└────────────────────────────┬────────────────────────────────┘
                             │ read-only export
┌────────────────────────────▼────────────────────────────────┐
│  C — Surface (product experience)                           │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  B — Engine                                                 │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│  A — Core (L1 / L2) — freeze                                │
└─────────────────────────────────────────────────────────────┘
```

**Critical rule:** D reads A+B outputs; D **must not** be the default shell users land on.

---

## 2. What AOL is

**Academic Observatory Layer** = readability stratum **on top of** L1/L2 without breaking them.

| Pillar | Delivers | Paper-ready question |
|--------|----------|----------------------|
| **1. Observation export** | Turn streams, entity graph deltas, resolver decisions | “What happened, in order?” |
| **2. Trace → paper form** | Causal narrative: why node X, which context triggered Y | “Why did this node exist?” |
| **3. Reproducibility layer** | Same inputs → same graph behavior (deterministic paths) | “Can we run the experiment again?” |

**Analogues (external):** CERN open data · neuroscience datasets · arXiv culture · live model observability research.

**Rhizoh difference:** exports are **in-system live behavior**, not only post-hoc dumps outside the runtime.

---

## 3. What AOL is not (locked)

| AOL does **not** | Why |
|------------------|-----|
| Change the LLM model | Motor is transient — [`RHIZOH_HONEST_BASELINE_CHARTER_V1.md`](RHIZOH_HONEST_BASELINE_CHARTER_V1.md) |
| Optimize user behavior | No profiling product |
| Ship product features | B layer owns UX |
| Write execution core / WAL | Observation ≠ execution |
| Merge into ingress as default | Would become “debug mode product” |

---

## 4. Access model (product)

| Role | Scope |
|------|--------|
| **Signed-in user** | Own threads only — Firebase `Authorization` on `GET /rhizoh/academic/observatory/export` |
| **Research UI** | [`/academy/research`](../apps/client/src/surface/AcademicObservatoryPageV0.jsx) — not hidden behind ops |
| **Admin / ops** | `X-Castle-Academic-Observatory-Key` + `user_id` query — cross-user export |

UI is **not** an admin debug panel — it is the user-facing research surface for their own conversation history.

---

## 5. Production vs research observation (must stay separate)

| | Production (B) | Research (C) |
|--|----------------|--------------|
| **Default** | ON for cohort | OFF unless flag / role |
| **UI** | Calm, minimal | Tables, graphs, export buttons |
| **Data shown** | Projections + citations | Full trace + resolver + graph diff |
| **Audience** | Daily user | Founder, academic habitat, external reviewer |
| **Env** | E2-X creative flags | `CASTLE_ACADEMIC_OBSERVATORY=1` (future) |

**Failure mode if mixed:** user sees debug panels · system feels broken · trust drops.

**Mitigation:** separate route `GET /rhizoh/academic/observatory/export`, separate field `academicObservatory` ≠ `lifeEntityProjection`.

---

## 6. AOL v0 export envelope (conceptual)

Machine shape for v0.1 implementation — [`schemas/academic-observation-export-v0.schema.json`](schemas/academic-observation-export-v0.schema.json):

| Section | Source (today in repo) |
|---------|-------------------------|
| `life_continuity` | `lifeContinuityStoreV0` turns/notes |
| `entity_graph_snapshot` | `lifeEntityGraphV0` nodes/edges |
| `resolver_trace` | `lifeContinuityResolverV0` + `projectionActivationLayerV0` decisions |
| `recall_citations` | `lifeRecallEngineV0` (deterministic path A) |
| `gateway_turn` | `traceId`, spine phases, `lifeContinuity` / `lifeEntityProjection` response slices |
| `reproducibility` | contract versions + threshold env snapshot |

**No PII expansion** beyond cohort consent — align [`PHASE0_MEMORY_ERASURE_USER_FACING_V0.1.md`](legal/PHASE0_MEMORY_ERASURE_USER_FACING_V0.1.md).

---

## 7. Relationship to existing epistemic docs

| Existing | AOL relationship |
|----------|------------------|
| [`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md) | AOL is **product-facing export** of fabric principles |
| Epistemic tick / audit bundle (frozen spine) | **Parallel** — AOL does not replace; may cite in papers |
| [`RHIZOH_EPISTEMIC_REPRODUCIBILITY_LAYER_V0.1.md`](RHIZOH_EPISTEMIC_REPRODUCIBILITY_LAYER_V0.1.md) | AOL v0 **aligns** with reproducibility intent for L1/L2 path |
| [`docs/academic/SESSION_LOG.md`](academic/SESSION_LOG.md) | Human narrative sink for AOL exports |

AOL is **habitat-native**: [`SPRINT_HABITAT_ACADEMIC.md`](SPRINT_HABITAT_ACADEMIC.md) · [`HABITAT_COLLABORATION_ACADEMIC.md`](HABITAT_COLLABORATION_ACADEMIC.md).

---

## 8. Implementation sequence (after L1/L2/PAL stable)

| Order | Deliverable |
|-------|-------------|
| 1 | This SSOT ✔ |
| 2 | `academicObservationExportV0.js` + `academicObservatoryHttpV0.js` ✔ |
| 3 | `GET /rhizoh/academic/observatory/export` + UI [`AcademicObservatoryPageV0.jsx`](../apps/client/src/surface/AcademicObservatoryPageV0.jsx) at `/academy/research` |
| 4 | `traceToPaperBlockV0` — markdown sections from envelope (no auto-journal claims) |
| 5 | `npm run academic:export-paper` → `docs/exports/academic/` ✔ |

**Does not block:** E2-X creative cohort · L1 persist · legal addendum.

---

## 9. Success criteria

| Test | Pass |
|------|------|
| Researcher exports one session | JSON + markdown explain turn → castle node → map_pin threshold |
| Prod user on E2-X | Never sees observatory UI |
| Same replay inputs | Same resolver edges (deterministic AOL repro row) |
| Paper draft | Uses AOL export, not screenshots of debug console |

---

## 10. Binding sentence (founder)

> **Rhizoh is not closed to the world and not uncontrollably open — it is a live system with a calm surface and a legible observatory.**

Closed to **execution chaos**. Open to **understanding**.

---

## Related

| Doc | Role |
|-----|------|
| [`RHIZOH_L1_LIFE_CONTINUITY_V0.md`](RHIZOH_L1_LIFE_CONTINUITY_V0.md) | Temporal reality |
| [`RHIZOH_L2_ENTITY_CORE_V0.md`](RHIZOH_L2_ENTITY_CORE_V0.md) | Spatial + identity reality |
| [`RHIZOH_SURFACE_LAYER_OPERATING_MODEL_V0.md`](RHIZOH_SURFACE_LAYER_OPERATING_MODEL_V0.md) | Product surface |
| [`LAYER_EXPANSION_PROTOCOL.md`](LAYER_EXPANSION_PROTOCOL.md) | How C expands without core edits |

---

*Academic Observatory Layer v0 — understandable while running.*
