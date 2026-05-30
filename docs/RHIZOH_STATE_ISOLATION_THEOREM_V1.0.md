# Rhizoh State Isolation Theorem v1.0

**Status:** THEOREM (inductive proof sketch — **not** machine-checked; completeness requires adversary + timing axioms)  
**Spec:** [`RHIZOH_STATE_ISOLATION_ASYNC_INPUT_PHASE0_5_V1.0.md`](RHIZOH_STATE_ISOLATION_ASYNC_INPUT_PHASE0_5_V1.0.md)  
**Adversary:** [`RHIZOH_STATE_ISOLATION_ADVERSARY_MODEL_V1.0.md`](RHIZOH_STATE_ISOLATION_ADVERSARY_MODEL_V1.0.md)  
**Timing:** [`RHIZOH_TEMPORAL_ISOLATION_LEMMA_V1.0.md`](RHIZOH_TEMPORAL_ISOLATION_LEMMA_V1.0.md)  
**Phase:** 0.5 — Proof target **A** (absolute invariance on \(S\))

**Honest scope:** T1 is **structurally correct** relative to assumptions A1–A10 and adversary \(\mathcal{A}_{\text{net}}\). It is **not** a completed mechanical proof.

---

## 0. Dual-space model (resolves \(\sigma_{\text{obs}}\) ambiguity)

Rhizoh is **not** a single alphabet machine for all surfaces. Two spaces:

| Space | Symbols | Transition | Phase 0.5 |
|-------|---------|------------|-----------|
| **Core** \(M = (S, \Sigma, \delta, s_0, \bot)\) | \(\Sigma\) — L1-legal ops only | \(\delta: S \times (\Sigma \cup \{\bot\}) \to S\) | **Theorem applies here** |
| **Observation** \(O\) | \(\Sigma_{\text{obs}}\) — witness append ops | \(\omega: O \times \Sigma_{\text{obs}} \to O\) | Phase 1+ only; **disjoint from \(\delta\)** |

**Critical:** \(\sigma_{\text{obs}} \in \Sigma_{\text{obs}}\), **not** \(\sigma_{\text{obs}} \in \Sigma\).

\[
\Sigma \cap \Sigma_{\text{obs}} = \emptyset
\]

**Non-interference (explicit — prevents theorem leakage):**

\[
\forall o \in O:\ \neg (o \to S)
\]

Phase 1+ valid heartbeat may produce \(\pi_{\text{core}}(p) = \bot\) **and** optional \(\pi_{\text{obs}}(p) = \sigma_{\text{obs}}\) with \(\omega\) only — **no** \(\delta\) call.

Isolation on \(S\) is **not weakened** by witness growth in \(O\) **iff** \(O \not\to S\) holds (Theorem O1, Phase 1+).

---

## 1. Theorem (T1 — absolute state invariance, Phase 0.5)

**Theorem T1.** Let \(M = (S, \Sigma, \delta, s_0, \bot)\) be the core machine. Let \(\pi_{\text{core}}\) be the core projection. Let adversary \(\mathcal{A}_{\text{net}}\) be as in the adversary model. If **DataPlaneInactive** and **A9** (no side-channel into \(\delta\)) hold, then for all \(t \in T_{\text{run}}\) during any stream \((p_k)\) from \(\mathcal{A}_{\text{net}}\):

\[
S_t \equiv s_0
\]

and (Lemma **TI1**):

\[
\tau(t) = \tau_{\text{canonical}}(t) = f(\text{internal counter only})
\qquad
\frac{d I_{\text{ext}}}{d \tau} = 0
\]

where \(\tau_{\text{canonical}}\) is the tick trace on the **empty-input baseline** (no packets processed).

**Verification proxy (tests only):** \(\text{hash}(S_t) = \text{hash}(s_0)\) — does **not** replace \(\equiv\) in the proof.

**Corollary (step form):** \(\forall k:\ S_{k+1} \equiv S_k \equiv s_0\) when DataPlaneInactive.

---

## 2. Assumptions (axioms)

