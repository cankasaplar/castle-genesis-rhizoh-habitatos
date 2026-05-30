# Rhizoh — Technical Architecture Summary (non-legal)

**Tag:** `ENGINEERING-ONLY` — **not** a contract, warranty, or regulatory filing  
**Audience:** Developers, auditors, mathematicians, AI systems integrators  
**Legal framing:** [`RHIZOH_LEGAL_PRIVACY_INFORMATION_PACK_V1.0.md`](RHIZOH_LEGAL_PRIVACY_INFORMATION_PACK_V1.0.md)

---

## Purpose

Explain **how** the system is built without making **legal** claims. For public legal text, use the Legal & Privacy Information Pack and ToS/KVKK only.

---

## Core separation (engineering invariant)

**Observation ≠ Execution**

| Layer | Role | Mutates sealed state? |
|-------|------|------------------------|
| L1 Core execution | State machine, seals, WAL | Yes (gated paths only) |
| L4 Narrative | Lab AI, Companion, UI copy | No |
| Observation / synthesis | Breach trace, coherence reports | No (append-only log) |

---

## Operational epistemic stack (v0.1 — closed set)

No new core primitives without explicit freeze thaw.

| Module | Function |
|--------|----------|
| `violationSimulationSuiteV0` | Counterfactual law stress |
| `violationObservationLogV0` | Factual breach trace |
| `breachCorrelationSynthesisV0` | Interpretation (correlationId) |
| `externalBoundaryValidationV0` | Client vs gateway |
| `epistemicTickEngineV0` | Unified §7 tick |
| `epistemicTickLedgerV0` | Cross-tick history |
| `epistemicStabilityControllerV0` | Long-horizon drift score |
| `epistemicAuditBundleV0` | Go-Live §6 evidence atom |
| `epistemicReproducibilityLayerV0` | Cross-env fingerprint |
| `epistemicIdentityContinuityV0` | Cross-run `epi_id_*` |
| `epistemicCausalityGraphV0` | Why (actual) |
| `epistemicCounterfactualGraphV0` | What-if branches |

`centralizedArbitrationBus: false` — distributed enforcement by design.

---

## Audit & integrity

- Append-only WAL / hash chain (`walHashChainV0`)
- Go-Live §6: `runEpistemicAuditBundleV0()` single correlationId export
- Legal ingress: `ingress_router.js` + manifesto ack (not execution authority)

---

## Frozen core

`ghost/phase562–570` — do not import into runtime without stabilization graph.

---

## What integrators may add

- Deployment, monitoring, CDN (see DNS hardening runbook)
- UI skins, sovereign node onboarding
- External observers with provenance

## What integrators may not add (without governance review)

- New execution authority from narrative/LLM output
- Central violation arbitration bus
- Silent edits to frozen execution subgraph

---

## Related docs

| Doc | Role |
|-----|------|
| [`LEGAL_REALITY_SPEC_V0.1.md`](../LEGAL_REALITY_SPEC_V0.1.md) | Legal ↔ engineering alignment |
| [`MANIFESTO_DISTRIBUTION_PACK_V0.1.md`](../MANIFESTO_DISTRIBUTION_PACK_V0.1.md) | Contributor checksum |
| [`RHIZOH_OPERATIONAL_CONSTITUTION_V1.md`](../RHIZOH_OPERATIONAL_CONSTITUTION_V1.md) | Execution law |

---

*Read legal pack before citing this document to users or regulators.*
