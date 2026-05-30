# Rhizoh TLA+ Execution Core Sketch v1.0

**Status:** SKETCH — **semantic compression only** (no `.tla` module, no TLC run)  
**Phase:** **A** of academic track (compress → then minimal model → then TLC)  
**Parent stack:** [`RHIZOH_CONSTRAINT_CLOSURE_MAP_V1.0.md`](RHIZOH_CONSTRAINT_CLOSURE_MAP_V1.0.md) · [`RHIZOH_STATE_ISOLATION_ASYNC_INPUT_PHASE0_5_V1.0.md`](RHIZOH_STATE_ISOLATION_ASYNC_INPUT_PHASE0_5_V1.0.md) · [`RHIZOH_SYSTEM_NON_INTERFERENCE_THEOREM_V2.0.md`](RHIZOH_SYSTEM_NON_INTERFERENCE_THEOREM_V2.0.md)

**One sentence:** Translate Rhizoh’s **constraint-satisfied boundary topology** into **operational semantics vocabulary** before writing TLA+ — so the first machine artifact is a **minimal core**, not a poetic meta-layer.

### Execution route lock (do not expand sideways)

| In scope | Out of scope |
|----------|----------------|
| `spec/tla/RhizohCore.tla` + TLC + violation traces | New metaphysics / consciousness / AGI framing |
| Ops harness alignment (`o1-violation`, hash rows) | New theorem stack (Phase 0.5 closed) |
| O1 thaw **after** B/C green | Full universe TLA model |

**Phase B artifact:** [`spec/tla/RhizohCore.tla`](../spec/tla/RhizohCore.tla) · `npm run formal:tlc-rhizoh-core`

---

## 0. What this document is / is not

| Is | Is not |
|----|--------|
| Compression map: Rhizoh symbols → State / Action / Transition / Invariant | A new theorem, primitive, or metaphysics layer |
| Skeleton for **Phase B** (minimal \(S,O,\pi,\delta\) + \(\neg O \to S\)) | Full universe model (gateway, UI, legal, cohort) |
| Honest bridge to future TLC | Claim of machine verification today |
| Guardrail: **over-formalization stops** (NI2 §0) | Replacement of T1/O1 prose proofs |

**Class (unchanged):** Constraint-satisfied boundary system — **not** proof engine.

**Academic birth moment (future):** First `tlc` run on a finite instance of this sketch ⇒ “exploration found no violation” — not “I believe T1.”

---

## 1. Roadmap (three phases — do not skip A)

| Phase | Goal | Artifact | Stop condition |
|-------|------|----------|----------------|
| **A — Semantic compression** | One operational reading of NI2/T1/TI1′/A9/O1 | **This doc** | Every legacy symbol maps to ≤1 TLA+ role |
| **B — Minimal executable core** | Model **T1 + \(\neg(O \to S)\)** only | `RhizohCore.tla` (future) | State space bounded; no Phase 1 ingest yet |
| **C — TLC model check** | Finite exploration | TLC config + violation trace | First counterexample **or** bound reached |

**Do not:** write TLA+ before A is signed off internally. **Do not:** add theorems/primitives during A–B.

---

## 2. Semantic compression table (meta-layer → operational)

Rhizoh prose carries **interpretation** (“epistemic,” “boundary,” “witness”). TLA+ requires **mechanical roles**:

| Rhizoh (human / meta) | TLA+ role | Notes |
|------------------------|-----------|--------|
| Core state \(S\) | Variable `core` ∈ `CoreState` | L1 slice only — not UI, not gateway buffers |
| Observation \(O\) | Variable `obs` ∈ `ObsState` | Read-only **from core’s view**; may grow in Phase 1 |
| \(\Sigma\), \(\bot\) | `Action` alphabet + `NullAction` | \(\bot\) = action that leaves `core` unchanged |
| \(\delta\) | `Next` transition on `core` | Total on `core × (Sigma ∪ {Null})` |
| \(\pi_{\text{core}}\) | `ProjectInput(pkt)` → `Action` | Inactive ⇒ always `NullAction` |
| \(\gamma: S \to O\) | `UpdateObs(core, obs)` | Allowed; must not call `ApplyDelta` |
| \(\neg(O \to S)\) | **Forbidden** `Next` disjunct | Any step where `obs` influences `core'` is illegal |
| Semantic collapse | `ProjectInput(_) = NullAction` | Same as \(\delta(s,\bot)=s\) |
| **A9** (foundation) | `ASSUME NoAltChannel` | Environment assumption — **not** derivable inside module |
| **A6** DataPlaneInactive | `ASSUME ~DataPlaneActive` | Phase 0.5 world |
| **T1** | `Invariant CoreUnchanged` | `core = core0` |
| **TI1′** | `Temporal TickCoupling` | `tick` advances only on internal steps |
| **NI2** | `Invariant` + `ASSUME` bundle | IFC topology, not a single formula name |
| **O1** (Phase 1+) | `Assert` / `PROPERTY` on traces | Runtime verification layer — **after** B passes on 0.5 core |
| Falsification row | `ViolationPredicate` → `FALSE` | Harness maps to TLC error trace |

