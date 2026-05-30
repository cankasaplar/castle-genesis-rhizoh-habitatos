# Rhizoh Runtime Semantic Role Lock v1.0

**Status:** Phase 2.0 — **final lock** (post RCMM v1.1 derivation purge)  
**Parent:** [`rhizoh_spec_v1.md`](rhizoh_spec_v1.md) · [`rhizoh_canonical_measurement_map_v1.md`](rhizoh_canonical_measurement_map_v1.md)

**One sentence:** Runtime may **compute** and **project**; it must **never interpret**. Interpretation is not a runtime export — it is human or offline review over numbers.

---

## 0. Stack position (three layers + runtime split)

| Layer | Role | Ontology |
|-------|------|----------|
| **ROKS** | Physics / constraint projection | Immutable kernel |
| **CMM** | Four measurement operators | Stabilized (v1.1) |
| **Runtime** | Blind calculator + formatter | **Untrusted** — must not become secondary theory |

```text
ROKS  = physics
CMM   = measurement
Runtime = blind calculator (when this lock holds)
```

---

## 1. No interpretive runtime rule (mandatory)

> **Runtime may compute, but never interpret.**

| Runtime may emit | Runtime must not emit (as authority) |
|------------------|--------------------------------------|
| `numbers`, `deltas`, `residuals`, `distributions` | “system is stable / unstable” |
| `ratios`, `counts`, `seq` gaps | “risk is high / low” |
| `threshold_crossed: true` (predicate on θ) | “anomaly detected” **as semantic event** |
| `scoreBucket: 0..3` (ordinal index) | Causal story, narrative verdict, policy decision |
| Raw trace append | Core mutation, admission change, seal rewrite |

**Failure mode (post-compression bug):** *semantic rehydration* — CMM stays clean while runtime becomes a **hidden theory layer** that feeds decisions.

**Hard rule:** No runtime export may be wired to `δ`, admission, phase gate, or `ApplyDelta` without a separate **human-signed** ops path (READY/HOLD, manifesto gates).

---

## 2. Semantic role locking (every export)

Each runtime artifact field has exactly one role:

| Role | Permission | Meaning |
|------|------------|---------|
| **`compute`** | ✔ | Direct function of \((\mathcal{T}, \theta)\) or ledger window — no English verdict |
| **`project`** | ✔ | Lossless or labeled formatting of compute outputs (bucket index, chart axis, ISO timestamp) |
| **`interpret`** | ❌ **Forbidden** | Assigns meaning, stability, risk narrative, or “what happened” beyond predicates |

### 2.1 Examples

| Field | Role | Notes |
|-------|------|-------|
| `degradedRatio: 0.42` | `compute` | |
| `driftRiskScore: 67` | `compute` | `DERIVED_RUNTIME_ONLY` per RCMM §5 |
| `scoreBucket: 2` | `compute` | Ordinal bucket index — preferred over words |
| `band: "elevated"` | `project` | **UI label only** — not SSOT; map from `scoreBucket` |
| `thresholdBreached: true` | `compute` | Predicate, not story |
| `signalIdsNonEmpty: true` | `compute` | Predicate on `signalIds.length`; **do not** route to enforcement |
| `interpretationOnly: true` | meta | Declares non-authority — **not** a license to interpret in prose |
| `detail: "Token mismatch — bootstrap revoked."` | `interpret` | Allowed only in **breach trace** for humans — never feedback to Core |

### 2.2 Observation vs inference runtime

| Class | Allowed |
|-------|---------|
| **A — Observation runtime** | Computes, projects, appends trace |
| **B — Inference runtime** | ❌ Produces meaning, risk stories, “stability” claims — **banned as authority** |

Modules tagged `interpretationOnly: true` must stay in class **A** (predicates + numbers only).

---

## 3. Decision firewall (ROKS real lock)

```text
Runtime output ──X──► Core (δ, S, seals, admission)
                 │
                 └──► UI / Captain / logs (human reads numbers)
                 │
                 └──► Ops sign-off (explicit READY/HOLD only)
```

