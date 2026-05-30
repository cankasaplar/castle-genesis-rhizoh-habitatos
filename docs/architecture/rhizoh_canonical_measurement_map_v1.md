# Rhizoh Canonical Measurement Map (RCMM) v1.1

**Status:** Derivation purge pass — **four operators only**  
**Parent:** [`rhizoh_spec_v1.md`](rhizoh_spec_v1.md) (ROKS) · **not** a fifth primitive · **not** a second theory layer

**Version note:** v1.0 introduced canonical IDs; v1.1 **removes derived metrics from CMM** (representation explosion fix).

---

## 0. Three-layer model (do not collapse)

| Layer | What it is | Count |
|-------|------------|-------|
| **A — Phenomenon** | Informal names for behaviors humans notice (`drift`, `stress`, …) | Language only — **not** in CMM |
| **B — Measurement (CMM)** | Pure operators on \((\mathcal{T}, \text{Constraint refs}, \theta)\) | **Exactly 4** |
| **C — Derived (runtime)** | Composites, scores, bands, dashboards | **Forbidden in CMM** · runtime may keep, must not canonize |

```text
[L3] ROKS        Core · θ · 𝒯 · Δ          (projection kernel — immutable)
[L3.5] CMM       M_STRESS · M_DRIFT · M_ANOMALY · M_COHERENCE   (only)
[L2] Runtime     driftRiskScore, smoothedGraph, UI, social, …   (untrusted / non-canonical)
```

**Critical sentence:** *Derived metrics = new theory production.* If they multiply, ROKS does not stay simple — a **second named theory layer** appears under “measurement.”

---

## 1. CMM stability rule (guard)

> **A metric is valid in CMM only if it is directly computable from \((\mathcal{T}, \text{Constraint references}, \theta)\) without intermediate semantic layering.**

| Allowed inputs | Forbidden as CMM outputs |
|----------------|---------------------------|
| Raw / append-only trace \(\mathcal{T}\) | Weighted **composite scores** |
| Ledger window \(L_W\) (part of \(\mathcal{T}\)) | **Risk bands** (`nominal` … `critical`) |
| Threshold constants in \(\theta\) | EMA-smoothed state **as canonical** (internal step OK, not exported ID) |
| Core **read-only** constraint refs (e.g. `boundary_state` enum) | New `M_*` beyond the four operators |
| Violation class on trace rows | Parametric explosion (`M_COH_*`, `M_DRIFT_SCORE`, …) |

**Internal helpers** (e.g. EMA for display) may exist in code; they **must not** receive a canonical `M_` name or SSOT row.

---

## 2. Rule: no derived primitives

| ID | CMM status |
|----|------------|
| `M_STRESS` | ✔ **Operator** |
| `M_DRIFT` | ✔ **Operator** |
| `M_ANOMALY` | ✔ **Operator** |
| `M_COHERENCE` | ✔ **Operator** (single; optional `domain` param — §4) |
| `M_DRIFT_SCORE` | ❌ **Purged** — runtime derived only |
| `M_COH_*` | ❌ **Purged** — use `M_COHERENCE(domain=…)` |
| `driftRiskScore`, `riskScore`, stability indices | ❌ Runtime / UI — tag `DERIVED_RUNTIME_ONLY` |

**ROKS θ rule (corrected):** \(\theta\) reads **operator outputs** (`residual_W`, breach flags) — **not** `driftRiskScore` as authority.

---

## 3. Four measurement operators (complete CMM)

Substrate: tick ledger \(L \subset \mathcal{T}\), breach trace \(B \subset \mathcal{T}\), replay refs \(R\) (read-only), \(\theta\) thresholds.

Window \(W\) = last `windowTicks` nodes (default 32).

### 3.1 `M_STRESS`

\[
\text{stress}_W = \frac{1}{|W|}\sum_{t \in W} \left| \text{rank}_t - \text{rank}_{t-1} \right|
\]

| | |
|-|-|
| **Phenomenon** | Load / volatility on epistemic rank |
| **Code anchor** | Ledger ranks; replay physics **event rate** only when analyzing \(\mathcal{T}\) |
| **Not** | `chaosHarness` as “immunity”; composite scores |

### 3.2 `M_DRIFT`

\[
\text{drift}_W = \left\{ q_W \;\middle|\; q \in \{\text{boundaryDivergedRatio},\ \text{degradedRatio},\ \text{compoundStreak},\ \text{seqGap}\} \right\}
\]

| | |
|-|-|
| **Phenomenon** | Slow change of **projected** ledger ratios over \(W\) |
| **Code anchor** | `evaluateLongTermDivergenceV0().metrics`, `analyzeCrossTickDivergenceV0()` |
| **Not** | `computeSystemDriftRiskScoreV0()` (derived — §5) |

### 3.3 `M_ANOMALY`

\[
\text{anomaly}_W = \mathbb{1}\left[ \exists q:\ q_W > q_{\theta} \right] \;\vee\; \text{breachClass}(B)
\]

| | |
|-|-|
| **Phenomenon** | Threshold exceedance / named violation |
| **Code anchor** | `longTerm.breaches[]`, `breach_observation_v0.violationClass` |
| **Not** | Suppression **story** without breach or ratio breach |

