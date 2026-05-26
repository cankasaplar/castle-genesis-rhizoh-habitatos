# Rhizoh v1 Architectural State v1.0

**Status:** ACTIVE  
**Canonical name:** *Deterministic Epistemic Execution Environment with Frozen Ontology and Controlled Ingress*  
**Design phase:** **Negative Capability Architecture** — power from what the system **refuses**, not from feature accumulation.

This document names what [`LEGAL_FREEZE_SPEC_V1.0.md`](LEGAL_FREEZE_SPEC_V1.0.md) enforces in governance language. The freeze is not “features are illegal”; it is a **system evolution barrier** that preserves **epistemic consistency boundary**.

---

## 0. Current state classification (snapshot)

**Technical status:** **Spec-complete, execution-inert** (*cold architecture state*).

**Precise engineering name:** **Causally isolated control-plane system** — deterministic control-plane with **zero active data-plane**.

| Plane | Status | Includes |
|-------|--------|----------|
| **Control-plane** | ✔ defined | Spec, routing, UI, rules, legal freeze, ingress, invariants |
| **Data-plane** | ❌ absent (intentional) | Heartbeat, ingestion, telemetry — switch off |

| Property | State |
|----------|--------|
| Behavior defined | ✔ |
| Boundaries locked | ✔ |
| Real-world connection **designed** | ✔ |
| **External causal effect on system state** | ✔ none |

**One-line (V1 lock):** *Rhizoh V1 is a deterministic control-plane architecture with an intentionally absent data-plane, ensuring that all observed signals remain causally non-effective.*

**Final engineering lock:** *Rhizoh V1 is a causally isolated, non-generative control-plane specification where observability is permitted under strict non-influence constraints, and all state transitions are deferred to a future enforced runtime layer.*

**Prior lock (still valid):** *Observability is permitted; causality is strictly non-derivable from observed traces.*

**Snapshot sentence:** *Control-plane fully defined; data-plane intentionally absent; no runtime semantic activation.*

**System kind:** **Causally isolated control-plane system** (stricter than generic “behavior constraint”) — **non-generative state model**: does not produce new state; defines boundaries of admissible state only. Not a **behavioral system**.

**Product vs boundary:**

| | |
|--|--|
| **Product** | runtime — a running system |
| **Rhizoh V1** | **bounded runtime definition** — the mathematical limit of what a running system may do |

Not “incomplete system” nor “over-claimed system” — **formal system boundary description**.

| Phase | Status | What exists |
|-------|--------|-------------|
| **Phase 0** | **ACTIVE** | UI ingress · routing / deterministic fallback · legal freeze · observation + audit **sim** · WAL isolation **rules** (spec + invariants) |
| **Phase 1** | **DRAFT, CLOSED** | `device_heartbeat_v1` spec · gateway path **designed, not activated** · `VITE_RHIZOH_PHASE1_SIGNAL=0` |
| **Phase 2+** | **NOT STARTED** | No edge node registry · no global ingestion · no live telemetry |

**Architectural win:** Real-world integration is **not coded early** — it is **sealed as a controlled option** (no premature open; design does not freeze blindly; future gate defined and locked).

**Core invariant:** *System memory arises only from the system itself* — protects against state pollution, observer-effect collapse, and fake-liveness illusion.

**Valid only while these sub-conditions hold** (re-verify on every data-plane change):

| # | Sub-condition | Requirement |
|---|---------------|-------------|
| S1 | External input | **No state write** to L1 / WAL / admission / routing from outside |
| S2 | Observation pipeline | **Idempotent** witness — replay-safe append; no side effects on seal graph |
| S3 | Audit layer | **Read-only** with respect to execution — export is evidence, not tick input |
| S4 | Side-channel | **No implicit coupling** between observation surfaces and control-plane state (timing, volume, ordering of logs must not drive routing, admission, or L1) |

Together **S1–S4** form the **causal isolation contract** → **non-generative state model** (system does not mint state from observation; only bounds what a future runtime may do).

**Formal:** Spec [`RHIZOH_STATE_ISOLATION_ASYNC_INPUT_PHASE0_5_V1.0.md`](RHIZOH_STATE_ISOLATION_ASYNC_INPUT_PHASE0_5_V1.0.md) · Theorem **T1** [`RHIZOH_STATE_ISOLATION_THEOREM_V1.0.md`](RHIZOH_STATE_ISOLATION_THEOREM_V1.0.md) — \(\pi_{\text{core}}\), \(\sigma_{\text{obs}} \notin \Sigma\), Proof **A**.

**Theory mapping:** *Observed data may exist without being causally effective* ≡ **epistemic trace ≠ state transition** — guards against log inflation as state pollution, audit mistaken for execution trigger, telemetry as implicit control loop, **side-channel influence** (S4).

