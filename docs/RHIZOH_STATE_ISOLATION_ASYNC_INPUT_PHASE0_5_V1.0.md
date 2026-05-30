# Formal Specification: State Isolation Under Asynchronous Input (Phase 0.5)

**Status:** SPEC (paper-grade skeleton — no new runtime primitives)  
**Phase:** 0.5 — Safe Reality Layer · data-plane **inert**  
**Parent:** [`RHIZOH_V1_ARCHITECTURAL_STATE_V1.0.md`](RHIZOH_V1_ARCHITECTURAL_STATE_V1.0.md) §0 (S1–S4) · [`RHIZOH_PHASE1_CONTROLLED_REAL_SIGNAL_V1.0.md`](RHIZOH_PHASE1_CONTROLLED_REAL_SIGNAL_V1.0.md)

---

## 0. Proof target (choose one — do not mix)

| Form | Definition | Phase 0.5 |
|------|------------|-------------|
| **A — Absolute invariance** | \(S_{t+1} = S_t\) for all rejected external input | **Selected** (core claim) |
| **B — Bounded drift** | \(d(S_t, S_{t+1}) \le \epsilon\) under resource stress | Deferred (Phase 1+ stress envelope) |

Phase 0.5 proves **A** on the **L1 / causality ledger slice** of \(S\). Physical-time side effects (OOM, scheduling) are **out-of-band** to \(\delta\) and handled as separate failure-mode lemmas (§6).

---

## 1. System model (state machine)

Rhizoh core at Phase 0.5 is a deterministic state machine:

\[
M = (S,\ \Sigma,\ \delta,\ s_0,\ \bot)
\]

| Symbol | Meaning |
|--------|---------|
| \(S\) | Internal state space (L1 core ledger / causality graph — **not** UI shell, not gateway buffers) |
| \(\Sigma\) | **Valid** internal transitions only (schema-closed ops the core accepts) |
| \(\delta\) | Transition function — **total** on \(S \times (\Sigma \cup \{\bot\})\) |
| \(s_0\) | Genesis-stable initial state |
| \(\bot\) | **Reject token** — semantic collapse of any non-\(\Sigma\) input |

### 1.1 Total transition law (not partial / undefined)

\[
\delta:\ S \times (\Sigma \cup \{\bot\}) \to S
\]

\[
\forall s \in S:\quad \delta(s,\ \bot) = s
\]

\[
\forall s \in S,\ \forall \sigma \in \Sigma:\quad \delta(s,\ \sigma) \in S \quad \text{(closed)}
\]

**Critical correction:** Do **not** use \(\delta(s, i) = \text{undefined}\). In many runtimes, “undefined” becomes exception, fallback, or coercion — **not** isolation.

### 1.2 Deterministic closure over non-alphabet input

\[
\forall s \in S,\ \forall i \notin \Sigma:\quad \delta(s,\ i) = \delta(s,\ \bot) = s
\]

Equivalently: only \(\pi(i) \in \Sigma\) may change state; everything else collapses to \(\bot\).

### 1.3 \(\bot\) and memory

\[
\bot \notin \text{MemoryMutationPath}
\]

Reject handling may append **observation witness** (out-of-band log) but **must not** append to WAL / L1 / admission / routing stores (S1–S3). Witness \(\not\subset \Sigma\) for \(\delta\).

---

## 2. External input and projection

### 2.1 Asynchronous input space (Phase 1 spec, Phase 0.5 volume = 0)

\[
I_{\text{ext}} = \{\, \text{device\_heartbeat\_v1} \,\}
\]

Packet shape (Phase 1 spec only):

\[
p = \langle \text{liveness},\ \text{build\_id},\ \text{consent\_epoch} \rangle
\]

### 2.2 Dual-space typing (core \(\pi\) vs observation \(\pi_{\text{obs}}\))

| Space | Projection | Alphabet |
|-------|------------|----------|
| **Core** | \(\pi_{\text{core}}\) | \(\Sigma \cup \{\bot\}\) — drives \(\delta\) only |
| **Observation** | \(\pi_{\text{obs}}\) | \(\Sigma_{\text{obs}}\) — drives \(\omega\) on \(O\) only |

\[
\Sigma \cap \Sigma_{\text{obs}} = \emptyset
\qquad
\sigma_{\text{obs}} \notin \Sigma
\]

**Phase 0.5:** only \(\pi_{\text{core}}\) is exercised; \(\pi_{\text{obs}}\) is inert.

### 2.3 Core projection \(\pi_{\text{core}}\) (strict type gate)

