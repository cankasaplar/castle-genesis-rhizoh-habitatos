# Rhizoh Cognitive Visualization Binding v1

**SPECFLOW:** `RESEARCH-ONLY` · `FUTURE-PROOF-ONLY` — **Cognitive Transparency Interface**; not execution.

**Prerequisites:** [`RHIZOH_EPISTEMIC_VISUALIZATION_LAYER_V1.md`](RHIZOH_EPISTEMIC_VISUALIZATION_LAYER_V1.md) · [`RHIZOH_DRIFT_ANOMALY_DETECTOR_V1.md`](RHIZOH_DRIFT_ANOMALY_DETECTOR_V1.md) · [`RHIZOH_SECURITY_BOUNDARY_V1.md`](RHIZOH_SECURITY_BOUNDARY_V1.md) (DR-01, DR-02)

**Code:** `apps/client/src/rhizoh/ticket/cognitiveVisualizationBindingV0.js`

---

## 0. Constitutional sentences (locked)

> **Drift is a perception stream, not a control channel.**

> **Admission is the only control channel in Rhizoh.**

> **No suggestion can contain actionable authority.** (DR-02 completion)

| Concept | Role | Time |
|---------|------|------|
| **Drift** | Commentary (yorum) | Now (perception) |
| **Admission** | Reality (gerçeklik) | Now (authority) |
| **TraceGraph** | Past (geçmiş) | Immutable history |
| **CubeState** | Present (şimdi) | Truth snapshot |
| **REC** | Temporal accounting (zamanın muhasebesi) | Epoch batch |

Rhizoh at this layer is an **Epistemic Operating System (EOS)** — not game engine, not AI system, not ticket system alone.

---

## 1. Cognitive Transparency Interface

The UI is not a control surface. It is **Cognitive Transparency Interface** — the user sees not only outcomes but **why the system thought what it thought**.

Three panels (must remain separated):

### 1.1 Suggest-only — Drift Space

| Source | Display |
|--------|---------|
| SC / REC / QUOTA density | Category spatial field |
| Feature vectors | Semantic embedding readout |
| AlertPacket stream | Epistemic feature artifacts |

**Behavior:** system *speaks* but does not *decide*.

DR-02 artifacts are **epistemic feature artifacts**, not policy signals:

| Correct | Wrong |
|---------|-------|
| `sc_frequency_increased` | `user X should be blocked` |
| `quota_stress_detected` | `cube rank should decrease` |
| `deltaHint.shareDelta01` | `proposedMutation` |

### 1.2 Admission Approval — Authority Gate

| Source | Display |
|--------|---------|
| CubeState delta proposals | Approval queue |
| Ticket transitions | `executionClass: mutate_l1` / `mutate_l2` |

**Behavior:** reality is *created* here — human + admission gate only.

### 1.3 REC Cycle — Temporal Anatomy

| Source | Display |
|--------|---------|
| Tombstone queue | Pending soft compression |
| Causal residue | Compressed memory |
| Epoch reconciliation | 06:44 / 18:44 waveform |

**Behavior:** time is *written* here — batch authority only.

---

## 2. Alert flow — hybrid model (canonical)

| Mode | Channel | Content | Risk |
|------|---------|---------|------|
| **PUSH** | Drift / AlertPacket | `suggest` only | Event storm on SC spike — rate-limit |
| **PULL** | Admission context | CubeState proposals, pending commits | Slower but audit-safe |

**Rule:** system *shouts* (drift PUSH) but does not *speak authority* (no mutation on PUSH).

```text
PUSH  → driftAnalyticsEngineV0 / detectDriftAnomaliesV0 → AlertPacket → nervous Signal bucket
PULL  → admissionCubeCommitV0 / proposedCubeDelta → Authority panel fetch
```

Forbidden: PUSH path carrying `mutate_l1` / `mutate_l2` or DR-02 violations.

---

## 3. Visual binding map

### 3.1 Category → color / geometry (density field)

| Category | Hue (HSL) | Geometry | Field meaning |
|----------|-----------|----------|---------------|
| **SC** | 0° (red-amber) | Angular spikes | Permission boundary stress |
| **QUOTA** | 210° (blue) | Vertical bars | Resource topology pressure |
| **REC** | 280° (violet) | Waveform bands | Temporal continuity |
| **SIG** | 45° (gold) | Halo rings | Trust / binding drift |
| **INTENT** | 120° (green) | Directed edges | Intent binding drift |
| **ADMIT** | 180° (teal) | Gate brackets | Admission gate stress |

Intensity `α = clamp01(share01 × severityWeight)` — observation only.

### 3.2 AlertPacket → UI event semantics

| AlertPacket field | UI event | `executionClass` |
|-------------------|----------|------------------|
| `type: DRIFT_ANOMALY` | `epistemic:drift-anomaly` | `suggest` |
| `category` | density field layer id | read-only |
| `deltaHint` | geometry scale input | read-only |
| `confidence` | opacity / pulse rate | read-only |
| `suggestion` | label text (DR-02) | read-only |

UI MUST NOT map `suggestion` to block/mute/kick actions without admission panel.

### 3.3 REC cycle → time-layer rendering

| REC anchor | Visual |
|------------|--------|
| `06:44` core morning | Waveform peak A |
| `18:44` core evening | Waveform peak B |
| `rec_soft` | Baseline trough |
| `rec_burst` | Transient ripple |

Tombstone queue depth → waveform envelope thickness (pending compression count).

---

## 4. Module contract

```text
runTicketMemoryPipelineV0(...)
  → cognitiveVisualizationBindingV0.pushPerceptionStreamV0({ analytics, anomalies })
  → cognitiveVisualizationBindingV0.pullAuthorityContextV0({ reconcile, commit })
  → cognitiveVisualizationBindingV0.buildDensityFieldV0({ indexSnapshot, drift })
  → cognitiveVisualizationBindingV0.buildRecTimeLayerV0({ recHistory, pendingQueue })
```

All exports: `interpretationOnly` · `nonExecutive` · DR-01/DR-02 guarded.

---

## 5. Invariants (UI binding)

| ID | Rule |
|----|------|
| DR-01 | PUSH stream = suggest only |
| DR-02 | Labels = category + delta only |
| SC-02 | PULL authority context never auto-commits CubeState |
| UI-01 | No single panel merging Drift + Admission actions |
| UI-02 | AlertPacket rate-limit on PUSH (default max 10 / 60s window) |

---

## 6. What this unlocks

Rhizoh is no longer “running” — it is **observing itself**:

- Drift Engine = **perception layer** (not decision layer)
- System *knows* but binding layer makes it *visible*
- Frozen Core holds because system optimizes observation, not self-rewrite

---

## 7. Changelog

| Date | Change |
|------|--------|
| 2026-06-19 | v1.0 — Cognitive Transparency Interface · hybrid PUSH/PULL · visual binding map |