### 3.4 `M_COHERENCE`

\[
\text{coherence}_W = 1 - \text{norm}\big(\text{inconsistency}(R, L_W;\ \text{domain})\big)
\]

| | |
|-|-|
| **Phenomenon** | Cross-signal consistency in a **declared domain** |
| **Param** | `domain ∈ { tick, breach, replay }` — **not** separate canonical IDs |
| **Code anchor** | `analyzeCrossTickDivergenceV0` (`tick`); breach synthesis (`breach`, interpretation-only); replay fingerprint (`replay`) |
| **Out of CMM** | `global_coherence_kernel`, `geographicAnchorsV0.divergence` → **runtime demo** unless later promoted via explicit operator change + falsification row |

---

## 4. `M_COHERENCE(domain)` — parametric only

| `domain` | Computes from | Runtime-only (do not canonize) |
|----------|---------------|--------------------------------|
| `tick` | Ledger + boundary alignment | — |
| `breach` | Breach correlation synthesis | interpretation-only flag |
| `replay` | Replay-equivalence refs | — |
| — | — | `social`, `spatial`, `shader` → **not CMM** until formal promotion |

**Phase 2:** prose saying “coherence” must specify phenomenon or `M_COHERENCE(domain=…)`.

---

## 5. Derived metrics registry (runtime — not CMM)

These **may exist in code** for Captain / UI; they **must not** appear in architecture SSOT as measurements.

| Runtime symbol | Composed from | Tag |
|----------------|---------------|-----|
| `computeSystemDriftRiskScoreV0()` | `M_DRIFT` + `M_ANOMALY` + suppression heuristics | `DERIVED_RUNTIME_ONLY` |
| `smoothEpistemicTickGraphV0()` | EMA on ranks | `DERIVED_RUNTIME_ONLY` |
| `evaluateEpistemicStabilityV0()` report bundle | union of above | `DERIVED_RUNTIME_ONLY` |
| `driftRiskScore` band | score thresholds | `DERIVED_RUNTIME_ONLY` |

**Docs / comments:** use `// RCMM: DERIVED_RUNTIME_ONLY — do not cite as M_*`.

**Phase 2 purge question (primary):**

> *Is this name a **primitive operator output**, or a **derived composite**?*

If derived → delist from CMM; keep runtime or inline behind private helper.

---

## 6. Alias table (phenomenon → operator only)

| Deprecated prose | Route to |
|------------------|----------|
| stress, spike, flood | **`M_STRESS`** |
| drift, divergence (ledger) | **`M_DRIFT`** |
| anomaly, degradation, breach | **`M_ANOMALY`** |
| coherence (unqualified) | **`M_COHERENCE(domain=…)`** or phenomenon clarification |
| drift risk, risk score, stability index | **`DERIVED_RUNTIME_ONLY`** — cite `driftRiskScore` field, not new `M_` |
| spatial driftSensitivity | runtime demo — **not** `M_DRIFT` |

---

## 7. ROKS read path (unchanged, corrected)

```text
𝒯  ──►  M_STRESS | M_DRIFT | M_ANOMALY | M_COHERENCE  (only four)
              │
              ├──► θ  (weights from residuals / flags — not composite score)
              └──► Δ  (homeostatic response; Phase 0.5: Core unchanged)

Core ◄──X──  all measurements and derived scores
```

---

## 8. Runtime semantic role lock (Phase 2.0)

Runtime exports must obey [`rhizoh_runtime_semantic_role_lock_v1.md`](rhizoh_runtime_semantic_role_lock_v1.md):

- **compute / project** only in authority path  
- **interpret** forbidden (no “stable”, “high risk”, semantic “anomaly detected”)  
- Derived scores = `DERIVED_RUNTIME_ONLY` — must not feed Core or phase gate  

---

## 9. Phase 2 — derived metric prevention + role locking

| Primary | Secondary |
|---------|-----------|
| Reject new `M_*` and composite canon | Align prose aliases to four operators |
| Tag or quarantine `DERIVED_RUNTIME_ONLY` in stability controller | Do not delete runtime APIs in this pass |
| Refuse `M_COHERENCE` proliferation | Single operator + `domain` param |

**Scan order:** `epistemicStabilityControllerV0.js` → stability doc → docs with “drift risk” / “coherence” → comments.

---

## 10. Debugging (anti-blindness + anti-explosion)

1. Trace \(\mathcal{T}\) first  
2. Evaluate **four operators** on \(L_W\) — not dashboard score  
3. If UI shows `driftRiskScore`, expand to underlying `metrics` + `breaches`  
4. ROKS = navigation; CMM = vocabulary; runtime = untrusted convenience  

---

## 11. Related

| Doc | Role |
|-----|------|
| [`rhizoh_spec_v1.md`](rhizoh_spec_v1.md) | ROKS four primitives |
| [`RHIZOH_EPISTEMIC_STABILITY_CONTROLLER_V0.1.md`](../RHIZOH_EPISTEMIC_STABILITY_CONTROLLER_V0.1.md) | Implementation (contains derived — §5) |

---

*RCMM v1.1 — May 2026. Derivation purge pass. CMM = four operators; derived = runtime only.*