**Dropped from first model (Phase B):** adversary flood volume, legal text, Firebase, UI shell, \(\mathcal{A}_{\text{host}}\) OOM — out-of-band to \(\delta\) per Phase 0.5 spec §0.

---

## 3. Module shape (pseudo-TLA+ — not runnable)

Below is **sketch syntax** for alignment. Names may change when implementing `RhizohCore.tla`.

### 3.1 Variables

```text
VARIABLES
  core,          \* ∈ CoreState — Rhizoh S
  obs,           \* ∈ ObsState  — Rhizoh O (Phase 0.5: static under γ)
  tick,          \* ∈ Nat       — logical τ (internal counter)
  pkt,           \* ∈ Packet ∪ {NoPacket} — adversary / env choice
  DataPlaneActive  \* ∈ BOOLEAN — gate (FALSE in Phase 0.5 instance)
```

**Constants (configure per instance):**

```text
CONSTANTS
  CoreState, ObsState, Sigma, core0, obs0,
  MaxSteps   \* bound for TLC
```

### 3.2 Init

```text
Init ==
  /\ core = core0
  /\ obs = obs0
  /\ tick = 0
  /\ pkt = NoPacket
  /\ DataPlaneActive = FALSE   \* Phase 0.5 instance
```

### 3.3 Actions (compressed)

| Action | Meaning | Rhizoh |
|--------|---------|--------|
| `EnvDeliver(p)` | Nondeterministic adversary delivers `p` | \(\mathcal{A}_{\text{net}}\) |
| `ProjectAndStep` | `a := ProjectInput(p); core' := ApplyDelta(core, a)` | \(\pi_{\text{core}} \circ \delta\) |
| `InternalTick` | `tick' := tick + 1`; optional internal \(\sigma \in \Sigma\) | TI1′ baseline drift |
| `Observe` | `obs' := Gamma(core)` | \(\gamma\) — **no** `core` change |

**ApplyDelta (total transition law):**

```text
ApplyDelta(s, a) ==
  IF a = NullAction THEN s
  ELSE IF a ∈ Sigma THEN Delta(s, a)   \* finite enumeration in minimal model
  ELSE s                                 \* defensive — should not arise
```

**ProjectInput (semantic compression of inactive plane):**

```text
ProjectInput(p) ==
  IF ~DataPlaneActive THEN NullAction
  ELSE ... \* Phase 1+ only — still often NullAction on core (S1)
```

### 3.4 Next (valid transitions)

```text
Next ==
  \/ /\ EnvDeliver(p) /\ pkt' = p /\ UNCHANGED <<core, obs, tick>>
  \/ /\ ProjectAndStep
  \/ /\ InternalTick
  \/ /\ Observe
```

**Phase 0.5 minimal instance:** disable `InternalTick` internal \(\Sigma\) ops first; prove **only** `EnvDeliver` + `ProjectInput → NullAction` leaves `core` fixed.

### 3.5 Illegal transitions (explicit — NI2 heart)

TLA+ has no built-in “illegal”; use **two patterns**:

1. **Subtraction:** `Next` only lists legal disjuncts (preferred for minimal core).
2. **Assertion:** `Illegal_ObsToCore == FALSE` where:

```text
Illegal_ObsToCore ==
  \* Any proposed step where obs or a predicate on obs changes core
  /\ core' # core
  /\ ObsInfluencedCore(obs, obs', core, core')
```

**Rhizoh mapping:**

| Forbidden | Sketch enforcement |
|-----------|-------------------|
| \(O \to S\) | `ObsInfluencedCore` never true in `Next` |
| \(O \to \Sigma_{\text{control}}\) | Out of scope in minimal core — **assume** in A9 |
| Witness → \(\delta\) | Phase 1: `ProjectAndStep` must not use `obs` in `ProjectInput` |

### 3.6 Invariants (properties → formulas)

| ID | Formula (sketch) | Rhizoh |
|----|------------------|--------|
| **Inv-T1** | `CoreUnchanged == (core = core0)` | Theorem T1 (Phase 0.5) |
| **Inv-Total** | `\A s, a: ApplyDelta(s,a) ∈ CoreState` | A1–A3 |
| **Inv-Null** | `ApplyDelta(s, NullAction) = s` | A3 |
| **Inv-NI2-Obs** | `ObsNoFeedback == (core = core0 \/ ~ObsInfluencedCore(...))` | \(\neg(O \to S)\) under inactive |

**Foundation (not invariant — assumption):**

```text
ASSUME NoAltChannel ==
  \* No action other than ProjectInput(pkt) and legal InternalTick
  \* may change core from external influence
  TRUE   \* refined in B with refined action set
```

### 3.7 Temporal properties (TI1′)

```text
TickMonotonic == [] (tick' >= tick)

TickCoupling ==
  \* External delivery alone does not increment tick
  [](pkt # NoPacket => tick' = tick)   \* under DataPlaneActive = FALSE

TemporalBaseline ==
  \* Adversary run tick equals baseline internal-only run
  \* (checked by two TLC configs: with/without EnvDeliver)
```

