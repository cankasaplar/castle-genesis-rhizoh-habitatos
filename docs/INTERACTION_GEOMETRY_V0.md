# Interaction Geometry — V0 (semantic form layer)

**SPECFLOW:** `RESEARCH-ONLY` — **session-scoped interaction form** telemetry and projections. Not executable truth; does not replace code, CI, or the frozen subgraph ([`SPECFLOW_MARKERS.md`](../SPECFLOW_MARKERS.md)).

## Purpose

Measure **how the communication field behaves** (rhythm, hybrid language signals, recall density vs message complexity, system context flags) — not **who** is speaking and not **stable user traits**.

**System class (intended):** non-referential **epistemic telemetry** — not profiling, not behavioral psychology as product truth, not adaptive “user model” authority.

## Related boundaries

| Document | Role |
|----------|------|
| [`docs/OBSERVATION_FABRIC_V1.md`](OBSERVATION_FABRIC_V1.md) | Observers influence interpretation, **never** execution. |
| [`docs/RHIZOH_GOVERNANCE_MIDDLEWARE_V1.md`](RHIZOH_GOVERNANCE_MIDDLEWARE_V1.md) | Authority / witness / trace vocabulary; shadow evaluation discipline. |
| [`docs/COGNITIVE_LOAD_LAYER_V0.md`](COGNITIVE_LOAD_LAYER_V0.md) | **How much** observation is shown; attention budget. |
| [`docs/MEMBRANE_INTEGRITY_PASS_V0.md`](MEMBRANE_INTEGRITY_PASS_V0.md) | What must not cross into ambient UI as identity authority. |

---

## 1. Core invariant (versioned boundary)

**Observation cannot become authoritative identity substrate.**

| Allowed | Forbidden |
|---------|-----------|
| Observation → **product** presentation (tone, density, latency *feel*) | Observation → **identity graph** as authority or merge input |
| Observation → **debug / observability** (correlation, interference) | Observation → **trust score** or durable “user competence” |
| Observation → **research** exports (offline / batch, labeled non-authoritative) | Observation → **continuity writer** paths that treat geometry as evidence of personhood |

**Memory vs substrate (v0 wording):** Product/session **memory** (conversation state, UX continuity) may exist without violating this spec **only if** geometry output is never promoted into the **authoritative identity substrate** (the merge SSOT / sealed relational authority the core treats as canonical for *who we believe the relationship is*).

---

## 2. Unidirectional pipeline (data barrier)

```
Interaction Geometry (signals)
        ↓
   Projection layer (allowed descriptors + presentation rules)
        ↓
   UI / Debug / Research surfaces only
```

**Never:**

- Geometry → `readIdentityGraph` / `writeIdentityGraph` (or semantic equivalents)
- Geometry → frozen core mutation
- Geometry → continuity **mutation** driven by “learned profile”

**Semantic read isolation (v0 hardening):** Geometry modules **must not** read identity substrate to “contextualize” metrics — even read-only coupling starts **metric → person** mapping drift.

---

## 3. Forbidden graph paths (checklist)

Implementations claiming Interaction Geometry v0 compliance **must** preserve:

1. **No identity read** from geometry code paths (see invariant).
2. **No identity write** from geometry or projection layers.
3. **No continuity mutation** where geometry is input to authoritative merge (replay-equivalent truth, sealed outcomes, etc.).

Trust, merge, and gateway authority remain on **existing** controlled channels — not on geometry labels.

---

## 4. Leakage path model (language drift)

Primary failure mode: **metric → label → natural language → identity colloquialism** (e.g. “burstiness” read as “impulsive user”).

**v0 containment:**

| Stage | Rule |
|-------|------|
| Metric | Numeric / enum only; session-local; TTL or turn scope |
| Descriptor | **Allowed set** only (versioned list); no free-form LLM labels as SSOT |
| Presentation | Copy reviewed for **non-referential** phrasing (“session exhibits X”, not “you are X”) |
| Downstream | **No persistence** of descriptors as user properties; **no graph injection** |

---

## 5. Three projections (where outputs may appear)

