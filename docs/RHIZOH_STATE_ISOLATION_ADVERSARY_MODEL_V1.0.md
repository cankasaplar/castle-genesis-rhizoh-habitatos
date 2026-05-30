# Rhizoh State Isolation — Adversary Model v1.0

**Status:** SPEC (completes theorem world-model assumptions)  
**Parent:** [`RHIZOH_STATE_ISOLATION_THEOREM_V1.0.md`](RHIZOH_STATE_ISOLATION_THEOREM_V1.0.md) · [`RHIZOH_STATE_ISOLATION_ASYNC_INPUT_PHASE0_5_V1.0.md`](RHIZOH_STATE_ISOLATION_ASYNC_INPUT_PHASE0_5_V1.0.md)

**Purpose:** T1 is **structurally correct** but **not falsifiable** without an explicit adversary. This doc closes the “who can inject what” boundary.

---

## 1. System boundary (what exists)

| Region | Inside boundary | Can reach \(\delta\) on \(S\)? |
|--------|-----------------|--------------------------------|
| **Core queue** | Sequential \(\delta\) applications | ✔ (only via \(\Sigma \cup \{\bot\}\)) |
| **Gateway handler** | Async buffers, parse, route | ✘ (must pass \(\pi_{\text{core}}\) first) |
| **Observation store** \(O\) | Witness append via \(\omega\) | ✘ (no edge \(O \to S\)) |
| **UI / perception shell** | Display, copy, camera | ✘ (not \(S\)) |
| **Ingress / legal** | Control-plane session keys | ✘ (not L1 \(S\)) |

**Boundary axiom (non-interference):**

\[
\forall o \in O:\ \neg (o \to S)
\]

Witness growth in \(O\) **must not** feed \(\Sigma\) without explicit thaw + separate proof (**Theorem O1**, deferred).

**No alternative transition channel:**

\[
\nexists\, \text{channel } C:\ C \neq \pi_{\text{core}} \land C \text{ drives } \delta \implies \text{violation}
\]

Listed as **Assumption A9** in theorem — enforced by capability isolation + CI (P1), not by induction alone.

---

## 2. Adversary classes (Phase 0.5 scope)

### 2.1 Adversary \(\mathcal{A}_{\text{net}}\) — bounded injection (default for T1)

| Capability | Allowed |
|------------|---------|
| Inject | Arbitrary **count** of packets \(p \in I_{\text{ext}}\) (including malformed) |
| Timing | Arbitrary inter-arrival times (async flood) |
| Content | Any tuple consistent with **byte stream** (before validate) |
| Replay | **Yes** — same \(p\) repeated |
| Ordering | Permute / reorder deliveries |
| Crypto | None assumed (no MAC break required for T1) |

| Capability | **Forbidden** (out of model — if occurs, boundary breach) |
|------------|-----------------------------------------------------------|
| Write L1 / WAL / admission / routing directly | ✘ |
| Invoke \(\delta(s, \sigma)\) for \(\sigma \in \Sigma\) derived from \(p\) without thaw | ✘ |
| Read \(S\) and write back mutated \(S\) (oracle tamper) | ✘ |
| Side-channel: timing/volume of \(p_k\) enters \(\Sigma\) | ✘ (A8 / S4) |
| Observation \(O\) → \(S\) feedback | ✘ (\(\forall o \in O: \neg(o \to S)\)) |

**Strength:** T1 is proven **relative to** \(\mathcal{A}_{\text{net}}\) + A9. It is **not** “too strong to falsify” because replay and flood are in scope.

### 2.2 Adversary \(\mathcal{A}_{\text{host}}\) — resource (environment lemma, not T1)

| Capability | Effect |
|------------|--------|
| CPU/RAM exhaustion | May delay wall clock; must not change \(\tau\) if A10 holds |
| Parser exploit before \(\pi\) | Violates validate/safe lemma — **out of T1**, security incident |

T1 does **not** claim liveness under \(\mathcal{A}_{\text{host}}\); see [`RHIZOH_TEMPORAL_ISOLATION_LEMMA_V1.0.md`](RHIZOH_TEMPORAL_ISOLATION_LEMMA_V1.0.md).

### 2.3 Adaptive adversary (Phase 1+ — deferred)

An adversary that observes \(O\) and chooses next \(p\) is **not** in Phase 0.5 T1 scope. When DataPlaneActive:

- Still require \(\pi_{\text{core}}(p) = \bot\) for \(S\) (S1)
- **Theorem O1** must prove \(\mathcal{A}_{\text{adapt}}\) cannot close \(O \to S\)

---

## 3. Injection model

```
Adversary ──(stream p_k ∈ I_ext)──> [Network] ──> [Gateway buffer]
                                                      │
                                            validate? ─┼─> fail → π_core = ⊥
                                                      │
                                            π_core ────┴──> δ(S, ⊥) = S
                                                      │
                                            π_obs ────────> ω(O, σ_obs)  (Phase 1+ only; ⊥ O in 0.5)
```

| Step | Formal |
|------|--------|
| Arrival | \(p_k\) at wall time \(t_k^{\text{wall}}\) |
| Core | \(S_{k+1} = \delta(S_k, \pi_{\text{core}}(p_k))\) |
| Phase 0.5 | \(\pi_{\text{core}}(p_k) = \bot\) always |
| Replay | \(p_k = p_j\) allowed; \(\pi\) idempotent on core → still \(\bot\) |

---

## 4. Replay and ordering

| Property | Phase 0.5 under T1 |
|----------|---------------------|
| Replay \(p\) | \(S\) unchanged |
| Reorder stream | \(S\) unchanged (sequential \(\delta\); \(\bot\) commutative) |
| Duplicate flood | \(S\) unchanged; may stress gateway (**not** \(S\)) |

**Idempotence on core:**

\[
\delta(\delta(s, \bot), \bot) = \delta(s, \bot) = s
\]

---

## 5. Falsifiability (how T1 can fail)

| Failure | Witness |
|---------|---------|
| Direct L1 write from handler | \(\text{hash}(S_t) \ne \text{hash}(s_0)\) |
| Coercion into \(\Sigma\) | Trace shows \(\delta(s, \sigma)\), \(\sigma \notin \{\bot\}\) from \(I_{\text{ext}}\) |
| \(O \to S\) feedback | Witness correlates with routing/admission delta |
| Side-channel (S4) | Admission/routing changes with only volume/timing of \(p_k\) |
| Tick drift | \(\tau(t) \ne \tau_{\text{canonical}}(t)\) with DataPlaneInactive |

Stress harness instantiates rows 1 and 5 — [`RHIZOH_STATE_ISOLATION_THEOREM_V1.0.md`](RHIZOH_STATE_ISOLATION_THEOREM_V1.0.md) §5.

---

## 6. Mapping to implementation (informative)

| Adversary action | Guard |
|------------------|-------|
| Flood heartbeat | Gateway buffer caps; \(\pi_{\text{core}} \equiv \bot\) when inactive |
| Replay | No nonce required for T1 (outcome still \(\bot\)) |
| Env read of Phase1 flag | `phase1ActivationGateV0` sole reader (P1) |

---

## 7. Proof obligations

| ID | Obligation |
|----|------------|
| A-P1 | Document \(\mathcal{A}_{\text{net}}\) in every T1 citation |
| A-P2 | CI forbids \(I_{\text{ext}} \to \delta\) call sites when inactive |
| A-P3 | Phase 1: specify \(\mathcal{A}_{\text{adapt}}\) + Theorem O1 |

*Adversary model v1.0 — 2026-05-19*