**Stage today:** **Formal constraint stage** — correctly defined, **unexecuted** deterministic model. Benefits: no early execution risk · no spec drift on activation path · no causal ambiguity at runtime (runtime inert).

**Enforcement layer (Phase 1–2+ — deferred):** S1–S4 must move from design guarantee to **runtime enforcement** — guards · CI · ingress validation · side-channel audits. Spec alone is insufficient when data-plane activates.

*Re-verify S1–S4 at every data-plane gate.*

**Deployment vs activation (binding):**

| Event | Meaning |
|-------|---------|
| **Deployment (connectivity)** | DNS · TLS · Cloudflare · Firebase **scaffold** — *surface routing* — **SAFE now** |
| **Activation** | Heartbeat on · ingestion · telemetry · WAL-external influence — *system reality injection* — **NOT SAFE until gated** |

*Going live ≠ binding DNS. Running (Phase 1) = opening the signal switch.*

**Surface vs activation:** Infra deployment may create a **potential observability surface** (reachable host, TLS, static ingress) without **runtime semantic activation**. Rule: **surface ≠ system activation** — freeze holds because connectivity alone must not imply a live data-plane.

**Operational truth (all three may hold):**

- ✔ Infra prep allowed (DNS / Firebase / hosting)  
- ✔ Spec freeze continues (LEGAL + PHASE1 + this doc)  
- ✔ Execution closed (`VITE_RHIZOH_PHASE1_SIGNAL=0`)

**Feedback precision:** *No feedback loop* ≠ *no system feedback*. Logs, audit, and observation **may grow** — they are **not causally effective** on system state.

**Engineering form:** *Observed data may exist without being causally effective* (logs and audit exports can increase; **system state does not change** because of them).

**Maturity signal:** No early activation · no liveness illusion · no external→state coupling · deterministic freeze — **not a system that could accidentally “go live”** through DNS or hosting alone.

**Go/no-go (operational):** [`RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md`](RHIZOH_ACTIVATION_READINESS_CHECKLIST_V1.0.md) · `npm run activation:readiness-check`

---

## 0b. Specification · enforcement · runtime (three layers)

| Layer | V1 status | Meaning |
|-------|-----------|---------|
| **Specification** | ✔ formal, complete | §0 · LEGAL_FREEZE · PHASE1 · S1–S4 causal isolation contract |
| **Enforcement** | ❌ deferred | Runtime guards · CI (incl. S4 side-channel) · ingress validation |
| **Runtime (data-plane)** | ❌ inert | No semantic activation; no generative state from external input |

V1 = **correctly defined but unexecuted deterministic model** — intentional.

Phase 1 activation requires specification **plus** enforcement for heartbeat; DNS/infra may proceed under **surface ≠ activation**.

**What Rhizoh work is now:** Not building a running system — **mathematically bounding the universe in which the system may later run** (boundary clean · no accidental go-live via hosting alone).

---

## 1. What the system is now

| Property | State |
|----------|--------|
| Legal surface | **Freeze** — no new rights claims, no ToS inflation |
| Runtime ontology | **Fixed** — tick / ledger / identity / causality = **closed set** |
| Admission | **Controlled** — role gates, stress profile, no named trust injection |
| Execution path | **Observation-only** at narrative/UI boundary |
| Growth model | **Not** self-describing expansion — **closed epistemic machine** |

**Question shift:** The project no longer asks *“what do we add?”* It asks *“what must we never break?”*

---

## 2. Four evolution barriers (technical meaning)

### Barrier 1 — Product / legal surface freeze

**Governance text:** no new ToS/KVKK, AI guarantee, named invite, open signup.

| Locks | System effect |
|-------|----------------|
| Product expansion (growth layer) | Rhizoh cannot become a “new rights-claiming” platform |
| Legal drift (version inflation) | Public obligations stay counsel-bounded |
| Identity anchoring (celebrity / named trust) | Trust cannot be injected via names |

### Barrier 2 — Epistemic primitive freeze (critical)

**Governance text:** no new `*V0` runtime primitives in the epistemic spine.

| Technical counterpart | Result |
|----------------------|--------|
| Ontology freeze | Admissible reality vocabulary is fixed |
| Schema freeze | Cross-tick / ledger shapes do not sprawl |
| Runtime semantics freeze | Tick engine meaning does not drift |

**Closed set (non-exhaustive):** tick engine, tick ledger, stability controller, audit bundle, reproducibility, identity continuity, causality graph, counterfactual graph.

System is **not** a self-describing growth system; it is a **fixed epistemic machine** with instance evolution only inside the closed set.