| Surface | Output role |
|---------|-------------|
| **Product** | Ambient tone / pacing / density — “flows with the field,” not “understands the person.” |
| **Debug** | Causal / correlation views (e.g. overlay vs narrative shift vs TTS dropouts) — engineering diagnosis. |
| **Research** | Communication-form archetypes and instability studies — **non-authoritative** artifacts. |

---

## 6. Frozen Core alignment

- Geometry and projections stay **outside** the immutable execution graph unless an explicit v571+ / experimental program promotes **mechanisms** (not this doc alone).
- Replay architecture: geometry artifacts must be **droppable** or **non-participating** in replay-equivalence proofs for core outcomes unless separately specified.

---

## 7. CI guard (v0 — import boundary)

**Convention:** Implement Interaction Geometry under `apps/client/src/rhizoh/interactionGeometry/` (non-test `.js` / `.jsx`).

**Script:** [`scripts/validateInteractionGeometryBoundaryV0.mjs`](../scripts/validateInteractionGeometryBoundaryV0.mjs)

- Fails if any geometry module imports paths matching the **forbidden identity / recall-merge / frozen-phase** fragments (see script header).
- If the tree has **no** source files yet, the script **passes** (hook ready for first module).

**Commands:** `npm run stabilization:validate-interaction-geometry-boundary-v0` · also runs inside `npm run stabilization:validate-canonical-drift` (drift pack). **GitHub:** [`/.github/workflows/ci-enforcement.yml`](../.github/workflows/ci-enforcement.yml) runs the script on every PR/push.

**Not covered by this v0 guard:** session-level **state replay equivalence** (turn reconstruction, witness ordering proofs) — see constitutional replay tests for core slice; full epistemic replay remains a separate tranche.

---

## 8. Projection contract tests (v0 — semantic compliance)

**Module:** [`apps/client/src/rhizoh/interactionGeometry/projectionContractV0.js`](../apps/client/src/rhizoh/interactionGeometry/projectionContractV0.js)

| Concern | Mechanism |
|---------|-----------|
| Product / UI labels | `ALLOWED_PRODUCT_FORM_DESCRIPTORS_V0` + `isAllowedProductFormDescriptorV0` |
| Debug causal strings | `ALLOWED_DEBUG_CAUSAL_LABELS_V0` |
| Metric → descriptor | `mapBurstiness01ToProductDescriptorV0` / `mapLanguageMix01ToProductDescriptorV0` (return type ⊆ allowlist) |
| Copy leakage (identity / trait drift) | `projectionCopyLeakageFindingsV0` — high-precision phrase rules only |
| Research exports | `validateResearchAggregateRowV0` — allowlisted keys + numeric-only + histogram buckets ⊆ product descriptors |

**Tests**

- **Vitest:** [`apps/client/src/rhizoh/interactionGeometry/__tests__/projectionContractV0.test.js`](../apps/client/src/rhizoh/interactionGeometry/__tests__/projectionContractV0.test.js) — `npm run test -w apps/client -- src/rhizoh/interactionGeometry/__tests__/projectionContractV0.test.js` or `npm run test:interaction-geometry -w apps/client` (uses the main Vitest config; `@vitest-environment node` in the test file avoids jsdom). On **memory-tight Windows runners**, prefer the Node self-test below instead of relying on the Vitest worker graph.
- **Node self-test (no Vitest worker):** [`scripts/validateProjectionContractV0.mjs`](../scripts/validateProjectionContractV0.mjs) — `npm run stabilization:validate-projection-contract-v0` (or `node scripts/validateProjectionContractV0.mjs`)
- **Drift pack:** `validateCanonicalDriftGuards.mjs` runs the Node self-test after the Interaction Geometry boundary script.

---

## Changelog

| Version | Date | Summary |
|---------|------|---------|
| v0.2 | 2026-05-14 | §8: Projection contract v0 module + Vitest suite (allowlist, metric→descriptor, leakage scan, research aggregates) |
| v0.1 | 2026-05-14 | §7: CI import-boundary script + canonical drift hook + `ci-enforcement` workflow step; `rhizoh/interactionGeometry/` placeholder path |
| v0 | 2026-05-14 | Initial spec: invariant, unidirectional flow, forbidden paths, leakage model, three projections |
