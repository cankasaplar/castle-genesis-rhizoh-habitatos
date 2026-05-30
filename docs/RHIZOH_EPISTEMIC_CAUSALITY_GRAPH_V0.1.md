# Rhizoh epistemic causality graph v0.1

**SPECFLOW:** `RESEARCH-ONLY` — explicit why-over-time; no execution authority

**Gap closed:** identity + drift + reproducibility describe *that* the system changed; causality graph describes *why* (structured, queryable).

## Graph model

| Node kind | Example id | Meaning |
|-----------|------------|---------|
| `tick` | `tick:4` | Ledger tick snapshot |
| `divergence_flag` | `flag:4:boundary_diverged` | Detected divergence signal |
| `layer` | `layer:boundary` | Playbook / boundary / synthesis plane |
| `bundle` | `bundle:repro_bundle_…` | Audit reproducibility fingerprint |
| `identity` | `identity:subject_drift` | Continuity verdict |

| Edge kind | Meaning |
|-----------|---------|
| `sequential` | Tick n → tick n+1 |
| `caused` | Flag / layer → tick effect |
| `escalated` | State rank increase coupling |
| `contributed` | Layer → flag, bundle → tick |

## APIs

`apps/client/src/rhizoh/runtime/epistemicCausalityGraphV0.js`

| Function | Role |
|----------|------|
| `buildEpistemicCausalityGraphV0()` | Full node + edge graph |
| `explainTickStateChangeV0(tickSeq)` | Primary causes for one transition |
| `traceCausalPathV0(from, to)` | BFS path |
| `evaluateEpistemicCausalityV0()` | Report + `dominantWhy` + top cause histogram |

Refreshes after `evaluateEpistemicIdentityContinuityV0`.

## Captain

```javascript
const report = window.__rhizoh.epistemicCausality.evaluate();
report.dominantWhy;
window.__rhizoh.epistemicCausality.explainTick(3);
window.__rhizoh.epistemicCausality.export();
```

## Related

- Counterfactual alternates: [`RHIZOH_EPISTEMIC_COUNTERFACTUAL_GRAPH_V0.1.md`](RHIZOH_EPISTEMIC_COUNTERFACTUAL_GRAPH_V0.1.md)
- [`RHIZOH_EPISTEMIC_IDENTITY_CONTINUITY_V0.1.md`](RHIZOH_EPISTEMIC_IDENTITY_CONTINUITY_V0.1.md)
- [`RHIZOH_EPISTEMIC_TICK_LEDGER_V0.1.md`](RHIZOH_EPISTEMIC_TICK_LEDGER_V0.1.md)
