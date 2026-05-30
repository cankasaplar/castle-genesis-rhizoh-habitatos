# Rhizoh Temporal Isolation Lemma v1.0

**Status:** LEMMA (timing axioms for T1 — separates wall clock from logical tick)  
**Parent:** [`RHIZOH_STATE_ISOLATION_THEOREM_V1.0.md`](RHIZOH_STATE_ISOLATION_THEOREM_V1.0.md)  
**Adversary:** [`RHIZOH_STATE_ISOLATION_ADVERSARY_MODEL_V1.0.md`](RHIZOH_STATE_ISOLATION_ADVERSARY_MODEL_V1.0.md) §2.2

---

## 1. Problem (why L5 was underspecified)

T1 uses \(\tau(t) = \tau_{\text{canonical}}(t)\) but **canonical** must not mean wall clock. Otherwise:

\[
T_{\text{wall}} \not\equiv T_{\text{logical}}
\]

under \(\mathcal{A}_{\text{host}}\) (OOM, scheduling) collapses the claim into a performance test, not a theorem.

**Fix:** Define \(\tau\) as a **pure internal counter**; prove **zero coupling** from external input rate to \(\tau\).

---

## 2. Clock definitions

| Symbol | Definition |
|--------|------------|
| \(t\) | Wall-clock index (physical time — **not** state) |
| \(\tau\) | **Logical tick** — \(\tau: \mathbb{N} \to \mathbb{N}\) |
| \(\tau_{\text{canonical}}(k)\) | Tick count on **baseline** run (no \(p_k\) from \(\mathcal{A}_{\text{net}}\)) |
| \(\text{execution\_step}_k\) | True iff core scheduler applies an **internal** transition (e.g. epistemic tick loop) |

### 2.1 Non-degenerate \(\tau\) (Lamport / execution-trace style)

**Refinement:** \(\tau\) is **not** “constant because \(S\) is frozen.” Internal work may still advance \(\tau\).

\[
\tau_{k+1} = \tau_k + \mathbb{1}[\text{execution\_step}_k]
\]

| Step source | Counts toward \(\tau\)? |
|-------------|-------------------------|
| Internal epistemic / scheduled core op | **Yes** (baseline drift) |
| Gateway handling \(p_k\) with \(\pi_{\text{core}}(p_k)=\bot\) only | **No** (T3) |
| \(\delta(S_k, \bot)\) from external packet alone | **No** |

**T1 temporal claim (corrected):**

\[
\tau_{\text{adversary}}(k) = \tau_{\text{canonical}}(k)
\]

Adversary may flood wall time; **must not** add logical steps beyond baseline.

**Coupling:**

\[
\frac{d I_{\text{ext}}}{d \tau} = 0 \quad \text{under DataPlaneInactive}
\]

\[
\tau(k) = f(\text{internal execution trace only})
\]

External packet arrivals may affect **gateway wall time** but **must not** set \(\mathbb{1}[\text{execution\_step}]=1\) solely from \(p_k\).

---

## 3. Axioms (timing)

| ID | Axiom |
|----|--------|
| **T1** | \(\tau_{k+1} = \tau_k\) iff the applied core symbol is \(\bot\) |
| **T2** | Tick advance \(\sigma_\tau \in \Sigma\) only on **explicit internal** ops (epistemic tick loop, not gateway) |
| **T3** | Under DataPlaneInactive, no \(\sigma_\tau\) is triggered by handler processing \(p_k\) |
| **T4** | Wall clock \(t\) does not appear in \(f\) — \(\tau\) is not a function of \(T_{\text{wall}}\) |

---

## 4. Lemma TI1 (temporal isolation — Phase 0.5)

**Lemma TI1.** If DataPlaneInactive and axioms T1–T4 and A7 (no coercion) hold, then for all adversarial streams \((p_k)\) from \(\mathcal{A}_{\text{net}}\):

\[
\frac{d I_{\text{ext}}}{d \tau} = 0
\qquad\Rightarrow\qquad
\forall t \in T_{\text{run}}:\ \tau(t) = \tau_{\text{canonical}}(t)
\]

**Proof sketch.**

1. Each \(p_k\) maps to \(\pi_{\text{core}}(p_k) = \bot\) (theorem L1).
2. \(\delta(S_k, \bot) = S_k\) — no internal op that includes \(\sigma_\tau\) (T1, T3).
3. External \(p_k\) does not set \(\text{execution\_step}\) (T3) ⇒ no **extra** increments vs baseline.
4. Align adversary run with baseline at each \(k\): \(\tau_{\text{adversary},k} = \tau_{\text{canonical},k}\).
5. Wall-time density of \(p_k\) does not enter \(f\) (T4). ∎

**Corollary:** Flood at \(10^5\) packets/min does not **skew** \(\tau\) vs canonical — baseline internal ticks may still advance both traces equally.

---

## 5. Lemma TI2 (wall-clock decoupling — environment)

**Lemma TI2 (conditional).** Under resource cap \(R_{\max}\) on gateway buffers, \(\mathcal{A}_{\text{host}}\) cannot force \(\tau\) to advance without violating T3.

**Not part of T1 core proof** — if host violates T3 (bug: tick tied to handler callback count), TI1 fails → **implementation defect**, not math defect.

**Bounded drift (Proof target B — future):**

\[
|T_{\text{logical}}^{(t+1)} - T_{\text{logical}}^{(t)} - \Delta| \le \epsilon_{\text{sched}}
\]

under \(\mathcal{A}_{\text{host}}\) at bounded load — separate from Phase 0.5 absolute invariance on \(S\).

---

## 6. State equivalence vs hash (verification proxy)

**Formal claim (T1 state part):**

\[
S_t \equiv s_0
\]

(structural equality on the L1 slice / ledger model)

**Empirical proxy (stress harness only):**

\[
\text{hash}(S_t) = \text{hash}(s_0)
\]

| Role | Statement |
|------|-----------|
| **Theorem** | Uses \(\equiv\) |
| **Test** | Uses hash — must declare collision risk / schema version in export |
| **Invalid** | “hash equal” **replaces** \(\equiv\) in proof |

---

## 7. Combined theorem statement (T1 + TI1)

**T1′ (state + time).** DataPlaneInactive \(\Rightarrow\)

\[
\forall t \in T_{\text{run}}:\ S_t \equiv s_0 \ \land\ \tau(t) = \tau_{\text{canonical}}(t) \ \land\ \frac{d I_{\text{ext}}}{d \tau} = 0
\]

Verification: hash proxy for \(\equiv\) + tick log for \(\tau\) — [`RHIZOH_STATE_ISOLATION_THEOREM_V1.0.md`](RHIZOH_STATE_ISOLATION_THEOREM_V1.0.md) §5.

---

## 8. Open obligations

| ID | Obligation |
|----|------------|
| TI-P1 | Instrument \(\tau\) as explicit counter in stress export |
| TI-P2 | CI assert gateway handlers do not call tick advance on \(p_k\) path when inactive |
| TI-P3 | Document hash algorithm + ledger schema version in ops JSON |

## Related

| Doc | Role |
|-----|------|
| [`RHIZOH_SYSTEM_NON_INTERFERENCE_THEOREM_V2.0.md`](RHIZOH_SYSTEM_NON_INTERFERENCE_THEOREM_V2.0.md) | NI2 bidirectional closure |

*Temporal isolation lemma v1.0 — 2026-05-19*
