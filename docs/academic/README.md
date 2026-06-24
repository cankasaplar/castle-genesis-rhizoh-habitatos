# Rhizoh Academic Preprint — v0.1

**Tag:** `RESEARCH-ONLY`  
**Status:** Publishable preprint artifact (GitHub Release + PDF)

---

## What this is

Rhizoh v0.1 is a **systems research preprint** describing an event-sourced **authority arbitration engine** for distributed reality construction:

- Client = **Reality Simulator** (proposal, preview, simulation lanes)
- Gateway = **Reality Finalizer** (single-writer commit via `gateway_ack`)
- Divergence is **first-class** — detected, logged, reconciled (not hidden)

This is **not** a product announcement, game release, or daily-life OS claim.

---

## Artifacts

| File | Description |
|------|-------------|
| [`RHIZOH_DISTRIBUTED_REALITY_CONSTRUCTION_PAPER_V0.1.md`](RHIZOH_DISTRIBUTED_REALITY_CONSTRUCTION_PAPER_V0.1.md) | Source paper (Markdown) |
| [`preprint/paper-v0.1.pdf`](preprint/paper-v0.1.pdf) | PDF export (generate with `npm run academic:export-preprint`) |
| [`figures/architecture.png`](figures/architecture.png) | Figure 1 — architecture |
| [`figures/authority-state-machine.png`](figures/authority-state-machine.png) | Figure 2 — formal state machine |
| [`references.bib`](references.bib) | Bibliography (12 citations) |
| [`../REPRODUCIBILITY.md`](../REPRODUCIBILITY.md) | Reproduction instructions |
| [`GITHUB_RELEASE_CHECKLIST_V0.1.md`](GITHUB_RELEASE_CHECKLIST_V0.1.md) | Release steps |
| [`RHIZOH_PRODUCTIZATION_PHASE_GATE_V0.1.md`](RHIZOH_PRODUCTIZATION_PHASE_GATE_V0.1.md) | Honest product gaps |

---

## Read the paper (canonical)

**Latest source (2026-06-24):** [`RHIZOH_DISTRIBUTED_REALITY_CONSTRUCTION_PAPER_V0.1.md`](RHIZOH_DISTRIBUTED_REALITY_CONSTRUCTION_PAPER_V0.1.md)

**Public PDF:** `/rhizoh/academic/paper-v0.1.pdf` (regenerate: `npm run academic:export-preprint-v0.1`)

**Title:** *Rhizoh: Event-Sourced Authority Arbitration for Reconciliation-Based Distributed Reality Construction*

**What's new in v0.1 sync:** Life OS v0.1 closure (World Bridge observation layer), habitat climate, academy learning union, honest `legal_activation_hold` on spatial.

---

```bash
npm run academic:reproduce-paper
```

Browser (live client):

```javascript
await window.__rhizoh.matchmaking.verifyProduction({ reset: true })
```

---

## Contribution summary (one paragraph)

Rhizoh demonstrates that multiplayer-style state can be engineered as an **append-only truth kernel** with explicit **proposal–preview–commit** separation, **derived commit authority** (client never owns commit), and **reconciliation-tolerant** simulation lanes. Verification harnesses prove deterministic replay and single-writer boundaries. Network fan-out and world routing remain future work (Phase A).

---

## Publication channels

| Channel | Status | Action |
|---------|--------|--------|
| GitHub Release `v0.1-preprint` | Ready | See release checklist |
| Zenodo DOI | Optional | Upload release assets |
| arXiv cs.DC / cs.SE | v0.2 | Add affiliation + LaTeX pass |

---

## Related docs

- [`OUTREACH_ACADEMIC_PAPER_PACK_V0.1.md`](../OUTREACH_ACADEMIC_PAPER_PACK_V0.1.md) — outreach framing guardrails
- [`RHIZOH_MATCH_COMMIT_AUTHORITY_ROADMAP_V1.md`](../RHIZOH_MATCH_COMMIT_AUTHORITY_ROADMAP_V1.md) — authority engineering roadmap
- [`RHIZOH_NETWORK_COMPLETION_ROADMAP_V1.md`](../RHIZOH_NETWORK_COMPLETION_ROADMAP_V1.md) — P0 broadcast / world router

---

*RESEARCH-ONLY — does not extend execution authority.*
