# Final Epistemic Firewall v1.0

**Status:** Phase 2.1 — **governance cap** on runtime narration  
**Parents:** [`rhizoh_runtime_semantic_role_lock_v1.md`](rhizoh_runtime_semantic_role_lock_v1.md) · [`rhizoh_canonical_measurement_map_v1.md`](rhizoh_canonical_measurement_map_v1.md) · [`rhizoh_spec_v1.md`](rhizoh_spec_v1.md)

**One sentence:** Interpretation is not removed — it is **displaced into time** unless blocked; this firewall forbids **computation → narration** via aggregation.

---

## 0. What is closed vs what remains

| Closed (hard to regress) | Living risk |
|--------------------------|-------------|
| Ontology aliasing | **Semantic authority leakage via aggregation** |
| Measurement explosion | Silent story from stacked deltas |
| Derived metric proliferation in CMM | `pattern` → meaning |
| Interpretive CMM drift | Sophisticated pseudo-interpretation |

**Collapse path (watch always):**

```text
interpret forbidden ✔  →  "no interpret, only patterns" ✔  →  pattern = meaning ❌
```

---

## 1. Four-layer stack (final form)

| Layer | Role | Narration |
|-------|------|-----------|
| **ROKS** | Physics / constraints | None |
| **CMM** | Four measurement operators | None |
| **Runtime** | Blind calculator | **No interpret** (role lock) |
| **Time** | Ordered samples of compute outputs | **No narrativization** (this doc) |

```text
ROKS     = physics
CMM      = measurement
Runtime  = compute + project
Time     = data stream (Δ, distributions) — not story
```

---

## 2. No temporal narrativization rule (mandatory)

> **Runtime may accumulate numbers over time; it must not accumulate meaning.**

### 2.1 Allowed — temporal projection (A)

| Export shape | Example | Role |
|--------------|---------|------|
| Windowed scalar | `degradedRatio` over `W` | `compute` |
| Delta series | `rank_t - rank_{t-1}` | `compute` |
| Snapshot at `t` | `metrics` object at tick | `compute` |
| Distribution | histogram bins, counts | `compute` |
| Predicate list | `breaches: ["degraded_ratio"]` | `compute` |
| Ordinal bucket | `scoreBucket: 2` | `compute` |

**Time is a index**, not a narrator.

### 2.2 Forbidden — semantic accumulation (B)

| Forbidden (authority or SSOT) | Replace with |
|-------------------------------|--------------|
| “trend is rising / falling” | `delta: +0.12`, `slope_W` |
| “system is stabilizing” | `quarantineRatio: 0.08` |
| “risk increasing” | `driftRiskScore: 67`, `scoreBucket: 2` |
| “behavior is converging” | `boundaryDivergedRatio` series |
| “pattern detected” **as verdict** | `predicate_id` + numeric evidence |
| `suppressionDetected` **as story** | `signal_ids: []` length + list |

**Rule:** If a human can paraphrase the field as a **story sentence**, it must not be a runtime export name or UI authority label.

---

## 3. Computation → narration transform (blocked)

| Stage | Status |
|-------|--------|
| Single-tick interpret | ❌ blocked (role lock) |
| Multi-tick interpret | ❌ blocked (this doc) |
| Multi-tick **numbers** | ✔ allowed |
| Multi-tick **named story** | ❌ forbidden |

**Insight:** The hardest bug is *interpretation displaced into time* — charts that “feel like” stability without saying it.

---

## 4. Narration detection (enforcement spec)

### 4.1 Field / API name denylist (runtime authority paths)

Case-insensitive **substring** match on **exported** symbols and JSON keys in `apps/client/src/rhizoh/runtime/**` (exclude `__tests__`, `__research__`):

```
trend, converg, stabiliz, improving, worsening, declining, rising,
narrative, story, verdict, healthy, unhealthy, safe, unsafe,
recovering, deteriorating, calming, heating, cooling (semantic)
```

**Exceptions (rename in Phase 2.2, allowed until then with tag):**

| Legacy | RCMM / firewall tag |
|--------|---------------------|
| ~~`detectA9A11TrendSuppressionV0`~~ | → `detectA9A11SignalSuppressionV0` (Phase 2.2) |
| ~~`gapRisingTicks`~~ | → `gapSeqIncreaseCount` |
| `replayFeedbackAnalysis` `patterns` | **OFFLINE_REVIEW_ONLY** — never gate or Core |

### 4.2 String literal denylist (runtime exports)

Forbidden in `detail`, `message`, `summary`, `verdict` fields **when auto-generated** (human breach log prose in trace append is OK for Captain):

