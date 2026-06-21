# Rhizoh: A Persistent Event-Sourced AI World with Epistemic Identity and Causal Continuity

**Version:** 1.0-draft  
**Date:** 2026-06-19  
**Authors:** Can Kasaplar (founder) · Rhizoh research prototype  
**Tag:** `RESEARCH-ONLY` · architecture / position preprint — not peer-reviewed  
**License:** TBD before arXiv upload

**Public surfaces:** https://rhizoh.com/.well-known/rhizoh-identity.json · https://rhizoh.com/rhizoh/system-overview.md

---

## Abstract

Generative AI systems often collapse observation, inference, and state mutation into a single opaque chain. We describe **Rhizoh**, a research prototype of a **persistent event-sourced world** that enforces an explicit **observation–execution boundary** (`Observation ≠ Execution`). World state is derived from append-only event history; companions and LLM ingress produce non-executive interpretation. We introduce an **epistemic identity** layer that derives `epi_id_*` handles and continuity verdicts (`same_subject`, `subject_drift`, `subject_fork`) from audit-bundle fingerprints, ledger identity hashes, and tick-graph digests — as **read-only projections**, not narrative self-claims. A frozen execution subgraph (v562–v570) provides immutable infrastructure; upper layers (causal graph, observer invites, spatial projection) evolve without silent authority creep. The system is in **legal-hold / invite-only** deployment: data-plane activation is gated, mutation access is false, and public surfaces publish bootstrap identity declarations rather than live SSOT. **Contribution:** a testable architecture for separating observation from execution in persistent AI worlds, plus an honest Phase 1 boundary between **identity projection** (shipped) and **identity evolution** (deferred). We do not claim solved alignment, AGI, or production-scale evaluation.

**Keywords:** event sourcing, epistemic identity, causal continuity, observation–execution separation, persistent AI worlds, audit bundles

---

## 1. Introduction

### 1.1 Problem

Modern agentic stacks frequently implement:

```
observe → decide → act
```

as a single pipeline where LLM output can influence state, permissions, and user belief without a verifiable membrane. Persistent worlds compound this risk: narrative drift becomes state drift.

### 1.2 Research questions

1. Can a persistent AI world **publish auditable claims about its own continuity** without granting observers execution authority?
2. Can **epistemic identity** be derived from causal/event history rather than from model self-description?
3. What architectural invariants are required to keep **interpretation** from becoming **mutation**?

### 1.3 Rhizoh's answer (modest)

Rhizoh reframes the public spine as:

```
observe ≠ execute
```

and backs it with event-sourced persistence, authority ledgering, invite-only observation, and derived `epi_id_*` projections.

### 1.4 What we do not claim

- Superhuman intelligence or solved alignment
- Nature/NeurIPS-grade empirical evaluation (early prototype stage)
- That `epi_id_*` is ontological identity — it is an observability handle

---

## 2. Related work (sketch)

| Area | Rhizoh contrast |
|------|-----------------|
| Event sourcing / CQRS | Append-only traces; emphasis on **membrane** to UI/LLM |
| LLM agents / tool use | Tools and companions: `executive: false` |
| Digital twins / GIS | Map as observation anchor, not twin authority |
| Provenance / audit logs | Audit **bundles** + reproducibility fingerprints |
| Philosophy of AI agency | Observation–execution separation as **enforced** architecture |

Full related-work section deferred to camera-ready; this preprint is architecture-first.

---

## 3. System overview

### 3.1 Layers

| Layer | Role |
|-------|------|
| Observer ingress | Invite-only, read-only perception lenses |
| Perception shell | UI projection of verified state |
| Causal graph (ECG) | Why-over-time structure |
| Epistemic tick + ledger | Cross-tick identity and divergence |
| Event-sourced persistence | Codex, replay, seals |
| Authority ledger | Admission, epoch, replay alignment |
| Frozen execution subgraph | v562–v570 deterministic core |

### 3.2 Deployment truth (2026-06)

- **Legal hold** · **mutation_access: false**
- Data-plane intentionally off until activation READY
- Public JSON at `/.well-known/rhizoh-identity.json`

