# Rhizoh Operational Kernel Spec (ROKS) v1.0

**Filename:** `rhizoh_spec_v1.md`  
**Status:** ONTOLOGICAL FREEZE — Phase 1 (compression only)  
**Class:** Invariant compression layer — **not** normative constitution, **not** new theory

---

## 0. What this document is

| Is | Is not |
|----|--------|
| Minimal operational projection of **what already runs / is already constrained** | “What should be built” design manifesto |
| Four primitives + data types + interface contracts | Metaphor, mythology, product narrative |
| Pointer surface to formal SSOT (A9, NI2, T1, TLA core) | Replacement for [`RHIZOH_CONSTRAINT_CLOSURE_MAP_V1.0.md`](../RHIZOH_CONSTRAINT_CLOSURE_MAP_V1.0.md) |
| Vocabulary lock for Phase 2–3 sprint (conflict elimination, pseudo-signatures) | Machine-checked proof or production security proof |

**Extraction principle:** Theory is **not** allowed to run ahead of runtime. This spec answers: *If the system is already operating under Phase 0.5 gates, what is the lowest-entropy description?*

**Projection stance (critical):** The four primitives are an **observable projection** of runtime — **not** a closed world. ROKS is **lossy**: \(|\mathcal{T}| \gg\) ROKS summary. Full traces and the tick ledger remain authoritative for “why wrong.” Measurement aliases are locked in [`rhizoh_canonical_measurement_map_v1.md`](rhizoh_canonical_measurement_map_v1.md) (RCMM v1.1 — **four operators only**; no derived `M_*`).

**Three layers (do not collapse):**

```text
[L1] Core constraint space (A9 / NI2)     — immutable physics; never written at runtime
[L2] Runtime behavior                     — gates, traces, harness, client/gateway code
[L3] ROKS v1.0 (this file)                — compressed readable matrix of L2 under L1
```

**Relation to “anayasa”:**

| Document | Role |
|----------|------|
| [`RHIZOH_OPERATIONAL_CONSTITUTION_V1.md`](../RHIZOH_OPERATIONAL_CONSTITUTION_V1.md) | Engineering law: time/data/perception integrity articles |
| [`RHIZOH_HONEST_BASELINE_CHARTER_V1.md`](../RHIZOH_HONEST_BASELINE_CHARTER_V1.md) | Culture / founder alignment (`RESEARCH-ONLY`) |
| **ROKS v1.0 (this)** | **Resolved kernel** — no new norms; single primitive vocabulary |

---

## 1. Forbidden vocabulary (Phase 1 lock)

Do **not** use in this spec lineage or in code comments that claim ROKS authority:

- Creature / topology metaphors (octopus, turtle, vortex, spiral, immunity-as-organism)
- Consciousness / AGI / “living world” framing
- Duplicate labels for the same scalar (e.g. separate names for “stress accumulation” and “anomaly density” when one metric)

**Allowed:** constraint, trace, weight, gate, invariant, projection, falsification, append-only, inactive plane.

---

## 2. Four primitives (only)

### 2.1 Summary matrix

| Primitive | Type | Mutability | Function |
|-----------|------|------------|----------|
| **Core** | Constraint space | **Immutable at runtime** | Defines admissible variation; hosts \(S\), \(\Sigma\), \(\delta\), A9, NI2; never accepts writes from Observation or Threshold |
| **Threshold field** | Weighting function \(\theta\) | Dynamic (bounded curves) | Scales **observation sampling / report prominence** from stress and budget signals; **does not decide** and **does not mutate Core** |
| **Trace system** | Event stream \(\mathcal{T}\) | Append-only | Raw internal + external telemetry; some events are **non-integrable** (recorded, not folded into Core) |
| **Dissipation model** | Stability operator \(\Delta\) | Reactive (homeostatic) | Absorbs agent/load stress into bounded responses; caps energy budget side-effects on control paths |

**Anti-pattern (explicit):** Threshold is **not** a second Core. \(\theta \notin S\). \(\theta \not\to \delta\).

---

## 3. Core (constraint space)

### 3.1 Formal anchor (SSOT — do not re-prove here)

| Symbol | ROKS name | SSOT |
|--------|-----------|------|
| \(S, s_0\) | Core state | [`RHIZOH_STATE_ISOLATION_ASYNC_INPUT_PHASE0_5_V1.0.md`](../RHIZOH_STATE_ISOLATION_ASYNC_INPUT_PHASE0_5_V1.0.md) |
| \(\Sigma, \bot, \delta\) | Admissible transitions | Same |
| A9 | No alternate channel into \(\delta\) | [`RHIZOH_SYSTEM_NON_INTERFERENCE_THEOREM_V2.0.md`](../RHIZOH_SYSTEM_NON_INTERFERENCE_THEOREM_V2.0.md) §5 |
| NI2 | IFC wrapper: \(\gamma\) allowed, \(O \to S\) forbidden | Closure map |
| T1 / TI1′ | Properties **if** constraints hold | T1 / temporal lemma docs |
| `DataPlaneInactive` | Operational gate (Phase 0.5 default) | `isDataPlaneActiveV0() === false` |