\[
\pi_{\text{core}}:\ I_{\text{ext}} \cup \{\text{malformed}\} \to \Sigma \cup \{\bot\}
\]

| Condition | \(\pi_{\text{core}}(p)\) |
|-----------|---------------------------|
| Phase 0.5 (`isDataPlaneActiveV0() === false`) | \(\bot\) **always** |
| Phase 1+, signal off / schema fail / policy deny | \(\bot\) |
| Phase 1+, valid + READY + S1 enforcement | \(\bot\) on **core** (no L1 write); optional \(\pi_{\text{obs}}(p) = \sigma_{\text{obs}} \in \Sigma_{\text{obs}}\) |

**Operational invariant (runtime gate theorem hook):**

\[
\neg \text{DataPlaneActive}(\text{Phase 0.5}) \implies \forall p:\ \pi_{\text{core}}(p) = \bot
\]

Implementation: `isDataPlaneActiveV0() === false`.

**Isolation chain (core):**

\[
I_{\text{ext}} \notin \Sigma \implies \pi_{\text{core}}(p) = \bot \implies \delta(S_t,\ \bot) = S_t
\]

**Theorem:** [`RHIZOH_STATE_ISOLATION_THEOREM_V1.0.md`](RHIZOH_STATE_ISOLATION_THEOREM_V1.0.md)

### 2.4 Assumptions (network & concurrency)

| Assumption | Statement |
|------------|-----------|
| **Async network** | Production surface feeds are delayful, lossy, unordered |
| **Event loop** | Ingress router / gateway handlers are async |
| **Core queue** | \(M\) advances on a **single-threaded sequential** application of \(\delta\) (no concurrent \(\delta\) without proof) |
| **Capability isolation** | Control flow (routing, admission) cannot read observation buffers as \(\Sigma\) inputs without explicit thaw |

---

## 3. Formal claim (absolute invariance — Phase 0.5)

\[
\forall t \ge 0,\ \forall \text{streams } (p_k)_{k \in \mathbb{N}} \subset I_{\text{ext}},\quad
\text{with Phase 0.5 gate:}\quad
S_{t+1} = S_t
\]

where each arrival is processed as:

\[
S_{t+1} = \delta(S_t,\ \pi(p_k))
\quad\text{and}\quad
\pi(p_k) = \bot \ \Rightarrow\ S_{t+1} = S_t
\]

**Cognitive / structural effect on \(S\):** none (by construction of \(\bot\) and S1–S4).

Maps to architectural contract:

| ID | Formal reading |
|----|----------------|
| S1 | \(\pi \to \bot\) on external path ⇒ no L1 write |
| S2 | Idempotent observation (witness only) |
| S3 | Audit read-only |
| S4 | No side-channel: volume / timing of \(p_k\) does not enter \(\Sigma\) |

---

## 4. Failure modes (where the claim can still break)

These are **not** violations of \(\delta(s,\bot)=s\) logic — they are **environment lemmas** that must be bounded or tested separately.

### 4.1 Logical time vs wall time (OOM / scheduling)

**Risk:** Async flood fills gateway buffers → CPU/RAM pressure → delays **simTick** scheduling → *apparent* non-determinism.

\[
T_{\text{logical}} \not\equiv T_{\text{wall}}
\]

**Phase 0.5 stance:** Does not mutate \(S\) if \(\pi \equiv \bot\); may violate **timing SLA**. Future **bounded drift** form (Proof target B):

\[
|T_{\text{logical}}^{(t+1)} - T_{\text{logical}}^{(t)} - \Delta| \le \epsilon_{\text{sched}}
\]

under resource cap \(R_{\max}\).

### 4.2 Schema drift / parser unsoundness

**Risk:** Malformed \(p\) triggers memory-unsafe parse before \(\pi\).

Target lemma (requires sound validator):

\[
\forall p \in P:\ \text{validate}(p) \Rightarrow \text{safe}(p)
\]

**Enforcement (Phase 1+):** JSON schema closed · size cap · reject-before-parse path to \(\bot\) · no `eval` / dynamic schema.

### 4.3 Implicit coercion (the “undefined” class of bugs)

**Risk:** Handler maps unknown fields into \(\Sigma\) by accident.

**Mitigation:** \(\pi\) is the **only** gate; whitelist ingress; CI asserts no `I_ext` symbol in \(\delta\) call sites when signal off.

---

## 5. Test scenario (verification sketch)

```
[Fake Traffic Generator] --(N async heartbeat)--> [Gateway Handler]
                                                          |
                    (watch WAL / ledger / simTick) <------+
```

