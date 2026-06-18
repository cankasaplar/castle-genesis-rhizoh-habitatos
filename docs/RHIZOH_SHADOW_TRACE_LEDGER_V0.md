# Rhizoh Shadow Trace Ledger v0

**SPECFLOW:** `RESEARCH-ONLY`  
**Complements:** [RHIZOH_EPISTEMIC_COUNCIL_V0.md](RHIZOH_EPISTEMIC_COUNCIL_V0.md) · [PHASE3D_SHADOW_LEARNING_BOUNDARY_V1.0.md](ops/PHASE3D_SHADOW_LEARNING_BOUNDARY_V1.0.md)

---

## 1. What Shadow Mode is (here)

Not staging. **Epistemic dry-run:**

| Active | Blocked |
|--------|---------|
| Chess Arena simulation | Execution authority |
| Drift + Council triggers | UI / product effect |
| Observation graph growth | Drift feedback from council rows |

Activation: legal hold (`isRhizohLegalPendingHoldV0`) or `VITE_RHIZOH_SHADOW_MODE=1`.

---

## 2. ShadowObservationRecord (evidence chain)

```text
ShadowObservationRecord {
  recordId,
  timestamp,
  sourceSystem,       // chess | map | council | compliance | stream
  eventType,
  entropyScore,
  causalChainId,
  policyContext,
  hypotheticalOutcome,  // counterfactual: if live kernel executed…
  trustClass,           // trusted | untrusted | adversarial (stream future)
  governance: {
    feedsDriftDetection: false,
    feedsMoveSelection: false,
    executionEffect: false,
    uiEffect: false
  }
}
```

**Log vs trace:** console `DRIFT_EVENT` = compressed telemetry; ledger row = **verifiable epistemic history**.

---

## 3. Compliance snapshot (06:44 / 19:44 style)

State export — not video:

```js
window.__rhizoh.exportShadowComplianceSnapshot?.('checkpoint')
```

Returns: `snapshotId`, `entropySummary`, `driftDeltaGraph`, `councilAggregate`, `timeoutCount`.

---

## 4. Boundaries (your review items)

| Topic | Rule |
|-------|------|
| Community pins | **Signal only** — confidence weighting, never reality authority |
| Semantic translator | **Presentation layer only** — never replaces kernel raw truth |
| Stream ingress | Classify `trusted / untrusted / adversarial` before council |
| Compliance-as-code | Inspection + replay + audit — **no execution path** |

---

## 5. Code

| Module | Role |
|--------|------|
| `rhizohShadowTraceLedgerV0.js` | Append ring + compliance export |
| `chessTelemetryLogV0.js` | DRIFT_EVENT → ledger |
| `rhizohEpistemicCouncilV0.js` | Council emit → ledger |
| `chessStockfishEngineV0.js` | Timeout → ledger |

DevTools:

```js
window.__rhizoh.shadowTraceLedger
window.__rhizoh.exportShadowComplianceSnapshot('daily')
```
