# Rhizoh Research Artifact Roadmap v0

**Date:** 2026-06-19  
**Tag:** `RESEARCH-ONLY`  
**Strategy:** Artifact production over feature sprawl (frozen core untouched)

---

## Thesis

Rhizoh's primary risk is no longer "does it run?" but **"can outsiders understand what they are looking at?"**  
Narrative must be **separable from code** — via public manifests, protocol docs, and honest phase boundaries.

---

## Completed artifacts

| # | Artifact | Docs | Public URL |
|---|----------|------|------------|
| 1 | Identity Manifest | `RHIZOH_IDENTITY_MANIFEST_V0.md` | `/.well-known/rhizoh-identity.json` |
| 2 | Protocol v0 | `RHIZOH_PROTOCOL_V0.md` | `/rhizoh/protocol-v0.md` |
| 3 | System Overview | `RHIZOH_SYSTEM_OVERVIEW.md` | `/rhizoh/system-overview.md` |
| 4 | Causal snapshot | — | `/.well-known/rhizoh-causal-snapshot.json` |
| 5 | Epistemic Identity Spec | `RHIZOH_EPISTEMIC_IDENTITY_SPEC.md` | `/rhizoh/epistemic-identity-spec.md` |
| 6 | Honest Baseline (abridged) | `RHIZOH_HONEST_BASELINE_CHARTER_V1.md` | `/rhizoh/honest-baseline-charter-v1.md` |
| 7 | Research Preprint v1 (draft) | `academic/RHIZOH_RESEARCH_PREPRINT_V1.md` | export via `npm run academic:export-preprint-v0` |
| 8 | Invitation Study spec | `RHIZOH_INVITATION_STUDY_V0.md` | docs-only (ops) |

---

## Phase 1 honesty (publish now)

| Claim | Status |
|-------|--------|
| Identity **projection** | Shipped (`identityManifest.project()`) |
| Identity **evolution** (event log from user paths) | Deferred — `eventPipelineWired: false` |
| Public launch | No — `legal_hold` |
| `epi_id_*` | Derived handle — not ontological SSOT |

---

## Next three artifacts (recommended order)

1. **Invitation study dataset** — collect N≥15 anonymized sessions per `RHIZOH_INVITATION_STUDY_V0.md`
2. **Causal continuity short paper** — RQ: same subject across sessions
3. **Position paper:** *Separating Observation from Execution in Persistent AI Worlds*

---

## Publication tiers (realistic)

| Tier | Fit today |
|------|-----------|
| arXiv preprint (architecture) | Yes — draft exists |
| Workshop / position paper | Yes — after invite cohort notes |
| NeurIPS / Nature | No — early; needs evaluation + ethics |

---

## Validation

```bash
npm run ops:validate-public-identity-v0
npm run academic:export-preprint-v0   # optional PDF
```

---

## Related

- [`SPRINT_HABITAT_ACADEMIC.md`](../SPRINT_HABITAT_ACADEMIC.md)
- [`OUTREACH_ACADEMIC_PAPER_PACK_V0.1.md`](../OUTREACH_ACADEMIC_PAPER_PACK_V0.1.md)
- [`SESSION_LOG.md`](SESSION_LOG.md)