### 3.2 Runtime contract (compressed)

```typescript
/** Immutable constraint declarations — not mutable state */
interface CoreConstraintSpace {
  readonly genesisState: CoreState;      // s0
  readonly alphabet: ReadonlySet<Sigma>; // Σ
  readonly rejectToken: NullAction;      // ⊥
  foundationA9: true;                    // env assumption, not a variable
  nonInterference: {
    allowGamma: true;                    // S -> O
    forbidObsToCore: true;               // ¬(O -> S)
    forbidObsToControl: true;           // S4 class
  };
}
```

**Transition law (operational):**

```text
ApplyDelta(s, a):
  if a = NullAction then s
  else if a ∈ Σ and thawPermitted then Delta(s, a)
  else s   // total; never undefined
```

**Phase 0.5 instance:** all external input projects to `NullAction` on Core; T1 invariant: `core === genesisState`.

**TLA projection:** [`spec/tla/RhizohCore.tla`](../../spec/tla/RhizohCore.tla) — `CoreUnchanged`.

---

## 4. Threshold field (observation weighting only)

### 4.1 Definition

\[
\theta: (\text{stress signals}, \text{energy budget}) \to \mathbb{R}_{\ge 0}
\]

- Output is a **weight** on observation pipelines (UI prominence, report sampling, smoothing inputs).
- **No** output is an action in \(\Sigma\).
- **No** path \(\theta \to \delta\) (dual-core illusion ends here).

### 4.2 Engineering anchor

| Mechanism | Module / doc | ROKS role |
|-----------|--------------|-----------|
| Divergence ratios, drift score | `epistemicStabilityControllerV0.js` / [`RHIZOH_EPISTEMIC_STABILITY_CONTROLLER_V0.1.md`](../RHIZOH_EPISTEMIC_STABILITY_CONTROLLER_V0.1.md) | \(\theta\) inputs |
| `boundaryDivergedRatio`, `degradedRatio`, … | Default thresholds (32-tick window) | Bounded curves |
| Go-live / stability thresholds | `POST_GO_LIVE_*`, cohort sim | **Ops gates** — not Core writes |

**Contract:**

```typescript
interface ThresholdField {
  /** Returns weights only; must not call ApplyDelta or mutate Core */
  weight(observationContext: ObsContext, signals: StressSignals): ObservationWeights;
}
```

**Tag:** `RESEARCH-ONLY` controllers remain non-executive on ledger/seal (see epistemic stability doc: *Observation ≠ Execution*).

---

## 5. Trace system (irreducible reality input)

### 5.1 Definition

\[
\mathcal{T} = \langle e_1, e_2, \ldots \rangle \quad \text{append-only}
\]

Each \(e_i\) is a **discrete slice** of external telemetry or internal interaction evidence.

### 5.2 Non-integrable traces (irreducible noise)

Some \(e_i\) carry flag `integrable: false`:

| Rule | Meaning |
|------|---------|
| Record | Event is stored in \(\mathcal{T}\) |
| Do not fold | Event **must not** update \(S\), seals, or admission |
| Do not stabilize | No post-hoc narrative that forces \(e_i\) into Core |

**Patology to avoid:** treating every trace as something Core “should have learned” — that is overfitting.

### 5.3 Engineering anchor

| Stream | Schema / module |
|--------|-----------------|
| Factual breach log | `castle.rhizoh.breach_observation.v0` — [`RHIZOH_REALITY_BREACH_OBSERVABILITY_V0.1.md`](../RHIZOH_REALITY_BREACH_OBSERVABILITY_V0.1.md) |
| Violation / witness | `violationObservationLogV0.js`, Phase 1 \(O\) / O1 spec |
| Simulation | **Separate** from observability — never authoritative for Core |

**Contract:**

```typescript
interface TraceEvent {
  seq: number;
  atMs: number;
  violationClass?: string;
  integrable: boolean;  // default false for raw external flood
  payload: Record<string, unknown>;
}

interface TraceSystem {
  append(event: TraceEvent): void;  // append-only
  /** No method: applyToCore() */
}
```

---

## 6. Dissipation model (stability operator)

### 6.1 Definition