| ID | Axiom |
|----|--------|
| **A1** | \(\Sigma\) is **closed**: \(\forall s \in S,\ \forall \sigma \in \Sigma:\ \delta(s,\sigma) \in S\) |
| **A2** | \(\delta\) is **total** on \(S \times (\Sigma \cup \{\bot\})\) |
| **A3** | **Neutral reject:** \(\forall s \in S:\ \delta(s, \bot) = s\) |
| **A4** | \(\pi\) is a **total function** \(\pi: (I_{\text{ext}} \cup \{\text{malformed}\}) \to \Sigma \cup \{\bot\}\) (core alphabet only) |
| **A5** | **Strict core typing:** \(I_{\text{ext}} \cap \Sigma = \emptyset\) |
| **A6** | **DataPlaneInactive** \(\Rightarrow\) \(\forall p:\ \pi(p) = \bot\) (operational gate) |
| **A7** | **No coercion:** handler never invokes \(\delta(s, \sigma)\) with \(\sigma\) derived from \(I_{\text{ext}}\) unless \(\sigma \in \Sigma\) and explicit thaw (not Phase 0.5) |
| **A8** | **Sequential core:** one \(\delta\) application per logical step; no concurrent \(\delta\) without ordering proof |
| **A9** | **FOUNDATION AXIOM** — no channel \(C \neq \pi_{\text{core}}\) drives \(\delta\) from \(I_{\text{ext}}\). **Unprovable inside formal stack;** falsifiable by implementation breach. See NI2 §5 |
| **A10** | **Temporal:** \(\tau\) advance not coupled to \(I_{\text{ext}}\) under DataPlaneInactive (TI1) |

### 2.1 Runtime gate (static spec + execution bridge)

\[
\neg \text{DataPlaneActive}(\text{Phase 0.5}) \implies \forall p:\ \pi(p) = \bot
\]

**Implementation hook:** `isDataPlaneActiveV0() === false` ([`phase1ActivationGateV0.js`](../apps/client/src/rhizoh/ingress/phase1ActivationGateV0.js)).

This prevents **model / execution collapse** — the theorem is conditioned on a flag the build can enforce.

---

## 3. Lemma chain

### Lemma L1 (external collapse)

\[
\forall p \in I_{\text{ext}}:\ p \notin \Sigma \quad\text{(A5)}
\]

Under **DataPlaneInactive** (A6):

\[
\pi(p) = \bot
\]

*Proof sketch:* A6 is the operational collapse rule; A5 ensures no bypass label in \(\Sigma\).

---

### Lemma L2 (\(\bot\) is neutral)

\[
\forall s \in S:\ \delta(s, \bot) = s \quad\text{(A3)}
\]

*Proof sketch:* Definitional axiom of reject token (not undefined).

---

### Lemma L3 (identity transition under inactive data-plane)

For any stream \((p_k)_{k=0}^{n-1}\) during DataPlaneInactive:

\[
S_{k+1} = \delta(S_k, \pi(p_k)) = \delta(S_k, \bot) = S_k
\]

*Proof sketch:* L1 gives \(\pi(p_k)=\bot\); L2 gives \(\delta(S_k,\bot)=S_k\).

---

### Lemma L4 (baseline invariance)

\[
S_0 = s_0,\quad S_n = S_0
\]

*Proof sketch:* Induction on \(k\) using L3.

---

### Lemma L5 (tick canonicality — delegated to TI1)

\[
\forall k:\ \tau_k = \tau_0
\quad\text{under DataPlaneInactive + T1–T4}
\]

*Proof:* See [**TI1**](RHIZOH_TEMPORAL_ISOLATION_LEMMA_V1.0.md) — \(\tau = f(\text{internal only})\), \(\frac{d I_{\text{ext}}}{d\tau} = 0\).

---

## 4. Proof sketch (T1)

