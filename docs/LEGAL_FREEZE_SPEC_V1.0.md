# Legal Freeze Spec v1.0

**Status:** ACTIVE (until counsel sign-off + published ToS/KVKK)  
**Tag:** `GOVERNANCE` — not executable; binds humans and agents  
**Seal reference:** `legal_reality_spec_sha256` = `5dbeb7ee93e8b3ff40be73d569f93c9cec73eee37a7a3535205d87883a885972`  
**Architectural meaning:** [`RHIZOH_V1_ARCHITECTURAL_STATE_V1.0.md`](RHIZOH_V1_ARCHITECTURAL_STATE_V1.0.md) — *System Evolution Barrier* (epistemic consistency), not merely a legal checklist.

---

## 0. System evolution barrier (real meaning)

| Barrier | What it locks | Technical effect |
|---------|---------------|------------------|
| **1. Legal / product surface** | ToS inflation, AI guarantee, named invite, open signup | Rhizoh cannot become a “new rights-claiming” system |
| **2. Epistemic primitives** | New `*V0` spine modules | Ontology + schema + runtime semantics **freeze** — fixed epistemic machine |
| **3. Observation → Execution** | Narrative/UI → L1 state | Read everything; **L4 does not change the world** |
| **4. Production governance** | Preamble bypass, silent flags | Governance bypass attack surface closed |
| **5. Live world floodgate** | Camera, global nodes, live telemetry | Phase 2–3 only — see [`RHIZOH_PHASE1_CONTROLLED_REAL_SIGNAL_V1.0.md`](RHIZOH_PHASE1_CONTROLLED_REAL_SIGNAL_V1.0.md) (spec) |

**Design phase name:** *Negative Capability Architecture* — stability from refusal, not feature count.

---

## 1. Purpose

Rhizoh is in **legal-reviewable system prototype** phase. This spec answers: **what may not be added or changed** until the legal feedback loop closes.

**Thaw condition:** Counsel-approved publishable ToS/KVKK + updated spec seal + explicit founder “legal thaw” note in `docs/academic/SESSION_LOG.md`.

---

## 2. Freeze scope (what is frozen)

| Layer | Frozen artifact |
|-------|-----------------|
| Public legal text | ToS, KVKK, Legal Pack PRIMARY, counsel email body |
| Public claims | Marketing, landing, AI capability promises |
| Ingress copy | `LegalPreambleScreen`, `ingress_router` preamble strings |
| Liability framing | L1/L4, WAL, sovereign node allocation |
| Product positioning | “AI-assisted SaaS / infrastructure” — not publisher, not advisor |

---

## 3. Prohibited additions (❌ artık eklenemez)

Until thaw, **do not**:

### 3.1 Legal & compliance surface

- New user-facing obligations, warranties, or “guaranteed truth” language
- New data categories in privacy notice without counsel review
- Named celebrity / lab / “endorsed by X” copy or invite flows
- Auto-execution claims (“AI decides”, “system grants rights”)
- Bypass of legal preamble on `rhizoh.com` production
- Committing secrets, `.env`, or draft counsel PDFs with placeholders to `main`

### 3.2 Epistemic / execution core

- New `*V0` / `*V0.1` **runtime primitives** in `apps/client/src/rhizoh/runtime/` (ledger, stability, identity, causality, counterfactual, audit bundle, reproducibility)
- New GEJ/AIL/EAERT **admission law** in executable paths
- `centralizedArbitrationBus: true` or Observation → Execution bridges
- Features marketed as “immune”, “armor”, “escape”, “supra-state”

### 3.3 Product & growth

- Open signup without closed-admission policy decision
- Payment / billing integration tied to unreviewed terms
- Public API keys or third-party data resale
- “First 50 users = [named individuals]” operational lists

### 3.4 Infrastructure (without runbook + legal ack)

- Production DNS cutover without [`INFRASTRUCTURE_DNS_HARDENING_V0.1.md`](INFRASTRUCTURE_DNS_HARDENING_V0.1.md)
- Disabling WAF / TLS / audit logging for convenience

---

## 4. Permitted work (✅ freeze sırasında yapılabilir)

| Category | Examples |
|----------|----------|
| **Legal loop** | Placeholder fill, PDF regen, counsel Q&A, checklist ops |
| **Ingress (non-claim)** | UX polish, a11y, routing — **no new legal promises** |
| **Cohort planning** | `simulateGoLiveCohortV0`, export, thresholds — interpretation only |
| **Docs** | LEGAL_FREEZE, INGRESS_FLOW, CLOSED_USER_ADMISSION — governance text |
| **Bugfixes** | Preamble broken link, session ack persistence — no scope creep |
| **Tests** | Ingress, admission engine, cohort simulation |

---

## 5. Agent / CI discipline

Agents **must** treat this file as hard stop for:

1. New runtime epistemic modules  
2. Public copy that expands liability or AI authority  
3. Named-invite production code paths  

Allowed path when user requests frozen work: **document + stub + interpretationOnly** cohort tooling only.

---

## 6. Completion tracks (parallel to thaw)

| Track | Doc / command |
|-------|----------------|
| Legal sign-off | PRIMARY PDF · [`COUNSEL_EMAIL_TEMPLATE_V1.0.md`](legal/COUNSEL_EMAIL_TEMPLATE_V1.0.md) |
| Cohort go/no-go | `npm run legal:go-live-cohort-sim` · [`RHIZOH_GO_LIVE_COHORT_SIMULATION_V1.0.md`](RHIZOH_GO_LIVE_COHORT_SIMULATION_V1.0.md) |
| Ingress UI freeze | [`RHIZOH_INGRESS_UI_FREEZE_V1.0.md`](RHIZOH_INGRESS_UI_FREEZE_V1.0.md) |

---

## 7. Thaw checklist (legal loop exit)

- [ ] Counsel feedback incorporated in ToS/KVKK PRIMARY  
- [ ] `node scripts/seal-legal-reality-spec.mjs` — new digest on `main`  
- [ ] Staging: `VITE_RHIZOH_LEGAL_PREAMBLE=1` smoke  
- [ ] SESSION_LOG entry: legal thaw date + counsel ref  
- [ ] Go-live cohort decision = PROCEED per [`RHIZOH_GO_LIVE_COHORT_SIMULATION_V1.0.md`](RHIZOH_GO_LIVE_COHORT_SIMULATION_V1.0.md)  

---

## Related

| Doc | Role |
|-----|------|
| [`LEGAL_REALITY_SPEC_V0.1.md`](LEGAL_REALITY_SPEC_V0.1.md) | Engineering ↔ legal alignment |
| [`RHIZOH_CLOSED_USER_ADMISSION_V0.1.md`](RHIZOH_CLOSED_USER_ADMISSION_V0.1.md) | Stress cohort (no names) |
| [`RHIZOH_INGRESS_FLOW_V1.0.md`](RHIZOH_INGRESS_FLOW_V1.0.md) | rhizoh.com entry UX |
| [`legal/RHIZOH_LEGAL_PACK_PRIMARY_PDF_SOURCE_V1.0.md`](legal/RHIZOH_LEGAL_PACK_PRIMARY_PDF_SOURCE_V1.0.md) | Attorney PRIMARY |

---

*Rhizoh Systems — Legal Freeze v1.0 — 2026-05-19*
