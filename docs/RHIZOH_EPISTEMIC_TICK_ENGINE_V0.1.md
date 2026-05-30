# Rhizoh Epistemic Tick Engine (v0.1) — §7 Convergence Layer

**Status:** SECURED — unified read-only tick under one `correlationId`  
**Tag:** `CORE-ELIGIBLE` · replaces raw evaluate-only §7 loop in captain path

**Unifies per tick:**

| Surface | Role |
|---------|------|
| `playbook.state()` | Post-go-live integrity (`LIVE_OK` / `DEGRADED` / `QUARANTINE`) |
| `boundary.validate()` | Client vs gateway seq alignment |
| `observability.trace()` | Factual `breach_observation_v0` rows for this tick |
| `synthesis.coherence()` | Compound fault + dominant mode interpretation |

**Output:** `epistemic_state` — worst-case merge of playbook + boundary + synthesis (interpretation only).

---

## Module

`apps/client/src/rhizoh/runtime/epistemicTickEngineV0.js`

| API | Role |
|-----|------|
| `runEpistemicTickV0(opts)` | Single unified tick |
| `startEpistemicTickLoopV0(opts)` | §7 T+0→300s @ interval (default 30s) |
| `resolveEpistemicStateV0(playbook, boundary, synthesis)` | Merge logic |

---

## Captain commands

```javascript
// One-shot unified tick
const tick = await window.__rhizoh.epistemicTick.run();

// §7 loop (preferred — wired from goLiveIntegrity.startLoop)
window.__rhizoh.goLiveIntegrity.startLoop({ durationMs: 300_000, intervalMs: 30_000 });

// Read last unified report
window.__rhizoh_epistemic_tick;
// tick.correlationId · tick.epistemic_state · tick.synthesis.systemicSummary
```

---

## Tick report shape (`epistemic_tick.v0`)

```json
{
  "schema": "castle.rhizoh.epistemic_tick.v0",
  "correlationId": "corr_…",
  "tickWindow": { "openedAtMs": 0, "closedAtMs": 0, "durationMs": 0 },
  "playbook": { "system_state": "QUARANTINE", "checks": {} },
  "boundary": { "boundary_state": "ALIGNED" },
  "observability": { "entries": [] },
  "synthesis": { "compoundFault": true, "dominantResponseMode": "quarantine" },
  "epistemic_state": "QUARANTINE",
  "centralizedArbitrationBus": false,
  "interpretationOnly": true
}
```

---

## `epistemic_state` merge rules

| Condition | Result |
|-----------|--------|
| Playbook `QUARANTINE` | `QUARANTINE` |
| Boundary `DIVERGED` + playbook not `LIVE_OK` | `QUARANTINE` |
| Playbook `DEGRADED` or boundary `DIVERGED` | `DEGRADED` |
| Synthesis `compoundFault` + playbook failure | `DEGRADED` (or `QUARANTINE` if playbook already there) |
| Else | `LIVE_OK` |

Enforcement (revoke / Level A) remains **playbook + captain** — tick engine does not execute.

---

## Pipeline (one tick)

```text
begin correlationId (tick window)
  → collectSignals()
  → playbook.evaluate(signals + correlationId)
  → boundary client + gateway fetch + evaluate
  → observability.filter(by correlationId)
  → synthesis.coherence(correlationId)
  → resolveEpistemicState
  → sync window mirrors
```

---

## Tests

```bash
npm run test -w apps/client -- src/rhizoh/runtime/__tests__/epistemicTickEngineV0.test.js
npm run test -w apps/client -- src/rhizoh/runtime/__tests__/epistemicTickLedgerV0.test.js
```

---

## Related

| Doc | Role |
|-----|------|
| [`RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md`](RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md) | §7 |
| [`RHIZOH_REALITY_BREACH_OBSERVABILITY_V0.1.md`](RHIZOH_REALITY_BREACH_OBSERVABILITY_V0.1.md) | Trace |
| [`RHIZOH_BREACH_CORRELATION_SYNTHESIS_V0.1.md`](RHIZOH_BREACH_CORRELATION_SYNTHESIS_V0.1.md) | Coherence |
| [`RHIZOH_EXTERNAL_BOUNDARY_VALIDATION_V0.1.md`](RHIZOH_EXTERNAL_BOUNDARY_VALIDATION_V0.1.md) | A11 |
| [`RHIZOH_EPISTEMIC_TICK_LEDGER_V0.1.md`](RHIZOH_EPISTEMIC_TICK_LEDGER_V0.1.md) | Cross-tick graph · A9 closure |
| [`RHIZOH_EPISTEMIC_STABILITY_CONTROLLER_V0.1.md`](RHIZOH_EPISTEMIC_STABILITY_CONTROLLER_V0.1.md) | Drift risk · suppression |

Each tick appends to the ledger by default (`recordLedger: false` to opt out). Stability runs after ledger (`recordStability: false` to opt out).

---

*Distributed modules, convergent tick — still no central execution arbiter.*
