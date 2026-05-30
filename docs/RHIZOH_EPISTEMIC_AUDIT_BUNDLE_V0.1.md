# Rhizoh epistemic audit bundle v0.1

**SPECFLOW:** `CORE-ELIGIBLE` (ops evidence atom; read-only)

**Go-Live §6 kanıt paketinin atomu** — tek `correlationId`, tek `run`, tam export snapshot.

## Problem

Simulation, observability, synthesis, boundary, tick, ledger, and stability were separate captain calls. Auditors could not reproduce one sealed evidence unit.

## Solution

`epistemicAuditBundleV0.js` — `runEpistemicAuditBundleV0()`:

| Step | Layer |
|------|--------|
| 1 | `beginBreachCorrelationWindowV0` (unless `correlationId` passed) |
| 2 | `runViolationSimulationSuiteV0` (counterfactual; default on) |
| 3 | `runEpistemicTickV0` (playbook + boundary + observe + synthesis) |
| 4 | Observability slice for `correlationId` |
| 5 | Ledger slice + tick graph |
| 6 | Stability drift score + suppression |
| 7 | `endBreachCorrelationWindowV0` |

## Snapshot fields

- `simulation` — violation-sim report (`LAW_OK` / `LAW_FAIL`)
- `tick` — sanitized §7 report (no function refs)
- `observability` — breach trace slice
- `synthesis` — coherence for `correlationId`
- `boundary` — client vs gateway state
- `ledger` — last N tick nodes (default 32)
- `tickGraph` — sequential graph
- `stability` — `driftRiskScore`, `band`, breaches, suppression signals
- `gateHints` — `simulationLawOk`, `epistemicState`, `driftBand`, `evidenceComplete`

**Observation ≠ Execution** — bundle never enforces playbook modes.

## Captain

```javascript
const bundle = await window.__rhizoh.epistemicAuditBundle.run({
  collectSignals: () => window.__rhizoh.goLiveIntegrity.collect()
});

// SESSION_LOG paste
copy(window.__rhizoh.epistemicAuditBundle.formatSessionLog(bundle));

// Raw JSON
JSON.parse(window.__rhizoh.epistemicAuditBundle.export(bundle));
```

## Tests

```bash
npm run test -w apps/client -- src/rhizoh/runtime/__tests__/epistemicAuditBundleV0.test.js
```

## Related

- Cross-environment verification: [`RHIZOH_EPISTEMIC_REPRODUCIBILITY_LAYER_V0.1.md`](RHIZOH_EPISTEMIC_REPRODUCIBILITY_LAYER_V0.1.md)
- [`RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md`](RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md) §6
- [`RHIZOH_EPISTEMIC_TICK_ENGINE_V0.1.md`](RHIZOH_EPISTEMIC_TICK_ENGINE_V0.1.md)
- [`RHIZOH_EPISTEMIC_STABILITY_CONTROLLER_V0.1.md`](RHIZOH_EPISTEMIC_STABILITY_CONTROLLER_V0.1.md)