**Do not** conflate `tick` with wall clock — matches [`RHIZOH_TEMPORAL_ISOLATION_LEMMA_V1.0.md`](RHIZOH_TEMPORAL_ISOLATION_LEMMA_V1.0.md).

### 3.8 O1 (Phase C+ — not in first TLC module)

| O1 | Sketch role |
|----|-------------|
| Witness append | New action `AppendObs` — only changes `obs` |
| \(\neg(o \to S)\) | Same `Illegal_ObsToCore` |
| Runtime harness | Post-run `Assert` on log trace ≡ TLC trace |

Implement **after** Phase B proves Inv-T1 on `DataPlaneActive = FALSE`.

---

## 4. Phase B scope (minimal executable core)

**Include:**

- \(M = (S, \Sigma, \delta, s_0, \bot)\) as `core`, `ApplyDelta`, `NullAction`
- \(O\) as `obs` with **`Gamma` read-only**
- \(\pi_{\text{core}}\) as `ProjectInput` with `DataPlaneActive = FALSE`
- \(\neg(O \to S)\) as excluded / asserted illegal influence

**Exclude (state explosion / meta-layer):**

- Full \(I_{\text{ext}}\) schema evolution
- Gateway buffers, WAL, admission (S4 detail)
- UI, legal, cohort, breach synthesis
- Parallel DRAS / FCTS / POCL notations

**Finite instance strategy:**

- `CoreState` ≈ `{s0}` only (prove T1 literally)
- `Sigma` ≈ `{}` or `{noop}` — external input always `NullAction`
- `ObsState` ≈ `{obs0}` (static \(\gamma(s_0)\))
- Adversary: `pkt` ∈ small finite set (including malformed)

**Success criterion for B:** `RhizohCore.tla` + TLC config runs in seconds; **Inv-T1** holds; optional exploration of `Illegal_ObsToCore` yields no path.

---

## 5. Phase C — what changes academically

| Before TLC | After TLC (bounded) |
|------------|---------------------|
| “Inductive sketch / structurally correct” | “No counterexample in explored state space” |
| Human reads NI2 DAG | Tool emits trace on violation |
| O1 harness = ops JSON | Trace alignment: harness row ↔ TLC state |

**Still not claimed:** infinite-state proof, production deployment proof, “perfect security.”

---

## 6. Dependency on existing stack (no new axioms)

```
Boundary B
    └── A9  →  ASSUME NoAltChannel
            └── DataPlaneInactive  →  DataPlaneActive = FALSE
                    └── NI2  →  Inv-NI2-Obs + legal Next
                            ├── T1   →  Inv-T1 (core = core0)
                            └── TI1′ →  TickCoupling
                                    └── O1 (Phase 1) →  separate module + Assert
```

**Transitive rule (unchanged):** no path from `pkt` or `obs` to `core'` except `NullAction` when inactive.

---

## 7. Falsification alignment (ops ↔ TLC)

| Ops harness row | TLC / spec |
|-----------------|------------|
| `coreStateHash` mismatch | `Inv-T1` violated |
| `tick` drift under flood | `TickCoupling` violated |
| O→S feedback detected | `Illegal_ObsToCore` |

[`RHIZOH_O1_VIOLATION_EXECUTION_SPEC_V1.0.md`](RHIZOH_O1_VIOLATION_EXECUTION_SPEC_V1.0.md) remains **runtime** layer; TLC is **model** layer — traces should be comparable, not merged.

---

## 8. Over-formalization guard (inherited)

Stop expanding **this** track when:

- No new `Next` disjunct or `ASSUME` changes falsifiability
- No new TLC config row in ops checklist

Continue when:

- Phase 1 thaw requires **witness** in `obs` without relaxing `Inv-T1`
- New adversary class needs a new `EnvDeliver` shape

See NI2 v2.0 §0 — same guard as Phase 0.5 formal closure.

---

## 9. Positioning (external / academic)

| Claim | Allowed |
|-------|---------|
| Formal system design + runtime falsification hooks | ✔ |
| Constraint-satisfied boundary under explicit axioms | ✔ |
| Machine-verified distributed system | ✘ until Phase C |
| Proof engine / unconditional safety | ✘ |

**Reviewer sentence:** *We compress a dual-space IFC topology into a minimal TLA+ core; Phase 0.5 is the instance `DataPlaneActive = FALSE`; T1 is an invariant, A9 is an environment assumption, O1 is a later trace assertion.*

---

## 10. Next actions (ordered)

1. **Review this sketch** against Phase 0.5 spec — fix symbol drift only (no new theory).
2. ~~**Implement** `spec/tla/RhizohCore.tla`~~ — **done** (Phase B minimal).
3. ~~**TLC config** `RhizohCore.cfg`~~ — **done**; run: `cd spec/tla && tlc -config RhizohCore.cfg RhizohCore.tla`
4. **Document** TLC output in `docs/exports/ops/` (future) — one JSON row per run.
5. **Phase 1 module** — only after B green; add `AppendObs`, keep `Inv-T1`.

---

*Sketch v1.0 — May 2026. Semantic compression (Phase A); no `.tla` committed by this document alone.*