| Parameter | Value |
|-----------|--------|
| Gate | `VITE_RHIZOH_PHASE1_SIGNAL=0` (or `isDataPlaneActiveV0() === false`) |
| Load | e.g. \(10^5\) manipulated `device_heartbeat_v1` / min (ops stress) |
| Metrics | CPU/RAM caps · `ledger_state` size · `simTick` index |
| **Formal properties (T1)** | \(\forall t \in T_{\text{run}}:\ \text{hash}(S_t) = \text{hash}(s_0) \land \tau(t) = \tau_{\text{canonical}}(t)\) |

**Pass:** hash equality + tick canonicality vs empty-stream baseline.  
**Fail:** any mismatch ⇒ **theorem violation** (not a performance-only regression).

See proof: [`RHIZOH_STATE_ISOLATION_THEOREM_V1.0.md`](RHIZOH_STATE_ISOLATION_THEOREM_V1.0.md) §5.

Harness anchors (when implemented): `phase1ActivationGateV0.js` · ingress tests · passive coherence CI.

---

## 6. Implementation map (informative — not proof)

| Layer | Touches \(S\)? | Phase 0.5 |
|-------|----------------|-----------|
| `phase1ActivationGateV0` | Forces \(\pi \to \bot\) | ✔ |
| Ingress router | Control-plane only | No \(I_{\text{ext}}\) → \(\Sigma\) |
| Gateway buffer | Out-of-band | Must not feed \(\delta\) |
| Epistemic tick / UI | Observation surfaces | Not \(S\) for this spec |

**Code map (draft):** [`RHIZOH_CONCEPT_CODE_MAPPING_V1.0.md`](RHIZOH_CONCEPT_CODE_MAPPING_V1.0.md)

---

## 7. Next mathematical step (deferred — outline only)

**Cognitive viscosity** \(\mu_c\) must **not** stay metaphor. Proposed measurable form (for a follow-on spec):

| Role | Space |
|------|--------|
| **Input** \(X\) | \(\{\text{interaction\_events},\ \text{dwell},\ \text{transition\_velocity}\}\) |
| **Output** \(Y\) | \(\{\text{state\_transition\_entropy}\}\) |
| **Metric** | \(\mu_c = \frac{dH(S)}{dt} \cdot v_{\text{interaction}}^{-1}\) (calibration required) |

Separate doc when thawed: *Rhizoh Cognitive Viscosity Metric Spec* — requires calibration dataset and explicit **non-binding** to \(\delta\).

---

## 8. Reviewer checklist (formal hygiene)

- [x] \(\delta\) total on \(\Sigma \cup \{\bot\}\)
- [x] \(\bot\) rejection — not “undefined”
- [x] \(\pi\) projection stated
- [x] Proof target A vs B separated
- [x] Failure modes as environment lemmas
- [x] Proof layer — theorem + lemmas ([`RHIZOH_STATE_ISOLATION_THEOREM_V1.0.md`](RHIZOH_STATE_ISOLATION_THEOREM_V1.0.md))
- [x] \(\sigma_{\text{obs}} \notin \Sigma\) — dual-space
- [ ] Empirical stress harness filed in ops export (when run)

---

## Related

| Doc | Role |
|-----|------|
| [`RHIZOH_STATE_ISOLATION_THEOREM_V1.0.md`](RHIZOH_STATE_ISOLATION_THEOREM_V1.0.md) | T1 + lemmas |
| [`RHIZOH_STATE_ISOLATION_ADVERSARY_MODEL_V1.0.md`](RHIZOH_STATE_ISOLATION_ADVERSARY_MODEL_V1.0.md) | \(\mathcal{A}_{\text{net}}\), falsifiability |
| [`RHIZOH_TEMPORAL_ISOLATION_LEMMA_V1.0.md`](RHIZOH_TEMPORAL_ISOLATION_LEMMA_V1.0.md) | \(\tau\), \(dI_{\text{ext}}/d\tau=0\), hash vs \(\equiv\) |
| [`RHIZOH_SYSTEM_NON_INTERFERENCE_THEOREM_V2.0.md`](RHIZOH_SYSTEM_NON_INTERFERENCE_THEOREM_V2.0.md) | NI2 · \(\gamma\) · A9 · closure graph |
| [`RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md`](RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md) | No runtime until READY |
| [`RHIZOH_PHASE_TRANSITION_NOTE_V1.0.md`](RHIZOH_PHASE_TRANSITION_NOTE_V1.0.md) | Ops snapshot |
| [`RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md`](RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md) | Gate before \(\pi \ne \bot\) in prod |

*State isolation spec v1.0 — 2026-05-19*
