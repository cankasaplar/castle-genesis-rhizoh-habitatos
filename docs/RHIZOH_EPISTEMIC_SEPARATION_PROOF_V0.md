# Rhizoh Epistemic Separation Proof v0

**Status:** DRAFT · `RESEARCH-ONLY` · paper evidence bundle

---

## Purpose

Formalize **observation ≠ execution ≠ causal write** for academic claims.

---

## Browser API

```javascript
window.__rhizoh.epistemicSeparationProof.build();
window.__rhizoh.epistemicSeparationProof.exportJson();
```

## CI export

```bash
npm run academic:export-separation-proof-v0
```

Writes `docs/exports/academic/epistemic_separation_proof_v0.json` after boundary validation.

---

## Paper spine (enforced claims)

1. Narrative generation is decoupled from causal truth  
2. Observer does not induce system state change, only projection bias  
3. Non-agentic system — observer traces → read-only narrative only  

---

## Enforce means

| Layer | Mechanism |
|-------|-----------|
| Spec | This doc + preprint |
| Code | `influencesCausalGraph: false`, `memory: false`, `isVertex: false` |
| CI | `ops:validate-observer-trace-boundary-v0` |

---

## Related

- [`RHIZOH_READ_ONLY_HOOK_V0.md`](RHIZOH_READ_ONLY_HOOK_V0.md)
- [`RHIZOH_NARRATIVE_PROJECTION_ENGINE_V0.md`](RHIZOH_NARRATIVE_PROJECTION_ENGINE_V0.md)
- [`RHIZOH_MEANING_RESONANCE_LEDGER_V0.md`](RHIZOH_MEANING_RESONANCE_LEDGER_V0.md)