```
/system is/i, /risk is (high|low)/i, /trend/i, /converg/i, /stabiliz/i,
/improving/i, /getting (better|worse)/i, /anomaly detected/i
```

### 4.3 Shape rules

| Allowed export | Forbidden export |
|----------------|------------------|
| `{ metric: number }` | `{ narrative: string }` |
| `{ breaches: string[] }` where strings are **threshold ids** | `{ story: string }` |
| `{ scoreBucket: 0..3 }` | `{ stability: "improving" }` |
| Time series of numbers | Time series of **verdict enums** without numeric backing |

### 4.4 Aggregation firewall

Bundled reports (`evaluateEpistemicStabilityV0`, audit bundles) must:

1. Declare `semanticRole: "aggregate_compute"` on container  
2. Contain **only** nested compute/project fields  
3. **No** top-level `summary`, `verdict`, `overallHealth` string  
4. **No** auto-throttle side effects  

---

## 5. Module classes

| Class | Examples | Authority |
|-------|----------|-----------|
| **Runtime compute** | `epistemicStabilityControllerV0`, ledger metrics | Numbers only → UI |
| **Trace append** | `breach_observation_v0` | Factual + human-readable `detail` OK; no Core feedback |
| **Offline review** | `replayFeedbackAnalysis`, pattern detectors | **OFFLINE_REVIEW_ONLY** — never phase gate |
| **Research** | `__research__/*`, SPECFLOW RESEARCH-ONLY docs | Non-authoritative |

---

## 6. CI / ops enforcement (Phase 2.1)

**Script:** `npm run formal:epistemic-firewall-grep`

Runs pattern scan; **warn** on legacy names, **fail** on new violations in non-exempt paths.

| Result | Action |
|--------|--------|
| New denylist match in runtime export | Fix or add time-boxed exemption in script header |
| `OFFLINE_REVIEW_ONLY` module imported by gate/admission | **Fail** |
| Runtime import of stability → `phase1ActivationGate` | **Fail** (manual audit) |

Exempt paths: `docs/**`, `__tests__/**`, `__research__/**`, outreach packs.

---

## 7. Human interpretation (where meaning lives)

| Meaning | Where |
|---------|--------|
| Numbers | Runtime compute |
| Charts | UI (project) |
| Story | Human operator, legal, Eda briefing |
| Policy | READY/HOLD sign-off, ops checklist |
| Proof | TLA / harness (separate track) |

**Time does not interpret.** Humans interpret **after** reading traces and metric tables.

---

## 8. Legacy rename constraint (Phase 2.2)

> **Renaming must reduce semantic load, not improve clarity.**

| Rule | |
|------|---|
| Explainability | Must **not** increase |
| Semantic richness | Must **decrease** |
| Allowed | Operational neutrality only (`signalIds`, `gapSeqIncreaseCount`) |
| Forbidden | “Clearer” story names (`trend`, `suppression`, `healthy`, `riskTrend`) |

**Applied (v1.1 lexical pass):**

| Legacy | Neutral |
|--------|---------|
| `detectA9A11TrendSuppressionV0` | `detectA9A11SignalSuppressionV0` |
| `trendSuppression` (report key) | `a9A11SignalCheck` |
| `suppressionDetected` | `signalIdsNonEmpty` |
| `gapRisingTicks` | `gapSeqIncreaseCount` |
| `signals` (export field) | `signalIds` |

Behavior unchanged; schema string `castle.rhizoh.a9_a11_signal_suppression.v0`.

---

## 9. Phase checklist

| Phase | Item | Status |
|-------|------|--------|
| 2.0 | Semantic role lock | Done |
| **2.1** | Final epistemic firewall (this doc) | Done |
| **2.2** | Lexical surface normalization + legacy rename constraint | Done |
| 2.3 | Authority graph audit | Done — [`rhizoh_authority_graph_audit_v1.md`](rhizoh_authority_graph_audit_v1.md) |

---

## 9. Architectural maturity (honest)

| Claim | True? |
|-------|-------|
| Governed epistemic system | ✔ role-constrained |
| Closed epistemic system | **Partial** — until aggregation narration is grep-enforced |
| Machine-verified | ✘ separate track |

> **Maturity:** locking the reflex to produce meaning — not simplifying ideas.

---

## 10. Related

| Doc | Role |
|-----|------|
| [`rhizoh_runtime_semantic_role_lock_v1.md`](rhizoh_runtime_semantic_role_lock_v1.md) | compute / project / interpret |
| [`RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md`](../RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md) | human-signed open |

---

*Final Epistemic Firewall v1.0 — May 2026.*
