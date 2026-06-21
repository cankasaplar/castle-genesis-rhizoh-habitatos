# Non-Agentic Identity Continuity in Interactive Causal Graph Systems

**Subtitle:** Rhizoh — a read-only epistemic identity projection in event-sourced simulation  
**Version:** 1.1-draft  
**Date:** 2026-06-21  
**Authors:** Can Kasaplar (founder) · Rhizoh research prototype  
**Tag:** `RESEARCH-ONLY` · position / architecture preprint — not peer-reviewed

**Novelty claim:** *Identity emerges without agency, only via causal continuity constraints.*

**Public surfaces:** https://rhizoh.com/.well-known/rhizoh-identity.json

---

## Abstract

Agent-based AI stacks bind users as decision-makers: `agent → action → environment → memory`. We describe **Rhizoh**, an event-sourced interactive world where identity follows a different spine: `environment → causal graph → identity projection → observation continuity`. There is **no agent role** for the invited human: **no mutation authority**, only **validated observer nodes** in a co-observational epistemic field. System identity (`epi_id_*`) is a **read-only projection** from audit-bundle fingerprints and ledger/tick digests — not narrative self-description. Humans contribute **echo traces** (surface paths, coherence alignment, return vectors) that are explicitly **not memory** and **not identity SSOT**. We formalize an **ontology translation layer** mapping three epistemic coordinate systems — spatial causality (map), temporal reasoning (chess), narrative coherence (castle) — and an **ontological gate assertion** at invite ingress. Phase 1 honestly defers **identity evolution** (user → identity event log) while shipping **identity projection**. We bridge distributed systems (event sourcing, deterministic replay) with philosophy-of-mind framing (extended mind, observer-relative identity) without claiming solved alignment or AGI.

**Keywords:** non-agentic identity, causal graph, event sourcing, observation–execution separation, epistemic identity, validated observer node

---

## Section 1 — Problem

Agent-based AI ≠ stable identity systems.

Modern stacks collapse:

```
observe → decide → act → remember
```

Persistent worlds suffer **narrative → state creep**. Users are modeled as agents even when the research question is **continuity under observation**, not tool execution.

**Core diagnosis:** Rhizoh knows itself as a system (`epi_id_*`) but did not model humans as **non-agent participants** in the field — strong identity, weak sense-making.

---

## Section 2 — Model

**Event-sourced causal graphs** as the spine:

- Append-only persistence · seals · replay
- Causal map (ECG) as why-over-time structure
- Authority ledger — admission without observer execution

```
environment → causal graph → identity projection → observation continuity
```

---

## Section 3 — Non-agentic identity

Identity is **not** decreed by an LLM. It is **derived**:

- `epi_id_<hex>` from reproducibility fingerprint chain
- Verdicts: `same_subject` | `subject_drift` | `subject_fork`
- Manifest: `continuityVerdict: read_only_projection`

**Phase boundary (honest):**

| Shipped | Deferred |
|---------|----------|
| Identity **projection** | Identity **evolution** |
| world → graph → epi_id | user → identity event log |

---

## Section 4 — Observer role

**Rejected:** external entropy only (`user → noise → graph`) — stable but meaningless UX.

**Chosen:** **validated observer node**

```
user → observer node → causal graph influence (non-executive)
```

- In graph: yes (trace, cohort, surfaces)
- Agent: no
- Executive: no

Co-observational epistemic field: Rhizoh + observer jointly constitute the **interpretation** layer; only the system holds sealed continuity.

---

## Section 5 — Implementation (Rhizoh prototype)

| Artifact | Function |
|----------|----------|
| `.well-known/rhizoh-identity.json` | Public bootstrap identity declaration |
| Meaning layer | Ontology translation (3 coordinate systems) |
| Why am I here | Ontological gate assertion |
| `visitorEpistemicTraceV0` | Echo trace — not memory |
| `epistemicSeparationProofV0` | Paper evidence bundle — observation ≠ execution |
| `narrativeProjectionEngineV0` | Observer trace → semantic lookup → read-only narrative |
| `epistemicResonanceFieldV0` | **Measurement only** — resonance coefficient without system modulation |
| `meaningResonanceLedgerV0` | Plane D — co-occurrence ledger (NOT graph, NOT learning) |
| `narrativeBridgeV0` | Weak causal proposal → four-axiom gate → ledger record |
| `invitationStudyExportV0` | Anonymized cohort record export |
| Frozen v562–v570 | Immutable execution subgraph |
| Legal hold | `mutation_access: false` |

**Separation proof (enforced):** `npm run academic:export-separation-proof-v0` · `ops:validate-observer-trace-boundary-v0`

---

## Section 6 — Results (early / invitation study)

Prototype evidence (pre-cohort N):

- Stable `epi_id_*` under audit bundle repro
- Reproducible causal graph summaries
- Observer echo trace: `coherence_alignment`, `return_vector`
- Narrative decoupled from causal truth (`semanticCoupling: false`)
- Resonance measured without coupling (`measurementOnly: true`)
- Meaning ledger records interpretation trace only (`learns: false`, `influencesCausalGraph: false`)

**Invitation study metrics** (see `RHIZOH_INVITATION_STUDY_V0.md`): `window.__rhizoh.invitationStudy.export()` — anonymized.

---

## Section 7 — Implications

**Philosophy of mind:** observer-relative identity without granting agency — resonates with extended mind / distributed cognition literature (careful: Rhizoh does not claim consciousness).

**Distributed systems:** event sourcing + read-only projection layer as an alternative to agent memory for **world continuity**.

**HCI:** contract injection at boot — "You are not interacting with an agent" — as architectural UX, not marketing.

---

## What we do not claim

- AGI, alignment solved, or Nature/NeurIPS-grade N
- `epi_id_*` as legal/personal identity
- Visitor trace as user memory

---

## References (placeholder)

- Rhizoh Observer Node Spec · Epistemic Identity Spec · Honest Baseline Charter
- Clark & Chalmers (1998) — extended mind (interpretive lens only)
- Event sourcing / CQRS literature

---

*Export:* `npm run academic:export-paper` · `npm run academic:export-separation-proof-v0`
