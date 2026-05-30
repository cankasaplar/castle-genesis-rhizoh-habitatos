# Rhizoh Breach Correlation & Synthesis (v0.1)

**Status:** SECURED — READ-ONLY interpretation (not enforcement, not central arbiter)  
**Tag:** `CORE-ELIGIBLE` · sits on [`RHIZOH_REALITY_BREACH_OBSERVABILITY_V0.1.md`](RHIZOH_REALITY_BREACH_OBSERVABILITY_V0.1.md)

**Pipeline:**

```text
trace (factual) → correlationId → synthesizeBreachCoherence → systemic understanding
```

| Stage | Question |
|-------|----------|
| Observability | *What happened?* |
| **Synthesis** | *What does it mean together?* |
| Simulation | *What would we do if X?* (counterfactual — separate) |

**Still false:** `centralizedArbitrationBus` — synthesis **interprets**; it does not execute revoke/quarantine/repair.

---

## Modules

| Module | Role |
|--------|------|
| `breachCorrelationWindowV0.js` | Active `correlationId` window (shared state only) |
| `breachCorrelationSynthesisV0.js` | Coherence report + mode precedence |
| `violationObservationLogV0.js` | Entries tagged with `correlationId` |

---

## APIs

| API | Role |
|-----|------|
| `beginBreachCorrelationWindowV0({ label })` | Open incident window → `corr_*` id |
| `endBreachCorrelationWindowV0()` | Close window |
| `synthesizeBreachCoherenceV0({ correlationId, windowMs, sinceSeq })` | Global READ-ONLY report |
| `resolveDominantResponseModeV0(modes)` | Precedence: revoke → quarantine → correction → shadow |

**Captain:**

```javascript
const cid = window.__rhizoh.breachSynthesis.beginWindow({ label: "staging_incident" });
// ... faults occur ...
const report = window.__rhizoh.breachSynthesis.coherence({ correlationId: cid });
window.__rhizoh.breachSynthesis.endWindow();
```

---

## Schema: `breach_coherence_report_v0`

| Field | Meaning |
|-------|---------|
| `correlationId` | Incident grouping |
| `entryCount` | Factual lines in scope |
| `violationClasses` | Union of classes / failed checks |
| `compoundFault` | Multi-signal or multi-entry |
| `dominantResponseMode` | **Interpretation** via precedence — not auto-execution |
| `systemicSummary` | Human-readable coherence sentence |
| `interpretationOnly` | Always `true` |

---

## Compound fault (A9)

When correlation window is open and post-go-live has **multiple failed checks**, `observePostGoLiveIntegrityBreachV0` records **one entry per check** with the same `correlationId`.

**Sim scenario:** `compound_orphan_and_ordering` in [`violationSimulationSuiteV0.js`](../apps/client/src/rhizoh/runtime/violationSimulationSuiteV0.js).

```bash
npm run test -w apps/client -- src/rhizoh/runtime/__tests__/breachCorrelationSynthesisV0.test.js
npm run test -w apps/client -- src/rhizoh/runtime/__tests__/violationSimulationSuiteV0.test.js
```

---

## v0.2 (not yet)

| Item | Closes |
|------|--------|
| Gateway §7 observer | A11 measurable network/client split |
| `violationEnvelopeV0` bus | Single publish format (still read-only consumers) |
| SESSION_LOG export helper | A9–A11 regression audit artifact |

---

## Related

| Doc | Role |
|-----|------|
| [`RHIZOH_EXTERNAL_EPISTEMIC_ATTACK_MODEL_V0.1.md`](RHIZOH_EXTERNAL_EPISTEMIC_ATTACK_MODEL_V0.1.md) | Hypothesis A9 |
| [`RHIZOH_VIOLATION_RESPONSE_PLAYBOOK_V1.md`](RHIZOH_VIOLATION_RESPONSE_PLAYBOOK_V1.md) | Mode precedence source |

---

*Log proves events. Synthesis proposes meaning. Only enforcement changes reality.*
