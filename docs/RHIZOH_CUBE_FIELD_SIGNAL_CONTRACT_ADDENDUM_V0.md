# Rhizoh Cube Field — Signal Contract Addendum v0

**SPECFLOW:** `RESEARCH-ONLY` — translation layer between **signal reservoirs** and **CubeState**; not a runtime, not semantic authority.

**Parent spec:** [`RHIZOH_CUBE_FIELD_V0.md`](RHIZOH_CUBE_FIELD_V0.md)

**Role:** Phase 3 **projection gate** — read-only ingestion, normalization, `CubeState` delta emission. **Not** rendering. **Not** meaning production.

**SSOT sentence:**

> **SpiralMMO is a signal source, never a semantic authority.**

**Architecture sentence:**

> Cube Field Phase 3 is **translation architecture**, not a visualization engine.

---

## 0. Three-layer stack (locked)

| Layer | Artifact | Responsibility |
|-------|----------|----------------|
| **1 — Meaning** | `RHIZOH_CUBE_FIELD_V0.md` | `CubeState` ontology, axis semantics, motion→meaning |
| **2 — Physics** | `cubeFieldSpiralMathV0.js` | Deterministic transform / projection |
| **3 — Perception** | Phase 4 prototype (future) | Spiral, cube, field rendering |

Phase 3 sits **between reservoir and physics**: reservoir → `CubeState` delta only.

---

## 1. Adapter invariant (LOCKED v0)

> **SpiralMMO is a signal source, never a semantic authority.**

| Adapter **may** | Adapter **must not** |
|-----------------|----------------------|
| Ingest numeric / phase signals from allowed reservoirs | Assign axis **meaning** from SpiralMMO lore, quests, or narrative labels |
| Clamp, denoise, and map fields to **CubeState slots** per §3 | Infer `confidence` from gameplay outcome or trust scores |
| Emit **delta** + audit envelope | Write WAL, sealer, gateway auth, or execution eligibility |
| Quarantine forbidden or schema-invalid ingress | Pass through `sharedState: true` or execution flags |

**Corollary:** If SpiralMMO becomes the meaning producer, Cube Field degrades to a **secondary aesthetic layer** — **meaning inversion**. This addendum exists to prevent that.

---

## 2. Signal sources (read-only reservoirs)

| Source kind | `sourceKind` (CubeState) | Transport | Import rule |
|-------------|--------------------------|-----------|-------------|
| SpiralMMO simulation compile (JSON envelope) | `spiral_reservoir_adapter` | Ops / manual fixture / future gateway **read** export | **No** `spiralMMOGameKernel` import in client experience path |
| HTML / legacy geometry telemetry | `spiral_reservoir_adapter` | Explicit fixture object only | **No** harici HTML bundle in client |
| Rhizoh field sample (regional) | `field_sample` | Existing bridge read path | Separate adapter function (future) |
| Test / dev | `synthetic_fixture` | Unit tests | Allowed |

All ingress sets `readOnly: true`.

---

## 3. SpiralMMO export fields (v0 allowlist)

Reservoir payloads MUST use schema `rhizoh.spiral_reservoir.signal.v0`.

### 3.1 Geometry channel (legacy / procedural HTML)

| Export field | Type | CubeState target | Notes |
|--------------|------|------------------|-------|
| `armExtent0` | `scalar01` | `intentVector.observation` | Direct passthrough after clamp |
| `armExtent1` | `scalar01` | `intentVector.reasoning` | Direct passthrough |
| `armExtent2` | `scalar01` | `intentVector.memory` | Direct passthrough |
| `armExtent3` | `scalar01` | `intentVector.action` | Direct passthrough |
| `spiralPhaseRad` | `phase` | `spiralPhaseRad` | Normalized to `[0, 2π)` |
| `armPhaseOffsetRad` | `phase[4]` | `armPhaseOffsetRad` | Length 4; pad missing with 0 |
| `rotationRate01` | `scalar01` | `cognitiveLoad` | Direct passthrough |
| `cubeScale01` | `scalar01` | `attention` | Direct passthrough |
| `opacity01` | `scalar01` | `uncertainty` | Direct passthrough (not inverted in adapter) |
| `confidence01` | `scalar01` | `confidence` | Direct passthrough |
| `drift01` | `scalar01` | `drift` | Measurement passthrough only |
| `contradictionPressure01` | `scalar01` | `contradictionPressure` | Direct passthrough |

### 3.2 Simulation channel (game kernel **export JSON**, not client import)

When ops passes a compiled simulation envelope as **opaque JSON** (no client import of gateway kernel):