---

## 4. Observation ≠ Execution

**Principle:** Agents (human, LLM, external feeds) may influence **interpretation**, never **execution**.

Enforcement sketch:

- LLM gateway: non-authoritative for WAL/sealed state
- Invite flow: `interpretationOnly: true`, no `appendIdentityEventV0`
- Identity manifest: `influencesExecution: false`
- Operational constitution: Time / Data / Perception integrity

**Paper hook:** *Separating Observation from Execution in Persistent AI Worlds* — suitable as standalone position paper.

---

## 5. Epistemic identity

### 5.1 Generation

`epi_id_<12hex>` derived from `rootDigest` over reproducibility fingerprint chain.

Bootstrap reference: `epi_id_b1db96a3` (documented first audit capture).

### 5.2 Continuity verdicts

| Verdict | Meaning |
|---------|---------|
| `same_subject` | Stable repro window |
| `subject_drift` | Evolution under stable law |
| `subject_fork` | Discontinuity / law flip |

### 5.3 Identity projection vs evolution (Phase 1 honesty)

**Active:** world → causal graph → epistemic identity (derive)  
**Deferred:** user interaction → identity event log → continuity (mutate)

Manifest may report `eventPipelineWired: false` — this is a **documented phase boundary**, not a hidden defect.

See: [`RHIZOH_EPISTEMIC_IDENTITY_SPEC.md`](../RHIZOH_EPISTEMIC_IDENTITY_SPEC.md)

---

## 6. Causal continuity

Public causal snapshot (aggregate only):

```json
{
  "nodes": 72,
  "edges": 48,
  "compression": true,
  "truth_loss": 0,
  "identity_hash": "h9d347606"
}
```

Full `causalMapRaw` is not published. Identity manifest summarizes node kinds (domain transitions, tensor decisions, spatial projections).

---

## 7. Invitation research program

Closed cohorts (explorers, researchers, signal observers) enter via opaque invite tokens. Metrics: first-session duration, return rate, map interactions, castle placement attempts, chat turns — anonymized.

Spec: [`RHIZOH_INVITATION_STUDY_V0.md`](../RHIZOH_INVITATION_STUDY_V0.md)

---

## 8. Limitations

1. Prototype scale — not production user load
2. No centralized IRB-backed study yet
3. Identity event pipeline not activated (Phase 1)
4. WebSocket gateway fallback paths — boundary validation ongoing
5. Academic jargon drift risk — mitigated by CI specflow + honest baseline charter

---

## 9. Conclusion

Rhizoh demonstrates a transition from "does the simulation run?" to "what **auditable claims** can the system make about itself?" The first public identity surfaces (`rhizoh-identity.json`, protocol docs, this preprint) are intentionally **interpretation-only**. Next artifacts: invitation study dataset, causal continuity evaluation, identity evolution Phase 2 spec.

---

## References (placeholder)

1. Rhizoh Honest Baseline Charter v1 — `docs/RHIZOH_HONEST_BASELINE_CHARTER_V1.md`
2. Rhizoh Protocol v0 — `docs/RHIZOH_PROTOCOL_V0.md`
3. Epistemic Identity Continuity v0.1 — `docs/RHIZOH_EPISTEMIC_IDENTITY_CONTINUITY_V0.1.md`
4. Observation Fabric v1 — `docs/OBSERVATION_FABRIC_V1.md`

---

## Appendix A — Public artifact index

| Artifact | URL |
|----------|-----|
| Identity JSON | https://rhizoh.com/.well-known/rhizoh-identity.json |
| Causal snapshot | https://rhizoh.com/.well-known/rhizoh-causal-snapshot.json |
| System overview | https://rhizoh.com/rhizoh/system-overview.md |
| Protocol v0 | https://rhizoh.com/rhizoh/protocol-v0.md |
| Epistemic identity spec | https://rhizoh.com/rhizoh/epistemic-identity-spec.md |
| Honest baseline (abridged) | https://rhizoh.com/rhizoh/honest-baseline-charter-v1.md |

---

*Export PDF:* `npm run academic:export-preprint-v0` (requires pandoc)
