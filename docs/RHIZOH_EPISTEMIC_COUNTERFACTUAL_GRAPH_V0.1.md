# Rhizoh epistemic counterfactual graph v0.1

**SPECFLOW:** `RESEARCH-ONLY` — alternate branches; **not** execution or replay proof

**Causality** answers *what caused what (actual)*.  
**Counterfactual** answers *what could have caused differently?*

## Model

For each **hot tick** (divergence flags or non-`LIVE_OK`):

| Branch | Intervention | Question |
|--------|--------------|----------|
| Per flag | Negate one cause (e.g. `boundary_aligned`) | Layer-specific what-if |
| `minimal_fix` | Smallest joint fix toward `LIVE_OK` | Recovery surface |

Predicted state uses `resolveEpistemicStateV0` — same merge as §7 tick (interpretation only).

## APIs

`apps/client/src/rhizoh/runtime/epistemicCounterfactualGraphV0.js`

| Function | Role |
|----------|------|
| `enumerateCounterfactualsForTickV0(tickSeq)` | Branches for one tick |
| `buildEpistemicCounterfactualGraphV0()` | `actual:*` → `cf:*` edges |
| `evaluateCounterfactualSensitivityV0()` | Per-layer would-change ratio |
| `evaluateEpistemicCounterfactualV0()` | Report + `headline` |

Refreshes after `evaluateEpistemicCausalityV0`.

## Edge kinds

- `alternate` — actual tick → counterfactual branch
- `negated_cause` — `flag:*` → branch (cause removed)
- `minimal_fix` — actual → minimal joint fix path

## Distinction from violation-sim

| Layer | Nature |
|-------|--------|
| `violationSimulationSuiteV0` | Synthetic law stress (counterfactual scenarios) |
| `epistemicCounterfactualGraphV0` | **What-if on actual ledger ticks** tied to causality flags |

## Captain

```javascript
window.__rhizoh.epistemicCounterfactual.evaluate();
window.__rhizoh.epistemicCounterfactual.enumerateTick(4);
window.__rhizoh.epistemicCounterfactual.export();
```

## Related

- [`RHIZOH_EPISTEMIC_CAUSALITY_GRAPH_V0.1.md`](RHIZOH_EPISTEMIC_CAUSALITY_GRAPH_V0.1.md)
- [`RHIZOH_VIOLATION_SIMULATION_SUITE_V0.1.md`](RHIZOH_VIOLATION_SIMULATION_SUITE_V0.1.md)
