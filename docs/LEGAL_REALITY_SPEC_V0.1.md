# Legal Reality Spec v0.1

**Status:** SECURED — public legal membrane · aligns with operational constitution  
**Freeze (active):** [`LEGAL_FREEZE_SPEC_V1.0.md`](LEGAL_FREEZE_SPEC_V1.0.md) — no new legal claims or epistemic runtime primitives until counsel thaw.  
**Tag:** `CORE-ELIGIBLE` (governance text; does not modify frozen v562–v570 execution subgraph)

**Role:** Translate epistemic architecture into **admissible legal language** for regulators, users, and operators. No philosophical marketing terms (“armor”, “escape”, “supra-state”). Official, auditable, limitation-aware prose only.

**Public legal frame (avukat birincil):** [`legal/RHIZOH_LEGAL_PRIVACY_INFORMATION_PACK_V1.0.md`](legal/RHIZOH_LEGAL_PRIVACY_INFORMATION_PACK_V1.0.md) — SaaS / AI platform positioning.  
**Technical (non-legal):** [`legal/RHIZOH_TECHNICAL_ARCHITECTURE_SUMMARY_NON_LEGAL_V1.0.md`](legal/RHIZOH_TECHNICAL_ARCHITECTURE_SUMMARY_NON_LEGAL_V1.0.md).

---

## 1. Service definition (binding for all public copy)

| Term | Legal meaning |
|------|----------------|
| **Rhizoh** | Epistemic execution environment and infrastructure protocol — not a social network product claim, not “general AI”, not financial or medical advice. |
| **L1 — Core execution** | Deterministic state machine, seals, WAL — **binding** for admitted system state transitions. |
| **L4 — Narrative** | AI/agent-generated display and language (Lab AI, Companion, etc.) — **non-binding** observation; not a statement of fact or legal representation. |
| **Observation ≠ Execution** | Interpretation and narrative **must not** be treated as execution truth or as creating rights/obligations against sealed state. |

Public ToS and privacy notices **must** restate this separation. See [`legal/RHIZOH_TERMS_OF_SERVICE_TR_V0.1.md`](legal/RHIZOH_TERMS_OF_SERVICE_TR_V0.1.md).

---

## 2. Audit log (WAL) — regulatory framing

System state transitions are recorded in an **append-only audit log** with integrity-oriented timestamps and hash chaining for **forensic auditability** and **data integrity** — not for covert profiling as a product goal.

Public wording (TR): see Privacy/KVKK doc § “Denetim günlüğü”.

Technical reference: `walHashChainV0`, `violationObservationLogV0`, Go-Live §6 audit bundle (interpretation-only exports).

---

## 3. Sovereign nodes — liability allocation

Data and legal acts performed on **user-operated sovereign nodes** (independent deployments, WGS84-anchored instances) are the **node operator’s** responsibility. Rhizoh infrastructure operator does not assume content liability for node-local processing except as required by applicable law and stated in ToS.

---

## 4. What public copy must not claim

| Prohibited in legal / marketing | Use instead |
|---------------------------------|-------------|
| Immunity, armor, escape | Limitation of liability, observation boundary |
| Supra-state / above law | Compliance-oriented, jurisdiction-specific |
| “Truth guaranteed by AI” | Narrative is non-binding; execution is seal-gated |
| Hidden data deletion | Append-only audit policy with lawful retention rules |

---

## 5. Ingress (site entry)

First visit to production web property (`rhizoh.com` or successor) **should** present:

1. Calm legal preamble (manifesto checksum spine — [`MANIFESTO_DISTRIBUTION_PACK_V0.1.md`](MANIFESTO_DISTRIBUTION_PACK_V0.1.md) §0–§2 tone)
2. Links to full ToS + Privacy/KVKK
3. Explicit ack: narrative non-binding · audit log exists · sovereign node liability

Implementation: `apps/client/src/rhizoh/ingress/ingress_router.js` · env `VITE_RHIZOH_LEGAL_PREAMBLE=1`.

**Closed cohort (Phase 0 legal-lite):** memory, erase/unlink, AI Act sketch, invite consent — [`legal/PHASE0_MEMORY_ERASURE_USER_FACING_V0.1.md`](legal/PHASE0_MEMORY_ERASURE_USER_FACING_V0.1.md). Ops runbook: [`ops/PHASE2_CONTROLLED_REALITY_TEST_V1.0.md`](ops/PHASE2_CONTROLLED_REALITY_TEST_V1.0.md).

---

## 6. Infrastructure (non-code)

DNS / edge hardening runbook: [`INFRASTRUCTURE_DNS_HARDENING_V0.1.md`](INFRASTRUCTURE_DNS_HARDENING_V0.1.md).

---

## 7. Spec seal (SHA-256)

Seal this file on `main` after legal review. Record digest in SESSION_LOG and boot ledger reference field `legal_reality_spec_sha256`.

```bash
node scripts/seal-legal-reality-spec.mjs
```

**Placeholder until sealed on main:** run script locally; paste output below.

| Field | Value |
|-------|--------|
| `legal_reality_spec_sha256` | `5dbeb7ee93e8b3ff40be73d569f93c9cec73eee37a7a3535205d87883a885972` |
| Spec version | v0.1 |
| Related pack | `MANIFESTO_DISTRIBUTION_PACK_V0.1` |

---

## Related

| Doc | Role |
|-----|------|
| [`legal/RHIZOH_TERMS_OF_SERVICE_TR_V0.1.md`](legal/RHIZOH_TERMS_OF_SERVICE_TR_V0.1.md) | Public ToS (TR) |
| [`legal/RHIZOH_PRIVACY_KVKK_TR_V0.1.md`](legal/RHIZOH_PRIVACY_KVKK_TR_V0.1.md) | Privacy + KVKK (TR) |
| [`RHIZOH_OPERATIONAL_CONSTITUTION_V1.md`](RHIZOH_OPERATIONAL_CONSTITUTION_V1.md) | Execution law |
| [`MANIFESTO_DISTRIBUTION_PACK_V0.1.md`](MANIFESTO_DISTRIBUTION_PACK_V0.1.md) | Ingress tone checksum |

---

*Legal spec describes reality boundaries — it does not grant execution authority.*
