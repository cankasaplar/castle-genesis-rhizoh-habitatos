# Rhizoh Violation Simulation Suite (v0.1)

**Status:** SECURED — law stress tests (not product QA)  
**Tag:** `CORE-ELIGIBLE` (vitest) · complements [`RHIZOH_VIOLATION_RESPONSE_PLAYBOOK_V1.md`](RHIZOH_VIOLATION_RESPONSE_PLAYBOOK_V1.md)

**Purpose:** The playbook defines **what should happen**. This suite proves shipped modules **actually do it** under injected faults — without a centralized arbitration bus (yet).

---

## Honest architecture note

| Today | v0.1 suite |
|-------|------------|
| Distributed enforcement (many modules) | ✔ Scenarios hit real code paths |
| Centralized truth arbitration bus | ✘ **Not built** — `centralizedArbitrationBus: false` in report |
| Chaos harness (substrate immunity) | ✔ [`chaosHarnessV0.js`](../apps/client/src/rhizoh/runtime/continuity/chaosHarnessV0.js) — 7 anomalies |
| Playbook law scenarios | ✔ This suite — 9 scenarios |

**Why the gap is intentional (for now):** Unifying arbitration before law is stable would hide which layer failed. v0.1 validates **modes**; v0.2+ may add `violationEnvelopeV0` + gateway §7 publisher.

---

## Run

```bash
npm run test -w apps/client -- src/rhizoh/runtime/__tests__/violationSimulationSuiteV0.test.js
```

Programmatic (captain / CI):

```javascript
import { runViolationSimulationSuiteV0 } from "./rhizoh/runtime/violationSimulationSuiteV0.js";
const report = await runViolationSimulationSuiteV0({ print: true });
// report.allPassed === true → LAW_OK
```

**Module:** `apps/client/src/rhizoh/runtime/violationSimulationSuiteV0.js`

---

## Scenario matrix (playbook ↔ sim)

| ID | Injected fault | Violation class | Expected mode | Exercises |
|----|----------------|-----------------|---------------|-----------|
| `shadow_soft_init` | Onboarding contract | `ONBOARDING_INTENDED` | **Shadow** | SOFT_INIT, no boot token |
| `wal_ordering_drift` | `eventSeqs` regression | `CAUSAL_INTEGRITY` | **Quarantine** (DEGRADED signal) | `postGoLiveIntegrityLoopV0` |
| `wal_dual_failure_quarantine` | Ordering + orphan narrative | `DATA_INTEGRITY` | **Quarantine** | `system_state === QUARANTINE` |
| `wal_cursor_segment_mismatch` | Cursor/hash drift | `DATA_INTEGRITY` | **Correction chain** | `validateCursorSegmentAnchorV0` |
| `ghost_bootstrap_injection` | Fake boot token | `PERCEPTION_INTEGRITY` | **Revoke** | `enforceRuntimeBootValidityTokenV0` |
| `ui_orphan_narrative` | Text without provenance | `PERCEPTION_INTEGRITY` | **Quarantine** | `detectOrphanNarrativeOutputsV0` |
| `ui_missing_provenance_gate` | `narrativeProvenanceOk: false` | `PERCEPTION_INTEGRITY` | **Quarantine** | Layer trace fail |
| `peer_quarantine_stale` | Stale peer WAL | `PEER_INGRESS` | **Quarantine** | `simulatePeerWalScenarioV0('stale')` |
| `correction_hash_mutation_repair` | BAD hash at tick 3 | `DATA_INTEGRITY` | **Correction chain** | `continuityRecoveryOrchestratorV0` + repair kernel |
| `compound_orphan_and_ordering` | Orphan + seq regression (correlated) | `DATA_INTEGRITY` + `CAUSAL` | **Quarantine** (synthesis) | `synthesizeBreachCoherenceV0` · A9 |
| `external_boundary_divergence` | Client seq ahead of gateway | `PEER_INGRESS` / A11 | **Quarantine** | `externalBoundaryValidationV0` |

---

## What this suite is not

| Not in v0.1 | Where instead |
|-------------|---------------|
| Full browser UI E2E | Launch Polish Night manual + staging |
| Gateway §7 edge evaluator | Roadmap — client loop only |
| Frozen `phase*.js` mutation tests | `stabilization:validate-graph` (CI) |
| Marketing / lore copy | Outreach tone contract |

---

## Report shape

```json
{
  "schema": "castle.rhizoh.violation_simulation_suite.v0",
  "version": "0.1",
  "allPassed": true,
  "centralizedArbitrationBus": false,
  "scenarios": [
    { "id": "ghost_bootstrap_injection", "pass": true, "expectedMode": "revoke", "actualMode": "revoke", "violationClass": "PERCEPTION_INTEGRITY", "detail": "revoke+hardReload" }
  ]
}
```

**Pass bar:** `allPassed === true` before Go-Live §6 shift (recommended captain gate alongside §5 checklist).

---

## Related

| Doc / module | Role |
|--------------|------|
| [`RHIZOH_VIOLATION_RESPONSE_PLAYBOOK_V1.md`](RHIZOH_VIOLATION_RESPONSE_PLAYBOOK_V1.md) | Law |
| [`RHIZOH_OPERATIONAL_CONSTITUTION_V1.md`](RHIZOH_OPERATIONAL_CONSTITUTION_V1.md) | Articles I–III |
| [`chaosHarnessV0`](../apps/client/src/rhizoh/runtime/continuity/chaosHarnessV0.js) | Substrate immunity (7 anomalies) |
| [`POST_GO_LIVE_AUTONOMOUS_STABILITY_CONTRACT_V1.md`](POST_GO_LIVE_AUTONOMOUS_STABILITY_CONTRACT_V1.md) | Production thresholds |

---

## External red team (before observability v0.1)

Run the auditor lens against this suite: [`RHIZOH_EXTERNAL_EPISTEMIC_ATTACK_MODEL_V0.1.md`](RHIZOH_EXTERNAL_EPISTEMIC_ATTACK_MODEL_V0.1.md) — attacks A9 (compound fault) and A11 (gateway §7) are **open** relative to v0.1 sim.

---

## v0.2 roadmap (unified arbitration)

1. `violationEnvelopeV0` schema — `{ class, mode, source, atMs, auto, captainRequired }`  
2. Single reducer: playbook mode from any detector  
3. Gateway publisher for §7 `system_state`  
4. Suite asserts envelope equality across injectors  

---

*Defined law is not law until stressed. This suite is the first bar exam.*
