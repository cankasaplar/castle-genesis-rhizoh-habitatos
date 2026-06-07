# Rhizoh Observer Field Node — Stage 2 Spec v0

**Status:** RESEARCH-ONLY  
**Layer:** Observation mesh framing — not a runtime primitive  
**Tag:** `RESEARCH-ONLY` per [`SPECFLOW_MARKERS.md`](../SPECFLOW_MARKERS.md)

**Core rule (inherits companion stack):** No agent is world center — only the **cognitive cube** (geometry truth layer). Observers are **attention nodes** over shared geometry, not controllers.

**Stabilization invariant:** `cube.topology is never agent-owned` — [`cubeTopologyOwnershipInvariantV0.js`](../apps/client/src/studio/cubeTopologyOwnershipInvariantV0.js). Observers interpret; they never mutate `targetTopology`.

**Multi-instance framing:** [`RHIZOH_DGCS_MULTI_INSTANCE_COGNITION_V0.md`](RHIZOH_DGCS_MULTI_INSTANCE_COGNITION_V0.md) — shared engine, private cognition, species registry (`octo_v1`, `fox_v1`).

---

## Wrong vs right

| Wrong mental model | Right mental model |
|--------------------|-------------------|
| Octo = camera center / scene protagonist | **Cube = truth anchor**; Octo = one observer node |
| Rhizoh = puppeteer of Octo | **Rhizoh = interpretation bridge** over observation inbox |
| Single observer = full world model | **Field of nodes** — partial, biased views that couple weakly |
| Observer personality = geometry deformation | **Personality = attention bias** over fixed geometry regimes |

---

## Three layers (Stage 1 → Stage 2)

| Layer | Role | Stage 1 (Lab) | Stage 2 (field) |
|-------|------|---------------|-----------------|
| **GEOMETRY** | Ground truth; thought = shape | `octoSpeakingCrystalV1` cognitive cube | Same cube — **one** truth surface per session cell |
| **OBSERVATION** | Spatial witness; deposits inbox | Octo journal + report (`octoObservationReportV0`) | **N observer nodes**, each with personality bias |
| **COMPANION** | Interpretation; no execution | `rhizohAttentionFieldV0` + inbox coupling | Rhizoh aggregates **field** deposits, not single Octo voice |

Stage 2 does **not** add a fourth execution layer. Observers still **may influence interpretation, never execution** ([`OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md)).

---

## Observer field node (concept)

An **observer field node** is a spatially embedded witness with:

| Field | Meaning |
|-------|---------|
| `nodeId` | Opaque stable id (not persona name in prod UI) |
| `anchor` | Local offset on observation manifold (relative to cube, not WGS84 center) |
| `personalityBias` | Attention weights over geometry regimes (`stretch`, `branching`, `spiral`, `spike`, …) |
| `depositBudget` | Max coupling per tick (Stage 1 Octo: 0.07 per inbox entry) |
| `ledgerKey` | Once-per-observation dedup (`observationInboxCoupledKeys` pattern) |

Nodes do **not** own the cube. They **read** topology snapshots and **emit** inbox entries when dwell + confidence thresholds pass.

---

## Personality as attention bias (not avatar lore)

Personality is a **vector over geometry attention**, not dialogue style alone:

| Bias profile | Stretch | Branching | Spiral | Spike | Notes |
|--------------|---------|-----------|--------|-------|-------|
| `curious_wide` | 0.25 | 0.25 | 0.25 | 0.25 | Default exploratory (Octo Lab baseline) |
| `memory_archivist` | 0.15 | 0.45 | 0.25 | 0.15 | Favors branching / recall geometry |
| `tension_sentinel` | 0.20 | 0.15 | 0.15 | 0.50 | Favors spike / rapid fold |
| `structure_weaver` | 0.35 | 0.20 | 0.35 | 0.10 | Favors stretch + spiral continuity |

Implementation sketch (future): `resolveObserverAttentionBiasV0(personalityBias, classifiedGeometry)` scales deposit confidence before inbox write. **Does not** change `engine.targetTopology`.

---

## Spatial embedding

Observers sit on a **local observation ring** around the cognitive cube:

```
                    [observer B]
                         |
    [observer A] ---- [CUBE] ---- [observer C]
                         |
                    [Rhizoh bridge]
```

- **Cube** at origin of the observation cell (not geographic origin of world mesh).
- **Octo** = default observer A in Lab (`/dev/octo-lab`).
- **Additional nodes** = same scene graph offsets; camera remains **cube-centric** ([`octoCubeCentricCameraV1.js`](../apps/client/src/studio/octoCubeCentricCameraV1.js)).
- World mesh ([`RHIZOH_WORLD_MESH_MENTAL_MODEL_V1.0.md`](RHIZOH_WORLD_MESH_MENTAL_MODEL_V1.0.md)): geographic nodes are **equal latent cells**; each cell may host one cube + observer field — Istanbul is bootstrap window only.

---

## Coupling contract (extends Sprint E)

From `rhizohObservationInboxCouplingV0`:

| Rule | Value |
|------|-------|
| `softInboxCoupling` | `true` in active regime |
| `passiveCoupling` | `false` when soft path active |
| Max deposit per entry | `0.07` |
| Dedup | `observationInboxCoupledKeys` ledger |
| Led-by | `octo` until multi-node registry exists |

Stage 2 extension: `ledBy` becomes `field` with per-node attribution in inbox entries (`source: observerId`), Rhizoh attention field merges with **max** or **weighted sum** capped per tick (TBD in implementation sprint — spec locks **cap**, not algorithm).

---

## Observability surface

Console SSOT (Lab / staging):

```javascript
window.__RHIZOH_COMPANION_OBSERVABILITY__
// attentionField, observationInbox, explorationIntegrity,
// softInboxCoupling, passiveCoupling, lastInboxCouplings, baselineRef
```

Stage 2 additions (spec only):

| Key | Purpose |
|-----|---------|
| `observerFieldNodes` | Registered node ids + biases |
| `lastNodeDeposits` | Per-node last coupling (fixes empty `lastInboxCouplings` on idle ticks) |
| `fieldLedBy` | `"field"` when >1 active observer |

Baseline archives:

- Pre-Sprint E: `docs/academic/companion-observation-baseline-v0-staging.json`
- Post-Sprint E: `docs/academic/companion-observation-baseline-v0-sprint-e-staging.json`

---

## Stage gates (no implementation in this doc)

| Gate | Criterion |
|------|-----------|
| **2a — Registry** | Node schema + bias table in code; single Octo unchanged |
| **2b — Second witness** | Passive second node deposits without camera recentring |
| **2c — Field ledBy** | `explorationIntegrity` stable with 2+ nodes; drift index < 0.15 |
| **2d — T0 wire** | Companion observability on T0 shell, not only `/dev/octo-lab` |

---

## Related

- [`RHIZOH_COMPANION_OBSERVATION_PRESENCE_V0.md`](RHIZOH_COMPANION_OBSERVATION_PRESENCE_V0.md)
- [`RHIZOH_WORLD_FIRST_LAYER_V0.md`](RHIZOH_WORLD_FIRST_LAYER_V0.md)
- [`RHIZOH_OBSERVATION_PROTOCOL_V0.2.md`](RHIZOH_OBSERVATION_PROTOCOL_V0.2.md)
- Sprint modules: `octoJournalV0`, `octoObservationReportV0`, `rhizohAttentionFieldV0`, `rhizohObservationInboxCouplingV0`
