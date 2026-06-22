# GitHub Release Checklist — Paper v0.1 Preprint

**Tag:** `RESEARCH-ONLY`  
**Release tag:** `v0.1-preprint`

---

## Pre-release (automated)

```bash
npm install
npm run academic:reproduce-paper
npm run academic:export-preprint
```

Verify outputs exist:

- [ ] `docs/academic/preprint/paper-v0.1.pdf`
- [ ] `docs/academic/preprint/figures/architecture.png`
- [ ] `docs/academic/preprint/figures/authority-state-machine.png`
- [ ] `REPRODUCIBILITY.md`
- [ ] `docs/academic/README.md`

---

## Release assets

Upload to GitHub Release `v0.1-preprint`:

| Asset | Source path |
|-------|-------------|
| `paper-v0.1.pdf` | `docs/academic/preprint/paper-v0.1.pdf` |
| `paper-v0.1.md` | `docs/academic/preprint/paper-v0.1.md` |
| `architecture.png` | `docs/academic/figures/architecture.png` |
| `authority-state-machine.png` | `docs/academic/figures/authority-state-machine.png` |
| `REPRODUCIBILITY.md` | `REPRODUCIBILITY.md` |
| `references.bib` | `docs/academic/references.bib` |

---

## Release title and description

**Title:** `v0.1-preprint — Event-Sourced Authority Arbitration (Rhizoh)`

**Description template:**

```markdown
## Rhizoh Paper v0.1 Preprint

**Rhizoh: Event-Sourced Authority Arbitration for Reconciliation-Based Distributed Reality Construction**

Research preprint describing an event-sourced truth kernel with explicit proposal–preview–commit separation and single-writer server finalization.

### Claims (harness-verified)
- Deterministic replay: `produced state === replayed state`
- Client never holds commit authority
- Drift detection + reconciliation recovery

### Not claimed
- Production multiplayer fan-out (Phase A in progress)
- Daily-life OS / media / community layers

### Reproduce
```bash
git checkout v0.1-preprint
npm run academic:reproduce-paper
```

Browser: `await window.__rhizoh.matchmaking.verifyProduction({ reset: true })`

See REPRODUCIBILITY.md in this release.
```

---

## Post-release

- [ ] Add preprint link to root `README.md` (Academic section)
- [ ] Optional: Zenodo upload → obtain DOI → update `REPRODUCIBILITY.md` bibtex
- [ ] Optional: arXiv submission (cs.DC) with affiliation + LaTeX conversion

---

## Zenodo (optional)

1. Create Zenodo account / link GitHub
2. Upload release ZIP or individual PDF
3. Metadata: Computer Science → Distributed Systems
4. Add DOI to citation block in `REPRODUCIBILITY.md`

---

*RESEARCH-ONLY — release is an artifact, not an activation gate.*