1. **Input never enters \(\Sigma\) on core path** (A5, A6, A7) → only \(\bot\) is fed to \(\delta\).
2. **Only \(\bot\) reachable** (L1) → \(\delta\) always applies neutral element (L2).
3. **Identity transition only** (L3) → \(S_{k+1} = S_k\).
4. **Invariance** (L4) → \(S_t = s_0\) for all \(t\).
5. **Tick canonicality** (L5) → \(\tau(t) = \tau_{\text{canonical}}(t)\).

**Contradiction closure:** Suppose \(\exists t: S_t \ne s_0\). Then \(\exists k\) minimal with \(S_{k+1} \ne S_k\). Requires \(\pi(p_k) \ne \bot\) or \(\delta\) not neutral — violates L1 or A3. ∎ (sketch)

---

## 5. Formal validation scenario (adversarial load)

**Chaos model:** Poisson or burst arrival of \(p \in I_{\text{ext}}\) at rate \(\lambda\) (e.g. \(\lambda = 10^5/\text{min}\)).

**Gate:** DataPlaneInactive (signal = 0).

**Properties to verify (empirical instantiation of T1):**

\[
\forall t \in T_{\text{run}}:\quad S_t \equiv s_0
\]

\[
\forall t \in T_{\text{run}}:\quad \tau(t) = \tau_{\text{canonical}}(t)
\]

**Harness proxies:** \(\text{hash}(S_t) = \text{hash}(s_0)\) (declare schema + hash fn in export); tick log matches baseline.

**Procedure name:** `STATE_ISOLATION_STRESS_V0` (ops harness — when filed, attach hash + tick log to `docs/exports/ops/`).

**Fail semantics:** Any hash mismatch ⇒ **theorem violation** (not performance regression).

---

## 6. Phase 1+ extension (non-theorem scope here)

When DataPlaneActive and READY:

| Core | Observation |
|------|-------------|
| \(\pi_{\text{core}}(p) = \bot\) (S1 — still no L1 write) | \(\pi_{\text{obs}}(p) = \sigma_{\text{obs}} \in \Sigma_{\text{obs}}\) optional |

**T1 unchanged on \(S\).** Witness growth in \(O\) is **Theorem O1** (separate — append-only, no feedback into \(\delta\)).

Bounded drift (Proof target B) applies to **environment lemmas** (E1 scheduling), not to T1.

---

## 7. Open proof obligations

| ID | Obligation |
|----|------------|
| P1 | CI: sole Phase1 env reader (A6 hook) |
| P2 | Stress harness: \(\equiv\) via hash proxy + \(\tau\) log |
| P3 | Phase 1: **Theorem O1** — \(\forall o \in O: \neg(o \to S)\) under \(\mathcal{A}_{\text{adapt}}\) |
| P4 | Adversary model filed in every T1 citation |
| P5 | TI-P2: gateway must not advance \(\tau\) on \(p_k\) path when inactive |

---

## Related

| Doc | Role |
|-----|------|
| [`RHIZOH_STATE_ISOLATION_ASYNC_INPUT_PHASE0_5_V1.0.md`](RHIZOH_STATE_ISOLATION_ASYNC_INPUT_PHASE0_5_V1.0.md) | Full spec + failure modes |
| [`RHIZOH_STATE_ISOLATION_ADVERSARY_MODEL_V1.0.md`](RHIZOH_STATE_ISOLATION_ADVERSARY_MODEL_V1.0.md) | \(\mathcal{A}_{\text{net}}\), falsifiability |
| [`RHIZOH_TEMPORAL_ISOLATION_LEMMA_V1.0.md`](RHIZOH_TEMPORAL_ISOLATION_LEMMA_V1.0.md) | TI1, \(\tau\), hash vs \(\equiv\) |
| [`RHIZOH_SYSTEM_NON_INTERFERENCE_THEOREM_V2.0.md`](RHIZOH_SYSTEM_NON_INTERFERENCE_THEOREM_V2.0.md) | NI2 · \(\gamma\) · A9 · closure graph |
| [`RHIZOH_V1_ARCHITECTURAL_STATE_V1.0.md`](RHIZOH_V1_ARCHITECTURAL_STATE_V1.0.md) | S1–S4 contract |

*Isolation theorem v1.0 — 2026-05-19*
