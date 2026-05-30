# Rhizoh Reality Breach Observability (v0.1)

**Status:** SECURED — READ-ONLY truth trace layer  
**Tag:** `CORE-ELIGIBLE` (append-only log module) · **no execution authority**

**Stack position (7):** After Simulation + Attack Model — records **what actually happened**, not what would have happened.

| Layer | Question |
|-------|----------|
| Simulation | *If we injected X, what would we do?* (counterfactual) |
| **Observability** | *What did happen?* (factual, append-only) |
| Attack model | *Where could we break?* (hypothesis) |

---

## Critical distinction

| | Simulation | Observability |
|---|------------|----------------|
| Nature | Synthetic failure | Factual trace |
| Mutability | Test harness resets | Append-only ring (256) |
| Authority | None | **None** — no revoke/repair/quarantine from this module |
| Mixing risk | Epistemic hallucination regression if conflated | — |

**Rule:** `recordBreachObservationV0` **never** calls enforcement. Enforcement modules may call **observe** helpers after they act.

---

## Schema: `breach_observation_v0`

```json
{
  "schema": "castle.rhizoh.breach_observation.v0",
  "seq": 1,
  "atMs": 1710000000000,
  "violationClass": "PERCEPTION_INTEGRITY",
  "responseMode": "revoke",
  "source": "bootValidityTokenV0",
  "auto": true,
  "captainRequired": true,
  "detail": "Token mismatch — bootstrap revoked.",
  "walSnapshot": {
    "shadowWalTick": 0,
    "eventSeqTail": [1, 3, 2],
    "orderingMonotonic": false,
    "integritySystemState": "QUARANTINE"
  },
  "context": { }
}
```

| Field | Meaning |
|-------|---------|
| `violationClass` | TIME / DATA / PERCEPTION / CAUSAL / PEER / ONBOARDING |
| `responseMode` | shadow · revoke · quarantine · correction_chain |
| `source` | Module that **already** responded (not this log) |
| `auto` | System-recorded vs captain manual |
| `captainRequired` | Human follow-up recommended |
| `walSnapshot` | Optional divergence facts (not verdict) |

---

## Module

`apps/client/src/rhizoh/runtime/violationObservationLogV0.js`

| API | Role |
|-----|------|
| `recordBreachObservationV0(input)` | Append one factual entry |
| `getBreachObservationTraceV0()` | Read-only trace + `dropped` count |
| `getLastBreachObservationV0()` | Latest entry |
| `buildWalDivergenceSnapshotV0(signals)` | WAL / seq facts |
| `observePostGoLiveIntegrityBreachV0(result, signals)` | Non-`LIVE_OK` integrity |
| `observeBootValidityEnforcementBreachV0(enforcement, diskKey)` | Revoke / mismatch |
| `clearBreachObservationTraceForTestV0()` | Vitest only |

**Captain surfaces:**

- `window.__rhizoh_breach_observation` — full trace snapshot  
- `window.__rhizoh.breachObservation.trace()` / `.last()`

---

## Wired observers (v0.1)

| Source | When recorded |
|--------|----------------|
| `postGoLiveIntegrityLoopV0` | `evaluatePostGoLiveIntegrityV0` → not `LIVE_OK` |
| `bootValidityTokenV0` | `enforceRuntimeBootValidityTokenV0` → revoke path |

**Not yet wired:** peer WAL, recovery orchestrator, narrative orphan auto-hook (use manual `record` until v0.2).

---

## Tests

```bash
npm run test -w apps/client -- src/rhizoh/runtime/__tests__/violationObservationLogV0.test.js
```

---

## Correlation & synthesis (v0.1)

[`RHIZOH_BREACH_CORRELATION_SYNTHESIS_V0.1.md`](RHIZOH_BREACH_CORRELATION_SYNTHESIS_V0.1.md) — `correlationId` on entries · `synthesizeBreachCoherenceV0` · compound scenario `compound_orphan_and_ordering`.

## Honest gaps (A9–A11)

| Gap | Status |
|-----|--------|
| A9 compound fault | **v0.1** — per-check trace + synthesis report |
| A10 captain SPOF | Still window-backed; export manual |
| A11 gateway §7 | No edge publisher |

**v0.2:** `violationEnvelopeV0` + gateway fan-in.

---

## Related

| Doc | Role |
|-----|------|
| [`RHIZOH_VIOLATION_RESPONSE_PLAYBOOK_V1.md`](RHIZOH_VIOLATION_RESPONSE_PLAYBOOK_V1.md) | Response modes |
| [`RHIZOH_VIOLATION_SIMULATION_SUITE_V0.1.md`](RHIZOH_VIOLATION_SIMULATION_SUITE_V0.1.md) | Counterfactual law tests |
| [`RHIZOH_EXTERNAL_EPISTEMIC_ATTACK_MODEL_V0.1.md`](RHIZOH_EXTERNAL_EPISTEMIC_ATTACK_MODEL_V0.1.md) | Hypothesis generator |

---

*Simulation asks “what if?” Observability answers “what was?” — without becoming a second execution engine.*
