# Rhizoh — System Overview

**Status:** Public reference (v0.1) · `RESEARCH-ONLY`  
**Audience:** Humans, LLMs, invited observers  
**Spine:** Observation ≠ Execution

**Machine-readable identity:** https://rhizoh.com/.well-known/rhizoh-identity.json  
**Causal snapshot (summary):** https://rhizoh.com/.well-known/rhizoh-causal-snapshot.json  
**Protocol:** [RHIZOH_PROTOCOL_V0.md](./RHIZOH_PROTOCOL_V0.md)

---

## What is Rhizoh?

Rhizoh is a **persistent AI world** built as a **continuity protocol**, not a single-vendor chat wrapper.

It combines:

- An **event-sourced** world model (replay, seals, audit bundles)
- A **causal graph** (why things happened over time)
- An **observer layer** (read-only perception for invited guests)
- An **epistemic identity** handle (`epi_id_*`) derived from causal continuity — an observability projection, not a marketing persona

Rhizoh is in **legal hold / controlled observation** phase: selected guests may explore; execution authority and public data-plane activation remain gated.

---

## What Rhizoh is not

| Misread | Fact |
|---------|------|
| Public launch / open beta | Invite-only controlled observation |
| Autonomous agent with execution power | Observers influence interpretation, **never** execution |
| Startup demo or hype deck | Infrastructure + epistemic modeling environment |
| Guaranteed-stable `epi_id` in marketing copy | `epi_id_*` is a **derived handle** from audit stack; bootstrap reference is documented, live value may evolve |
| Full causal graph dump | Public surface publishes **summary** only (node/edge counts, compression, identity hash) |

---

## Observer Layer

The observer layer is the primary surface for invited guests today.

- **Routes:** `/invite?invite=rhizoh_inv_…` → short legal/expectation framing → chat + optional world map
- **Modes (perception lens):** explorer · research · signal — same system, different epistemic framing
- **Invariants:** `interpretationOnly: true` · `readOnly: true` · no identity event pipeline mutation from invite flow

Observers may explore map topology, causal summaries (mode-dependent), and conversation — without gaining WAL write authority or execution gates.

---

## World Layer

The world layer includes map projection, towers, chess cluster, spatial slots, and event-sourced simulation persistence.

- World state is **derived from event history**, not ad-hoc UI fiction
- Spatial projection (Cesium, pins, castles) is **optional** and user-initiated
- Mock vs real boundaries are documented in ops SSOT; production ingress stays honest about what is live vs scaffold

---

## Epistemic Identity

Rhizoh exposes a derived identity manifest:

```
ECG (causalMap) ──read──► identityManifest.project()
                              │
epi_id_* (optional) ──────────┘
```

**Bootstrap reference** (first documented capture):

- `epi_id_b1db96a3`
- `continuityVerdict`: `read_only_projection`
- `epistemicVerdict`: `same_subject` (when continuity stack agrees)

Runtime API (browser, invited session):

```javascript
window.__rhizoh.identityManifest.project()
```

This is **not** ontological truth — it is a read-only projection for audit and external explanation.

---

## Legal Hold Status

| Track | Status |
|-------|--------|
| Perception / UI framing | Frozen (regression-only) |
| Activation | Readiness checklist + manual READY/HOLD |
| Data-plane | Off until signed READY |
| Public launch | No |
| Observer access | Invite-only |

**Status field in public JSON:** `legal_hold` · `mutation_access: false`

---

## Research Direction

Rhizoh research threads (non-exhaustive):

1. **Epistemic tick engine** — cross-tick ledger, divergence, replay export
2. **Authority graph** — ledgered admission; observation ≠ execution firewall
3. **Identity continuity** — fingerprint chains, reproducibility layer
4. **Controlled real signal** — Phase 1 spec only; ingestion closed until READY
5. **Formal boundary** — constraint closure, TLA sketch track, RCMM measurement map

Academic and collaboration habitat: `docs/SPRINT_HABITAT_ACADEMIC.md`

---

## Related documents

| Doc | Purpose |
|-----|---------|
| [RHIZOH_PROTOCOL_V0.md](./RHIZOH_PROTOCOL_V0.md) | Protocol principles |
| [RHIZOH_EPISTEMIC_IDENTITY_SPEC.md](./RHIZOH_EPISTEMIC_IDENTITY_SPEC.md) | Epistemic identity specification |
| [RHIZOH_INVITATION_STUDY_V0.md](./RHIZOH_INVITATION_STUDY_V0.md) | Invitation research dataset |
| [academic/RHIZOH_RESEARCH_PREPRINT_V1.md](./academic/RHIZOH_RESEARCH_PREPRINT_V1.md) | Architecture preprint draft |
| [RHIZOH_IDENTITY_MANIFEST_V0.md](./RHIZOH_IDENTITY_MANIFEST_V0.md) | Identity projection spec |
| [RHIZOH_HONEST_BASELINE_CHARTER_V1.md](./RHIZOH_HONEST_BASELINE_CHARTER_V1.md) | Constitutional culture |
| [RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md](./RHIZOH_PHASE_GATE_OPERATING_MODE_V1.0.md) | Ops truth (activation) |

---

*Observation ≠ Execution — Rhizoh*