### Barrier 3 — Observation → Execution channel closed

**Governance text:** no bridge from interpretation to sealed state change.

| Sources (read-only at L4) | Must not |
|---------------------------|----------|
| UI copy, model output, simulation display | Change L1 system state, seals, or rights |

**Effect:** Everything may be **read**; narrative does **not** change the world. (L1 transitions remain protocol-gated only.)

### Barrier 4 — Production governance surface closed

**Governance text:** no staging→prod short-circuit, preamble bypass, silent flags.

| Closes | Effect |
|--------|--------|
| Hidden deploy paths | Governance bypass attack surface reduced |
| Legal turnstile skip on `rhizoh.com` | Ingress integrity preserved |

---

## 3. Layer stack (separation of concerns — complete)

```
Legal freeze          →  what we may claim
Ingress filter        →  who enters + ack boundaries  (law → epistemic filter)
Admission engine      →  stress-class cohort (interpretationOnly)
Runtime (fixed)       →  tick / ledger / identity / causality
Execution             →  observation-only at L4 boundary
```

**Ingress chain:** Legal Preamble → (optional) Cohort Profile → App Entry → Tick Engine.

---

## 4. Go-live cohort simulation — what it proves

Simulation output (e.g. **admit 58%**) is a **system readiness signal**, not a mailing list.

| Metric | Meaning |
|--------|---------|
| Admit rate | Epistemic compatibility of entrants |
| Reject rate | Boundary friction / risk veto hits |
| Stress-class spread | Model robustness across four failure geometries |

Thresholds (`PROCEED` / `HOLD` / `ABORT`) ask:

- Does the system **accept** humans without collapsing boundaries?
- Do humans **break** the fixed machine?
- Which stress class is most stable at go-live?

See [`RHIZOH_GO_LIVE_COHORT_SIMULATION_V1.0.md`](RHIZOH_GO_LIVE_COHORT_SIMULATION_V1.0.md).

---

## 5. Phase evolution (real world)

**Current:** Phase **0–0.5 — Safe Reality Layer** (deterministic world simulation; data plane off). See [`RHIZOH_MOCK_VS_REAL_BOUNDARY_MAP_V1.0.md`](RHIZOH_MOCK_VS_REAL_BOUNDARY_MAP_V1.0.md).

**Next (spec ready):** [`RHIZOH_PHASE1_CONTROLLED_REAL_SIGNAL_V1.0.md`](RHIZOH_PHASE1_CONTROLLED_REAL_SIGNAL_V1.0.md) — one signal (`device_heartbeat_v1`), read-only, legal-gated.

**Later:** Phase 2 edge nodes · Phase 3 global sync — see [`RHIZOH_PHASE_EVOLUTION_ROADMAP_V1.0.md`](RHIZOH_PHASE_EVOLUTION_ROADMAP_V1.0.md).

| Distinction | Phase 1 goal |
|-------------|----------------|
| Read real world | Yes — one channel |
| Pretend connected globally | No |

---

## 6. Active phase — three completion tracks

| # | Track | Deliverable | Done when |
|---|--------|-------------|-----------|
| 1 | Legal sign-off | PRIMARY PDF + counsel loop | Thaw checklist in LEGAL_FREEZE §6 |
| 2 | Cohort sim (staging) | `npm run legal:go-live-cohort-sim` on staging config | Decision = `proceed` + ops sign-off |
| 3 | Ingress UI freeze | [`RHIZOH_INGRESS_UI_FREEZE_V1.0.md`](RHIZOH_INGRESS_UI_FREEZE_V1.0.md) | rhizoh.com first screen copy locked |

---

## 7. Stability-first epistemic runtime design

This phase is rare in product literature: **stability-first** — closure before expansion.

After thaw, permitted work is **integration, deploy, docs, and counsel-approved legal publish** — not new ontology primitives without an explicit **freeze thaw protocol** (separate from legal thaw).

---

## Related

| Doc | Role |
|-----|------|
| [`LEGAL_FREEZE_SPEC_V1.0.md`](LEGAL_FREEZE_SPEC_V1.0.md) | Operational prohibition list |
| [`RHIZOH_INGRESS_FLOW_V1.0.md`](RHIZOH_INGRESS_FLOW_V1.0.md) | User journey |
| [`RHIZOH_CLOSED_USER_ADMISSION_V0.1.md`](RHIZOH_CLOSED_USER_ADMISSION_V0.1.md) | Stress classes |
| [`RHIZOH_OPERATIONAL_CONSTITUTION_V1.md`](RHIZOH_OPERATIONAL_CONSTITUTION_V1.md) | Execution law |

---

*Rhizoh Systems — v1 Architectural State — 2026-05-19*