| Path | Status |
|------|--------|
| `driftRiskScore` → phase gate | ❌ |
| `band: "critical"` → auto throttle | ❌ without human policy |
| `breach_observation_v0` → enforcement module | ✔ **only** if enforcement module is separate and human-governed; observe module itself does not enforce |
| CMM operator residual → θ weight | ✔ (observation weight only) |

---

## 4. Mapping existing exports (audit seed)

| Module | Export | Role | RCMM / note |
|--------|--------|------|-------------|
| `epistemicStabilityControllerV0` | `longTerm.metrics.*` | `compute` | feeds `M_DRIFT`, `M_ANOMALY` |
| same | `driftRiskScore` | `compute` | `DERIVED_RUNTIME_ONLY` |
| same | `scoreBucket` | `compute` | preferred |
| same | `band` | `project` | label map only |
| same | `evaluateEpistemicStabilityV0()` bundle | `project` | aggregation container |
| `violationObservationLogV0` | append breach row | `compute` + trace | factual |
| Phase gate | `isDataPlaneActiveV0` | **constraint** | not runtime interpret |

**Phase 2 scan:** any new field without `semanticRole` in docblock → block in review.

---

## 5. Doc / comment contract

```javascript
/**
 * @runtimeSemanticRole compute
 * RCMM: DERIVED_RUNTIME_ONLY
 * Must not drive δ, admission, or phase gate.
 */
```

For UI-bound labels:

```javascript
/** @runtimeSemanticRole project — UI maps scoreBucket → band string */
```

**Forbidden in runtime docblocks that claim authority:** “stable”, “unsafe”, “high risk”, “anomaly detected” (use `threshold_crossed` + metric name).

---

## 6. Temporal narrativization (Phase 2.1)

Aggregation over time must not become story. See **[`rhizoh_final_epistemic_firewall_v1.md`](rhizoh_final_epistemic_firewall_v1.md)** — *No Temporal Narrativization Rule*.

| Allowed | Forbidden |
|---------|-----------|
| Δ values, distributions, windowed ratios | “trend rising”, “stabilizing”, “converging” |
| `scoreBucket`, `breaches[]` ids | `overallHealth`, `narrativeSummary` |

---

## 7. Phase 2.0 completion checklist

| Item | Status |
|------|--------|
| ROKS projection lock | Done |
| RCMM v1.1 four operators + no derived `M_*` | Done |
| Derivation purge | Done |
| **Runtime semantic role lock (this doc)** | Done |
| **Final epistemic firewall** | Done — [`rhizoh_final_epistemic_firewall_v1.md`](rhizoh_final_epistemic_firewall_v1.md) |
| `npm run formal:epistemic-firewall-grep` (audit) | Available |
| Lexical normalize (2.2) | Done — see firewall §8 |
| Strict CI + runtime→gate import audit | Pending (2.3) |

**Phase 2 is not “alias cleanup”.** It is **semantic role locking** + **derived metric prevention**.

---

## 7. Stability definition (engineering)

> **Real stability is not computing the right thing — it is being unable to interpret the wrong thing into authority.**

| Stable | Not yet stable |
|--------|----------------|
| CMM + ROKS vocabulary | Runtime still *can* rehydrate narrative if wired to gates |
| Measurement ontology | Every module obeys role lock in code review |
| Blind calculator discipline | Automatic “critical → degrade” without sign-off |

---

## 8. Related

| Doc | Role |
|-----|------|
| [`rhizoh_canonical_measurement_map_v1.md`](rhizoh_canonical_measurement_map_v1.md) | What to measure |
| [`RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md`](../RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md) | Human-signed open/ready |
| [`RHIZOH_REALITY_BREACH_OBSERVABILITY_V0.1.md`](../RHIZOH_REALITY_BREACH_OBSERVABILITY_V0.1.md) | Factual trace vs enforcement split |

---

*Runtime semantic role lock v1.0 — May 2026. Phase 2.0 edge state: semantic thermodynamics stabilization.*