| Export field | Type | CubeState target | Notes |
|--------------|------|------------------|-------|
| `meshCoherence01` | `scalar01` | *(none in v0)* | **Quarantine** — ambiguous vs confidence; use geometry channel instead |
| `rumorRisk01` | `scalar01` | *(none in v0)* | **Ignore** — narrative semantics; not a CubeState slot in v0 |
| `worldEventIntensity01` | `scalar01` | *(none in v0)* | **Ignore** — same reason |

**Rule:** Narrative / lore fields are **never** auto-mapped in v0. They may appear in audit `ignored[]` but MUST NOT populate `CubeState`.

### 3.3 Provenance (required on envelope)

| Field | Required |
|-------|----------|
| `schemaVersion` | yes — must equal `rhizoh.spiral_reservoir.signal.v0` |
| `reservoirId` | yes — opaque string |
| `correlationId` | recommended |
| `signals` | yes — object of allowlisted keys |

---

## 4. CubeState acceptance (v0)

Adapter output MUST conform to [`RHIZOH_CUBE_FIELD_V0.md`](RHIZOH_CUBE_FIELD_V0.md) §3.

| Rule | Behavior |
|------|----------|
| Partial delta | Allowed — only touched fields appear in `delta.fields` |
| Missing fields | Previous `CubeState` value retained (merge) or fixture default |
| `sourceKind` | Always `spiral_reservoir_adapter` for SpiralMMO ingress |
| `readOnly` | Always `true` |
| Semantic fields without signal | **Do not invent** — leave unset / carry forward |

---

## 5. Unknown & forbidden signal policy (LOCKED v0)

| Condition | Policy | Audit flag |
|-----------|--------|------------|
| Unknown key (not in §3 allowlist) | **Ignore** | `ignored[]` |
| Key matching `execution*`, `authority*`, `wal*`, `seal*`, `sharedState`, `feedsExecution` | **Quarantine field** | `quarantined[]` |
| Non-finite or non-numeric where number expected | **Drop field** | `dropped[]` |
| Wrong type (e.g. string for `scalar01`) | **Drop field** | `dropped[]` |
| `schemaVersion` mismatch | **Quarantine batch** | `batchQuarantined: true` — no `CubeState` merge |
| Narrative keys (`rumor*`, `quest*`, `lore*`, `headline*`) | **Ignore** | `ignored[]` |

**No silent reinterpretation:** adapter MUST NOT convert ignored narrative fields into axis intent.

---

## 6. Normalization (Phase 3 adapter scope)

| Step | Allowed | Forbidden |
|------|---------|-----------|
| Clamp to `[0, 1]` | yes | |
| Phase normalize to `[0, 2π)` | yes | |
| EMA denoise (optional, per-field) | yes — fixed α in adapter constant | Changing semantic slot assignment |
| Axis candidate extraction | yes — §3 table only | Cross-axis inference from narrative |
| Meaning assignment | | **never** |

Default denoise: single-step EMA with `α = 0.35` when `prevState` provided; otherwise passthrough.

---

## 7. Output envelope (adapter product)

```text
SpiralReservoirAdapterResult {
  schema: "rhizoh.cube_field.spiral_reservoir_adapter.v0"
  ok: boolean
  batchQuarantined: boolean
  cubeState: CubeState          // merged result
  delta: {
    fields: string[]            // dot-paths updated
    before: object              // subset before merge
    after: object               // subset after merge
  }
  audit: {
    reservoirId: string
    correlationId: string
    ignored: string[]
    quarantined: string[]
    dropped: string[]
    semanticAuthority: "rhizoh_cube_field_spec"   // never "spiral_mmo"
  }
  readOnly: true
  mayTriggerExecution: false
}
```

Downstream **math** (`projectCubeFieldV0`) consumes `cubeState` — adapter MUST NOT call math internally unless explicitly requested via `opts.project: true` (debug only).

---

## 8. Code anchor

| Artifact | Path |
|----------|------|
| Adapter | `apps/client/src/rhizoh/experience/spiralReservoirCubeStateAdapterV0.js` |
| Tests | `apps/client/src/rhizoh/experience/__tests__/spiralReservoirCubeStateAdapterV0.test.js` |

---

## 9. Phase gate

| Gate | Requirement |
|------|-------------|
| Parent spec v0.1 | locked |
| Phase 2 math tests | green |
| This addendum | locked before adapter merge |
| CI | `npm run spiral:validate-rhizoh-boundary` green |
| No HTML import | enforced |

---

## Changelog

| Version | Date | Summary |
|---------|------|---------|
| **v0** | 2026-06-01 | Signal allowlist, unknown policy, adapter invariant, translation-layer role |

---

*v0 — Signal Contract Addendum. Rendering is Phase 4; translation is Phase 3.*