\[
\Delta: (\text{stress influx}, S, \mathcal{T}) \to (\text{bounded response}, S')
\]

with **hard rule:** under Phase 0.5 inactive plane, \(S' = S\) always (stress may move **observation** and **reports**, not Core).

### 6.2 Engineering anchor

| Response | Behavior |
|----------|----------|
| Drift risk bands (`nominal` … `critical`) | Escalate **watch / report** — not silent Core mutation |
| Controlled chaos harness | Test-only stress injection — [`chaosHarnessV0.js`](../../apps/client/src/rhizoh/runtime/continuity/chaosHarnessV0.js) |
| Breach observability | Records fact; enforcement lives elsewhere |
| Replay / continuity | [`RHIZOH_REPLAY_CONTRACT_V0.md`](../RHIZOH_REPLAY_CONTRACT_V0.md) — equivalence class, not healing narrative |

**Contract:**

```typescript
interface DissipationModel {
  /** Reactive homeostasis; caps side-effects on control paths */
  absorb(stress: StressInflux, ctx: RuntimeContext): DissipationResult;
}

interface DissipationResult {
  coreUnchanged: boolean;      // required true Phase 0.5
  traceAppended: TraceEvent[];
  thresholdAdjust?: never;     // θ may read stress; Δ must not impersonate Core
}
```

---

## 7. Cross-cutting invariants (ROKS-level)

### 7.1 Propagation + reversibility

**Perceived reality quality** depends not only on how fast information spreads, but on **how much of it can be losslessly reversed** for audit.

| Concept | ROKS rule |
|---------|-----------|
| Propagation | \(\gamma: S \to O\) is **lossy**; forward-only display |
| Reversibility | Replay contract defines when two traces are **comparable** — not when story “feels right” |
| SSOT | [`RHIZOH_REPLAY_CONTRACT_V0.md`](../RHIZOH_REPLAY_CONTRACT_V0.md), projection discipline |

### 7.2 Epistemic autoimmunity guard

If narrative layer treats its own output as Core truth → **violation class** (perception integrity / A9 breach row).

**Sprint discipline:** new text must map to one of four primitives or be rejected.

### 7.3 Falsification surface (unchanged)

| Check | Maps to |
|-------|---------|
| `coreStateHash === hash(s0)` | T1 proxy |
| `tick` coupling | TI1′ |
| O→S row | NI2 / O1 |
| TLC `CoreUnchanged` | [`RhizohCore.tla`](../../spec/tla/RhizohCore.tla) |

---

## 8. Data-flow (minimal)

```text
I_ext ──► π_core ──► ApplyDelta ──► S (Core)     [Phase 0.5: always NullAction]
              │
              └──► TraceSystem.append (integrable flag)

S ──γ──► O ──θ──► weighted observation / UI

stress ──► θ (weights)
         └─► Δ (dissipation) ──► traces + reports only
                                   (S unchanged Phase 0.5)

O ──X──► S   (forbidden)
θ ──X──► δ   (forbidden)
```

---

## 9. SSOT precedence (conflict resolution)

When documents disagree, resolve in order:

1. **Foundation / closure** — A9, NI2, Phase 0.5 formal spec, constraint closure map  
2. **ROKS v1.0** — vocabulary compression (this file)  
3. **Operational constitution** — engineering articles  
4. **RESEARCH-ONLY** epistemic / charter / DRAS narrative layers  
5. **Outreach language** — never authoritative for Core  

**Rule:** ROKS **never** introduces a fifth primitive or a new axiom. Expansion requires closure map amendment + falsification row — not a metaphor.

---

## 10. Ontological freeze sprint (Phases 1.5–3)

| Phase | Action | Status |
|-------|--------|--------|
| **1** | This file — four primitives, no metaphor | **Done** |
| **1.5** | RCMM + derivation purge — four operators; derived = runtime only | **Done** — [`rhizoh_canonical_measurement_map_v1.md`](rhizoh_canonical_measurement_map_v1.md) v1.1 |
| **2.0** | Runtime semantic role lock — compute/project only; no interpretive authority | **Done** — [`rhizoh_runtime_semantic_role_lock_v1.md`](rhizoh_runtime_semantic_role_lock_v1.md) |
| **2.1** | Final epistemic firewall — no temporal narrativization | **Done** — [`rhizoh_final_epistemic_firewall_v1.md`](rhizoh_final_epistemic_firewall_v1.md) |
| **2.2** | Lexical normalization (`SignalSuppression`, `signalIds`, …) | **Done** |
| **2.3** | Authority graph audit — no unauthorized import path | **Done** — [`rhizoh_authority_graph_audit_v1.md`](rhizoh_authority_graph_audit_v1.md) |
| **3** | Engineering projection — data-flow maps, struct sketches, invariant pseudo-signatures only (no production code sprint) | Pending |

---

## 11. Honest limits (unchanged)

| Have | Do not have |
|------|-------------|
| Explicit adversary, boundary, invariant, falsification, executable semantics route | Machine-checked full-system proof |
| ROKS compression | Independent replication, empirical Phase 1 validation |
| `RhizohCore.tla` candidate | Infinite-state guarantees, production security proof |

---

## 12. Related index

| Topic | Path |
|-------|------|
| Formal closure | [`RHIZOH_CONSTRAINT_CLOSURE_MAP_V1.0.md`](../RHIZOH_CONSTRAINT_CLOSURE_MAP_V1.0.md) |
| TLA track | [`RHIZOH_TLA_EXECUTION_CORE_SKETCH_V1.0.md`](../RHIZOH_TLA_EXECUTION_CORE_SKETCH_V1.0.md) |
| Phase gate | [`RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md`](../RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md) |
| O1 (thaw) | [`RHIZOH_PHASE1_O1_CONSTRAINT_SPEC_V1.0.md`](../RHIZOH_PHASE1_O1_CONSTRAINT_SPEC_V1.0.md) |

---

*ROKS v1.0 — May 2026. Phase 1 ontological freeze. System is explained by extraction, not by new theory.*
